package com.hackathonos.backend.files;

import com.hackathonos.backend.common.error.FileExtractionException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.IBodyElement;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Unified file text extraction service supporting PDF, DOCX, and Markdown/plain text.
 * Strictly checks magic bytes, bounds execution to 5 concurrent tasks with a 20-second timeout,
 * sanitizes text, guards against zip-bombs, and detects scanned PDFs without OCR.
 */
@Service
public class FileTextExtractor {

    private static final Logger log = LoggerFactory.getLogger(FileTextExtractor.class);

    private static final int MAX_PAGES = 80;
    private static final int MAX_CHARS = 200_000;
    private static final long MAX_FILE_SIZE = 12 * 1024 * 1024L; // 12 MB
    private static final long MAX_DOCX_UNCOMPRESSED = 25 * 1024 * 1024L; // 25 MB
    private static final int MAX_DOCX_ENTRIES = 2_000;
    private static final int TIMEOUT_SECONDS = 20;

    private static final Pattern PAGE_NUMBER_PATTERN =
            Pattern.compile("(?i)^\\s*(?:page\\s*)?\\d+(?:\\s*(?:of|/)\\s*\\d+)?\\s*$");
    private static final Pattern HYPHEN_BREAK_PATTERN =
            Pattern.compile("(\\b[a-zA-Z]+)-\\n([a-zA-Z]+\\b)");
    private static final Pattern CONTROL_CHARS_PATTERN =
            Pattern.compile("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]");
    private static final Pattern MULTI_BLANKS_PATTERN =
            Pattern.compile("\\n{3,}");

    public record ExtractionResult(
            String text,
            int pages,
            boolean truncated,
            String method,
            List<String> warnings
    ) {}


    // Bounded executor with at most 5 concurrent tasks and queue capacity
    private final ExecutorService executor = new ThreadPoolExecutor(
            2,
            5,
            60L,
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(20),
            new ThreadPoolExecutor.AbortPolicy()
    );

