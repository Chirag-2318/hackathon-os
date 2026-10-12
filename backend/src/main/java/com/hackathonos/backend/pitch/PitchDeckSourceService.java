package com.hackathonos.backend.pitch;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.users.User;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.UUID;

/**
 * Service managing room presentation source links and uploaded slide deck files.
 */
@Service
public class PitchDeckSourceService {

    private static final long MAX_FILE_SIZE = 25L * 1024 * 1024; // 25 MB

    private final PitchDeckSourceRepository sourceRepository;
    private final RoomAccess roomAccess;
    private final AppProperties appProperties;

    public PitchDeckSourceService(
            PitchDeckSourceRepository sourceRepository,
            RoomAccess roomAccess,
            AppProperties appProperties
    ) {
        this.sourceRepository = sourceRepository;
        this.roomAccess = roomAccess;
        this.appProperties = appProperties;
    }

    /**
     * Gets the saved deck source for a room, or null if none.
     */
    @Transactional(readOnly = true)
    public PitchDtos.PitchDeckSourceDto getSource(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        return sourceRepository.findById(roomId).map(this::toDto).orElse(null);
    }

    /**
     * Saves or updates the deck source with link validation and automatic embed URL generation.
     */
    @Transactional
    public PitchDtos.PitchDeckSourceDto saveSource(UUID roomId, User user, PitchDtos.SaveDeckSourceRequest req) {
        roomAccess.requireMember(roomId, user);
        if (req.provider() == null || req.url() == null) {
            throw new BadRequestException("INVALID_REQUEST", "Provider and URL are required");
        }

        String provider = req.provider().trim().toLowerCase();
        String url = req.url().trim();
        DeckEmbed.validateHost(provider, url);

        String embedUrl = DeckEmbed.buildEmbedUrl(provider, url);

        PitchDeckSource source = sourceRepository.findById(roomId).orElseGet(() -> {
            PitchDeckSource s = new PitchDeckSource();
            s.setRoomId(roomId);
            return s;
        });

        source.setProvider(provider);
        source.setUrl(url);
        source.setTitle(req.title() != null ? req.title().trim() : "");
        source.setEmbedUrl(embedUrl);
        source.setUpdatedBy(user.getId());
        source.setUpdatedAt(Instant.now());

        PitchDeckSource saved = sourceRepository.save(source);
        return toDto(saved);
    }

    /**
     * Deletes the deck source; room leader only.
     */
    @Transactional
    public void deleteSource(UUID roomId, User user) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        if (!"leader".equalsIgnoreCase(member.getRole())) {
            throw new ForbiddenException("FORBIDDEN", "Only room leaders can disconnect or delete the deck source");
        }
        sourceRepository.findById(roomId).ifPresent(source -> {
            if (source.getFilePath() != null) {
                try {
                    Files.deleteIfExists(Paths.get(source.getFilePath()));
                } catch (Exception ignored) {}
            }
            sourceRepository.delete(source);
        });
    }

    /**
     * Uploads a PDF or PPTX deck file (up to 25 MB) with magic-byte verification.
     */
    @Transactional
    public PitchDtos.PitchDeckSourceDto uploadFile(UUID roomId, User user, MultipartFile file) throws IOException {
        roomAccess.requireMember(roomId, user);
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("EMPTY_FILE", "Upload file cannot be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("FILE_TOO_LARGE", "File size exceeds 25 MB limit");
        }

        byte[] header = new byte[8];
        try (InputStream is = file.getInputStream()) {
            int read = is.read(header);
            if (read < 4) {
                throw new BadRequestException("INVALID_FILE_TYPE", "File is corrupted or unrecognized");
            }
        }

        boolean isPdf = header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46; // %PDF
        boolean isPptx = header[0] == 0x50 && header[1] == 0x4B && header[2] == 0x03 && header[3] == 0x04; // PK..
        if (!isPdf && !isPptx) {
            throw new BadRequestException("INVALID_FILE_TYPE", "Only PDF and PPTX files are permitted");
        }

        String ext = isPdf ? ".pdf" : ".pptx";
        String uploadDirStr = appProperties.getUploadDir();
        Path uploadDirPath = Paths.get(uploadDirStr);
        if (!Files.exists(uploadDirPath)) {
            Files.createDirectories(uploadDirPath);
        }

        String fileName = "deck_" + roomId + "_" + UUID.randomUUID() + ext;
        Path targetPath = uploadDirPath.resolve(fileName);
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);
        }

        String fileUrl = "/api/v1/rooms/" + roomId + "/pitch/deck/source/file";
        PitchDeckSource source = sourceRepository.findById(roomId).orElseGet(() -> {
            PitchDeckSource s = new PitchDeckSource();
            s.setRoomId(roomId);
            return s;
        });

        source.setProvider("pptx");
        source.setUrl(fileUrl);
        String origName = file.getOriginalFilename();
        source.setTitle(origName != null ? origName : "Uploaded Slide Deck");
        source.setFilePath(targetPath.toAbsolutePath().toString());
        source.setEmbedUrl(isPdf ? fileUrl : null);
        source.setUpdatedBy(user.getId());
        source.setUpdatedAt(Instant.now());

        PitchDeckSource saved = sourceRepository.save(source);
        return toDto(saved);
    }

    /**
     * Streams the uploaded presentation file to room members.
     */
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> streamFile(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        PitchDeckSource source = sourceRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("SOURCE_NOT_FOUND", "Deck source not found"));

        if (source.getFilePath() == null) {
            throw new NotFoundException("FILE_NOT_FOUND", "No uploaded file for this deck source");
        }

        File file = new File(source.getFilePath());
        if (!file.exists()) {
            throw new NotFoundException("FILE_NOT_FOUND", "Deck file not found on disk");
        }

        String name = file.getName().toLowerCase();
        MediaType mediaType = name.endsWith(".pdf")
                ? MediaType.APPLICATION_PDF
                : MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.presentationml.presentation");

        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getName() + "\"")
                .body(resource);
    }

    private PitchDtos.PitchDeckSourceDto toDto(PitchDeckSource s) {
        return new PitchDtos.PitchDeckSourceDto(
                s.getRoomId(),
                s.getProvider(),
                s.getUrl(),
                s.getTitle(),
                s.getFilePath(),
                s.getThumbnailUrl(),
                s.getEmbedUrl(),
                s.getUpdatedBy(),
                s.getUpdatedAt()
        );
    }
}
