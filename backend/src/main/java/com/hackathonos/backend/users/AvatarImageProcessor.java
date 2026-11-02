package com.hackathonos.backend.users;

import com.hackathonos.backend.common.error.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;

@Component
public class AvatarImageProcessor {

    private static final Logger log = LoggerFactory.getLogger(AvatarImageProcessor.class);
    private static final int MAX_DIMENSION = 256;
    private static final int TARGET_MAX_BYTES = 150 * 1024; // 150KB

    public record ProcessedAvatar(byte[] bytes, String contentType, int width, int height) {}

    public ProcessedAvatar processAvatarImage(byte[] rawBytes) {
        if (rawBytes == null || rawBytes.length == 0) {
            throw new BadRequestException("EMPTY_FILE", "Image file is empty");
        }

        // 1. Magic bytes validation
        boolean isPng = rawBytes.length >= 8 &&
                (rawBytes[0] & 0xFF) == 0x89 && rawBytes[1] == 0x50 && rawBytes[2] == 0x4E && rawBytes[3] == 0x47;
        boolean isJpeg = rawBytes.length >= 3 &&
                (rawBytes[0] & 0xFF) == 0xFF && (rawBytes[1] & 0xFF) == 0xD8 && (rawBytes[2] & 0xFF) == 0xFF;
        boolean isWebp = rawBytes.length >= 12 &&
                rawBytes[0] == 'R' && rawBytes[1] == 'I' && rawBytes[2] == 'F' && rawBytes[3] == 'F' &&
                rawBytes[8] == 'W' && rawBytes[9] == 'E' && rawBytes[10] == 'B' && rawBytes[11] == 'P';

        if (!isPng && !isJpeg && !isWebp) {
            throw new BadRequestException("INVALID_IMAGE_TYPE", "Only PNG, JPEG, and WebP images are allowed. SVG and GIF are rejected.");
        }

        // 2. Decode with ImageIO
        BufferedImage original;
        try {
            original = ImageIO.read(new ByteArrayInputStream(rawBytes));
        } catch (IOException e) {
            throw new BadRequestException("INVALID_IMAGE", "Could not decode uploaded image: " + e.getMessage());
        }

        if (original == null) {
            throw new BadRequestException("INVALID_IMAGE", "Could not decode uploaded image");
        }

        int origW = original.getWidth();
        int origH = original.getHeight();

        // 3. Resize to max 256x256 while preserving aspect ratio
        double scale = Math.min(1.0, Math.min((double) MAX_DIMENSION / origW, (double) MAX_DIMENSION / origH));
        int targetW = Math.max(1, (int) Math.round(origW * scale));
        int targetH = Math.max(1, (int) Math.round(origH * scale));

        BufferedImage resized = new BufferedImage(targetW, targetH, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resized.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Fill background white to handle PNG transparency
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, targetW, targetH);
        g2d.drawImage(original, 0, 0, targetW, targetH, null);
        g2d.dispose();

        // 4. Strip metadata and re-encode to JPEG under 150KB
        byte[] encoded = encodeJpeg(resized, 0.85f);
        if (encoded.length > TARGET_MAX_BYTES) {
            encoded = encodeJpeg(resized, 0.70f);
        }

        return new ProcessedAvatar(encoded, "image/jpeg", targetW, targetH);
    }

    private byte[] encodeJpeg(BufferedImage image, float quality) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
            if (!writers.hasNext()) {
                ImageIO.write(image, "jpg", baos);
                return baos.toByteArray();
            }

            ImageWriter writer = writers.next();
            ImageWriteParam param = writer.getDefaultWriteParam();
            if (param.canWriteCompressed()) {
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(quality);
            }

            try (ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {
                writer.setOutput(ios);
                writer.write(null, new IIOImage(image, null, null), param);
            }
            writer.dispose();
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to encode processed avatar image", e);
        }
    }
}

