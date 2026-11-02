package com.hackathonos.backend.stateless;

import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.storage.InMemoryFileStorage;
import com.hackathonos.backend.common.storage.StoredFile;
import com.hackathonos.backend.common.storage.UploadsController;
import com.hackathonos.backend.users.AvatarImageProcessor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AvatarFileStorageTest {

    private InMemoryFileStorage fileStorage;
    private AvatarImageProcessor imageProcessor;
    private UploadsController uploadsController;

    @BeforeEach
    void setUp() {
        fileStorage = new InMemoryFileStorage();
        imageProcessor = new AvatarImageProcessor();
        uploadsController = new UploadsController(fileStorage);
    }

    @Test
    @DisplayName("Avatar processor rejects non-image / SVG files by magic bytes")
    void testRejectsInvalidImageMagicBytes() {
        byte[] textFile = "Not an image file".getBytes(StandardCharsets.UTF_8);
        assertThatThrownBy(() -> imageProcessor.processAvatarImage(textFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only PNG, JPEG, and WebP images are allowed");

        byte[] svgFile = "<svg xmlns='http://www.w3.org/2000/svg'></svg>".getBytes(StandardCharsets.UTF_8);
        assertThatThrownBy(() -> imageProcessor.processAvatarImage(svgFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only PNG, JPEG, and WebP images are allowed");
    }

    @Test
    @DisplayName("Avatar processor resizes 600x400 image to max 256 dimension, strips metadata, and re-encodes under 150KB")
    void testProcessesAndResizesImage() throws IOException {
        // Create a 600x400 image
        BufferedImage img = new BufferedImage(600, 400, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(Color.BLUE);
        g.fillRect(0, 0, 600, 400);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        byte[] pngBytes = baos.toByteArray();

        AvatarImageProcessor.ProcessedAvatar processed = imageProcessor.processAvatarImage(pngBytes);

        assertThat(processed.width()).isEqualTo(256);
        assertThat(processed.height()).isEqualTo(171); // 400 * (256/600) = 170.67 -> 171
        assertThat(processed.contentType()).isEqualTo("image/jpeg");
        assertThat(processed.bytes().length).isLessThan(150 * 1024);

        // Put to InMemoryFileStorage
        String key = "avatars/user-123_abc.jpg";
        fileStorage.put(key, new ByteArrayInputStream(processed.bytes()), processed.contentType(), processed.bytes().length);

        assertThat(fileStorage.exists(key)).isTrue();
        StoredFile stored = fileStorage.get(key).orElseThrow();
        assertThat(stored.contentLength()).isEqualTo(processed.bytes().length);
        assertThat(stored.contentType()).isEqualTo("image/jpeg");

        // Serve via UploadsController
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/uploads/" + key);
        ResponseEntity<Resource> response = uploadsController.serveUpload(req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getCacheControl()).contains("public");
        assertThat(response.getHeaders().getCacheControl()).contains("immutable");

        // Cleanup
        assertThat(fileStorage.delete(key)).isTrue();
        assertThat(fileStorage.exists(key)).isFalse();

        // 404 on missing
        ResponseEntity<Resource> missingResponse = uploadsController.serveUpload(req);
        assertThat(missingResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}