    public ExtractionResult extractText(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileExtractionException("FILE_UNREADABLE", "Uploaded file is empty.", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileExtractionException("FILE_TOO_LARGE", "File size exceeds 12MB limit.", HttpStatus.PAYLOAD_TOO_LARGE);
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new FileExtractionException("FILE_UNREADABLE", "Could not read uploaded file.", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        return extractText(bytes);
    }

    public ExtractionResult extractText(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw new FileExtractionException("FILE_UNREADABLE", "File content is empty.", HttpStatus.BAD_REQUEST);
        }
        if (bytes.length > MAX_FILE_SIZE) {
            throw new FileExtractionException("FILE_TOO_LARGE", "File size exceeds 12MB limit.", HttpStatus.PAYLOAD_TOO_LARGE);
        }

        Future<ExtractionResult> future;
        try {
            future = executor.submit(() -> doExtract(bytes));
        } catch (RejectedExecutionException ex) {
            throw new FileExtractionException("FILE_TIMEOUT", "Server is busy with other file extractions. Please retry shortly.", HttpStatus.TOO_MANY_REQUESTS);
        }

        try {
            return future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (TimeoutException ex) {
            future.cancel(true);
            throw new FileExtractionException("FILE_TIMEOUT", "File text extraction timed out after 20 seconds.", HttpStatus.REQUEST_TIMEOUT);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new FileExtractionException("FILE_UNREADABLE", "Extraction process was interrupted.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (ExecutionException ex) {
            Throwable cause = ex.getCause();
            if (cause instanceof FileExtractionException fee) {
                throw fee;
            }
            log.warn("Extraction failure: {}", cause.getClass().getSimpleName());
            throw new FileExtractionException("FILE_UNREADABLE", "Unable to extract text from the uploaded file.", HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    private ExtractionResult doExtract(byte[] bytes) {
        if (isPdf(bytes)) {
            return extractPdf(bytes);
        }
        if (isDocx(bytes)) {
            return extractDocx(bytes);
        }
        if (isTextOrMarkdown(bytes)) {
            return extractPlainText(bytes);
        }

        throw new FileExtractionException("FILE_TYPE_UNSUPPORTED", "Unsupported file type. Only PDF, DOCX, Markdown, and plain text files are supported.", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    private boolean isPdf(byte[] bytes) {
        return bytes.length >= 4 &&
                bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F';
    }

    private boolean isDocx(byte[] bytes) {
        return bytes.length >= 4 &&
                bytes[0] == 0x50 && bytes[1] == 0x4B && bytes[2] == 0x03 && bytes[3] == 0x04;
    }

    public record DecodedText(String text, String encoding) {}

    public static DecodedText decodeText(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return new DecodedText("", "UTF-8");
        }
        // UTF-8 BOM
        if (bytes.length >= 3 && (bytes[0] & 0xFF) == 0xEF && (bytes[1] & 0xFF) == 0xBB && (bytes[2] & 0xFF) == 0xBF) {
            return new DecodedText(new String(bytes, 3, bytes.length - 3, StandardCharsets.UTF_8), "UTF-8");
        }
        // UTF-16LE BOM
        if (bytes.length >= 2 && (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xFE) {
            return new DecodedText(new String(bytes, 2, bytes.length - 2, StandardCharsets.UTF_16LE), "UTF-16LE");
        }
        // UTF-16BE BOM
        if (bytes.length >= 2 && (bytes[0] & 0xFF) == 0xFE && (bytes[1] & 0xFF) == 0xFF) {
            return new DecodedText(new String(bytes, 2, bytes.length - 2, StandardCharsets.UTF_16BE), "UTF-16BE");
        }
        // Try UTF-8
        try {
            CharsetDecoder decoder = StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT);
            String text = decoder.decode(ByteBuffer.wrap(bytes)).toString();
            return new DecodedText(text, "UTF-8");
        } catch (CharacterCodingException e) {
            // Fallback to windows-1252
            String text = new String(bytes, java.nio.charset.Charset.forName("windows-1252"));
            return new DecodedText(text, "windows-1252");
        }
    }

    private boolean isTextOrMarkdown(byte[] bytes) {
        if (bytes.length == 0) return false;
        // Check BOM for UTF-16 or UTF-8
        if (bytes.length >= 2 && (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xFE) return true;
        if (bytes.length >= 2 && (bytes[0] & 0xFF) == 0xFE && (bytes[1] & 0xFF) == 0xFF) return true;
        if (bytes.length >= 3 && (bytes[0] & 0xFF) == 0xEF && (bytes[1] & 0xFF) == 0xBB && (bytes[2] & 0xFF) == 0xBF) return true;

        DecodedText decoded = decodeText(bytes);
        if (decoded.text().contains("\0")) {
            return false;
        }

        int nonPrintable = 0;
        int checkLen = Math.min(bytes.length, 4096);
        for (int i = 0; i < checkLen; i++) {
            byte b = bytes[i];
            if (b == 0x00) return false;
            if (b < 0x09 || (b > 0x0D && b < 0x20 && b != 0x1B)) {
                nonPrintable++;
            }
        }
        return (double) nonPrintable / checkLen < 0.05;
    }

    private ExtractionResult extractPdf(byte[] bytes) {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            if (document.isEncrypted()) {
                throw new FileExtractionException("FILE_ENCRYPTED", "This PDF is password protected.", HttpStatus.UNPROCESSABLE_ENTITY);
            }

            int totalPages = document.getNumberOfPages();
            if (totalPages == 0) {
                throw new FileExtractionException("FILE_NO_TEXT", "This PDF has no pages.", HttpStatus.UNPROCESSABLE_ENTITY);
            }

            int pagesToExtract = Math.min(totalPages, MAX_PAGES);
            boolean truncated = totalPages > MAX_PAGES;
            List<String> warnings = new ArrayList<>();
            if (truncated) {
                warnings.add("PDF exceeds 80 pages. Only the first 80 pages were extracted.");
            }

            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);

            List<List<String>> pagesLines = new ArrayList<>();
            StringBuilder combined = new StringBuilder();

            for (int p = 1; p <= pagesToExtract; p++) {
                stripper.setStartPage(p);
                stripper.setEndPage(p);
                String pageText = stripper.getText(document);
                combined.append(pageText).append("\n");

                String[] lines = pageText.split("\\r?\\n");
                List<String> lineList = new ArrayList<>();
                for (String l : lines) {
                    String trimmed = l.trim();
                    if (!trimmed.isEmpty()) {
                        lineList.add(trimmed);
                    }
                }
                pagesLines.add(lineList);
            }

            String cleaned = cleanText(combined.toString(), pagesLines);

            if (cleaned.length() > MAX_CHARS) {
                cleaned = cleaned.substring(0, MAX_CHARS);
                truncated = true;
                warnings.add("Extracted text was truncated to 200,000 characters.");
            }

            double avgCharsPerPage = pagesToExtract > 0 ? (double) cleaned.length() / pagesToExtract : 0;
            if (avgCharsPerPage < 40.0) {
                throw new FileExtractionException(
                        "FILE_NO_TEXT",
                        "This PDF looks scanned (images only). Upload a PDF with selectable text, or paste the text.",
                        HttpStatus.UNPROCESSABLE_ENTITY
                );
            }

            return new ExtractionResult(cleaned, totalPages, truncated, "PDF", warnings);
        } catch (InvalidPasswordException e) {
            throw new FileExtractionException("FILE_ENCRYPTED", "This PDF is password protected.", HttpStatus.UNPROCESSABLE_ENTITY);
        } catch (FileExtractionException fee) {
            throw fee;
        } catch (IOException e) {
            log.warn("PDFBox extraction error: {}", e.getClass().getSimpleName());
            throw new FileExtractionException("FILE_UNREADABLE", "Could not read PDF: " + e.getMessage(), HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    private ExtractionResult extractDocx(byte[] bytes) {
        // Zip-bomb guard and document.xml presence check
        int entryCount = 0;
        long totalUncompressedBytes = 0;
        boolean foundDocumentXml = false;

        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(bytes))) {
            ZipEntry entry;
            byte[] buffer = new byte[8192];
            while ((entry = zis.getNextEntry()) != null) {
                entryCount++;
                if (entryCount > MAX_DOCX_ENTRIES) {
                    throw new FileExtractionException("FILE_TOO_LARGE", "Document exceeds safety limit of 2,000 zip entries.", HttpStatus.PAYLOAD_TOO_LARGE);
                }
                if ("word/document.xml".equalsIgnoreCase(entry.getName())) {
                    foundDocumentXml = true;
                }
                int n;
                while ((n = zis.read(buffer)) != -1) {
                    totalUncompressedBytes += n;
                    if (totalUncompressedBytes > MAX_DOCX_UNCOMPRESSED) {
                        throw new FileExtractionException("FILE_TOO_LARGE", "Document exceeds safety limit of 25MB uncompressed.", HttpStatus.PAYLOAD_TOO_LARGE);
                    }
                }
            }
        } catch (IOException e) {
            throw new FileExtractionException("FILE_UNREADABLE", "Invalid or corrupted zip archive.", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        if (!foundDocumentXml) {
            throw new FileExtractionException("FILE_TYPE_UNSUPPORTED", "The file is not a valid Word (.docx) document.", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        StringBuilder sb = new StringBuilder();
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(bytes))) {
            for (IBodyElement elem : doc.getBodyElements()) {
                if (elem instanceof XWPFParagraph p) {
                    String text = p.getText();
                    if (text != null && !text.isBlank()) {
                        sb.append(text).append("\n");
                    }
                } else if (elem instanceof XWPFTable table) {
                    for (XWPFTableRow row : table.getRows()) {
                        List<String> cells = new ArrayList<>();
                        for (XWPFTableCell cell : row.getTableCells()) {
                            cells.add(cell.getText() != null ? cell.getText().trim() : "");
                        }
                        sb.append(String.join("\t", cells)).append("\n");
                    }
                }
            }
        } catch (Exception e) {
            log.warn("DOCX extraction error: {}", e.getClass().getSimpleName());
            throw new FileExtractionException("FILE_UNREADABLE", "Could not parse Word document: " + e.getMessage(), HttpStatus.UNPROCESSABLE_ENTITY);
        }

        String cleaned = cleanText(sb.toString(), null);
        boolean truncated = false;
        List<String> warnings = new ArrayList<>();
        if (cleaned.length() > MAX_CHARS) {
            cleaned = cleaned.substring(0, MAX_CHARS);
            truncated = true;
            warnings.add("Extracted text was truncated to 200,000 characters.");
        }

        int pages = Math.max(1, (int) Math.ceil((double) cleaned.length() / 2500));
        return new ExtractionResult(cleaned, pages, truncated, "DOCX", warnings);
    }

    private ExtractionResult extractPlainText(byte[] bytes) {
        DecodedText decoded = decodeText(bytes);
        String cleaned = cleanText(decoded.text(), null);
        boolean truncated = false;
        List<String> warnings = new ArrayList<>();
        if (cleaned.length() > MAX_CHARS) {
            cleaned = cleaned.substring(0, MAX_CHARS);
            truncated = true;
            warnings.add("Extracted text was truncated to 200,000 characters.");
        }

        int pages = Math.max(1, (int) Math.ceil((double) cleaned.length() / 2500));
        return new ExtractionResult(cleaned, pages, truncated, "TEXT", warnings);
    }

    private String cleanText(String text, List<List<String>> pagesLines) {
        if (text == null || text.isEmpty()) {
            return "";
        }

        // 1. Normalise line endings
        String s = text.replace("\r\n", "\n").replace("\r", "\n");

        // 2. Join words broken by a hyphen at a line end
        s = HYPHEN_BREAK_PATTERN.matcher(s).replaceAll("$1$2");

        // 3. Strip control characters (keep \n, \t)
        s = CONTROL_CHARS_PATTERN.matcher(s).replaceAll("");

        // 4. Identify headers and footers repeated on > half the pages
        Set<String> repeatedLines = new HashSet<>();
        if (pagesLines != null && pagesLines.size() > 2) {
            int threshold = pagesLines.size() / 2;
            Map<String, Integer> lineOccurrences = new HashMap<>();
            for (List<String> page : pagesLines) {
                Set<String> uniqueOnPage = new HashSet<>(page);
                for (String l : uniqueOnPage) {
                    lineOccurrences.put(l, lineOccurrences.getOrDefault(l, 0) + 1);
                }
            }
            for (Map.Entry<String, Integer> entry : lineOccurrences.entrySet()) {
                if (entry.getValue() > threshold && entry.getKey().length() < 120) {
                    repeatedLines.add(entry.getKey());
                }
            }
        }

        // 5. Filter out pure page-number lines and headers/footers
        String[] lines = s.split("\n");
        StringBuilder out = new StringBuilder();
        for (String line : lines) {
            String trimmed = line.trim();
            if (PAGE_NUMBER_PATTERN.matcher(trimmed).matches()) {
                continue;
            }
            if (!trimmed.isEmpty() && repeatedLines.contains(trimmed)) {
                continue;
            }
            out.append(line).append("\n");
        }

        // 6. Collapse more than two blank lines
        String result = MULTI_BLANKS_PATTERN.matcher(out.toString()).replaceAll("\n\n");
        return result.trim();
    }
}
