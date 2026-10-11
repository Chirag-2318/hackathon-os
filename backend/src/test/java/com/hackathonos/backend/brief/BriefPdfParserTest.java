package com.hackathonos.backend.brief;

import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.PayloadTooLargeException;
import com.hackathonos.backend.common.error.UnprocessableEntityException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

class BriefPdfParserTest {

    private final BriefPdfParser parser = new BriefPdfParser();

    @Test
    void testRejectsNonPdf() {
        byte[] textFile = "This is a plain text file".getBytes();
        BadRequestException ex = assertThrows(BadRequestException.class, () -> parser.extractText(textFile));
        assertEquals("NOT_A_PDF", ex.getCode());
    }

    @Test
    void testRejectsOversize() {
        byte[] large = new byte[10 * 1024 * 1024 + 10];
        large[0] = '%'; large[1] = 'P'; large[2] = 'D'; large[3] = 'F';
        PayloadTooLargeException ex = assertThrows(PayloadTooLargeException.class, () -> parser.extractText(large));
        assertEquals("PDF_TOO_LARGE", ex.getCode());
    }

    @Test
    void testExtractsSelectableTextFromPdf() throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage();
            doc.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(doc, page)) {
                content.beginText();
                content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                content.newLineAtOffset(100, 700);
                content.showText("Hackathon Brief 2026: Build an AI Operating System");
                content.endText();
            }
            doc.save(baos);
        }

        String extracted = parser.extractText(baos.toByteArray());
        assertTrue(extracted.contains("Hackathon Brief 2026: Build an AI Operating System"));
    }

    @Test
    void testRejectsNoTextInPdf() throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PDDocument doc = new PDDocument()) {
            PDPage emptyPage = new PDPage();
            doc.addPage(emptyPage);
            doc.save(baos);
        }

        UnprocessableEntityException ex = assertThrows(UnprocessableEntityException.class, () -> parser.extractText(baos.toByteArray()));
        assertEquals("NO_TEXT_IN_PDF", ex.getCode());
    }
}
