package com.hackathonos.backend.brief;

import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.PayloadTooLargeException;
import com.hackathonos.backend.common.error.UnprocessableEntityException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Validates and extracts text from PDF files up to 200,000 characters.
 */
@Component
public class BriefPdfParser {

    private static final Logger log = LoggerFactory.getLogger(BriefPdfParser.class);
    private static final int MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    private static final int MAX_CHARS = 200_000;

    /**
     * Extracts text from PDF byte array.
     */
    public String extractText(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw new BadRequestException("NOT_A_PDF", "File is empty");
        }
        if (bytes.length > MAX_PDF_SIZE_BYTES) {
            throw new PayloadTooLargeException("PDF_TOO_LARGE", "PDF exceeds 10MB limit");
        }
        if (bytes.length < 4 || bytes[0] != '%' || bytes[1] != 'P' || bytes[2] != 'D' || bytes[3] != 'F') {
            throw new BadRequestException("NOT_A_PDF", "File does not start with %PDF magic bytes");
        }

        try (PDDocument document = Loader.loadPDF(bytes)) {
            if (document.isEncrypted()) {
                throw new UnprocessableEntityException("PDF_PROTECTED", "This PDF is password protected");
            }
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            if (text == null || text.trim().isEmpty()) {
                throw new UnprocessableEntityException("NO_TEXT_IN_PDF", "This PDF looks scanned (only images). Paste the text instead");
            }
            String result = text.trim();
            if (result.length() > MAX_CHARS) {
                result = result.substring(0, MAX_CHARS);
            }
            return result;
        } catch (InvalidPasswordException e) {
            log.warn("Failed to parse PDF: {} - {}", e.getClass().getName(), e.getMessage());
            throw new UnprocessableEntityException("PDF_PROTECTED", "This PDF is password protected");
        } catch (UnprocessableEntityException | PayloadTooLargeException | BadRequestException e) {
            throw e;
        } catch (IOException e) {
            log.warn("Failed to parse PDF: {} - {}", e.getClass().getName(), e.getMessage());
            throw new BadRequestException("NOT_A_PDF", "Unable to read PDF: " + e.getMessage());
        } catch (Exception e) {
            log.warn("Failed to parse PDF: {} - {}", e.getClass().getName(), e.getMessage());
            throw new BadRequestException("NOT_A_PDF", "Unable to parse PDF: " + e.getMessage());
        }
    }
}
