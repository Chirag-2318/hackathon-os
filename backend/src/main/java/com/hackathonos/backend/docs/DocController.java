package com.hackathonos.backend.docs;

import com.hackathonos.backend.docs.dto.*;
import com.hackathonos.backend.docs.dto.DocRequests.*;
import com.hackathonos.backend.users.User;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/docs")
public class DocController {

    private final DocService docService;

    public DocController(DocService docService) {
        this.docService = docService;
    }

    @GetMapping
    public DocListResponseDto listDocs(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return docService.listDocs(roomId, user);
    }

    @PostMapping
    public DocDetailDto createCustomDoc(
            @PathVariable UUID roomId,
            @RequestBody CreateDocRequest req,
            @AuthenticationPrincipal User user
    ) {
        return docService.createCustomDoc(roomId, req, user);
    }

    @GetMapping("/download.zip")
    public ResponseEntity<byte[]> downloadAllZip(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        byte[] zipBytes = docService.downloadAllZip(roomId, user);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"hackathon-os-docs.zip\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(zipBytes);
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID roomId,
            @PathVariable UUID commentId,
            @AuthenticationPrincipal User user
    ) {
        docService.deleteComment(roomId, commentId, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{fileName}")
    public DocDetailDto getDoc(
            @PathVariable UUID roomId,
            @PathVariable String fileName,
            @AuthenticationPrincipal User user
    ) {
        return docService.getDocByFileName(roomId, fileName, user);
    }

    @PutMapping("/{fileName}")
    public DocDetailDto updateDoc(
            @PathVariable UUID roomId,
            @PathVariable String fileName,
            @RequestBody UpdateDocRequest req,
            @AuthenticationPrincipal User user
    ) {
        return docService.updateDoc(roomId, fileName, req, user);
    }

    @DeleteMapping("/{fileName}")
    public ResponseEntity<Void> deleteDoc(
            @PathVariable UUID roomId,
            @PathVariable String fileName,
            @AuthenticationPrincipal User user
    ) {
        docService.deleteDoc(roomId, fileName, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{fileName}/versions/{version}")
    public VersionContentDto getVersionContent(
            @PathVariable UUID roomId,
            @PathVariable String fileName,
            @PathVariable int version,
            @AuthenticationPrincipal User user
    ) {
        return docService.getVersionContent(roomId, fileName, version, user);
    }

    @PostMapping("/{fileName}/restore")
    public DocDetailDto restoreVersion(
            @PathVariable UUID roomId,
            @PathVariable String fileName,
            @RequestBody RestoreDocRequest req,
            @AuthenticationPrincipal User user
    ) {
        return docService.restoreVersion(roomId, fileName, req.version(), user);
    }

    @GetMapping("/{fileName}/comments")
    public List<DocCommentDto> listComments(
            @PathVariable UUID roomId,
            @PathVariable String fileName,
            @AuthenticationPrincipal User user
    ) {
        return docService.listComments(roomId, fileName, user);
    }

    @PostMapping("/{fileName}/comments")
    public DocCommentDto addComment(
            @PathVariable UUID roomId,
            @PathVariable String fileName,
            @RequestBody CreateCommentRequest req,
            @AuthenticationPrincipal User user
    ) {
        return docService.addComment(roomId, fileName, req.text(), user);
    }

    @GetMapping("/{fileName}/download")
    public ResponseEntity<byte[]> downloadDoc(
            @PathVariable UUID roomId,
            @PathVariable String fileName,
            @AuthenticationPrincipal User user
    ) {
        byte[] docBytes = docService.downloadDoc(roomId, fileName, user);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType("text/markdown"))
                .body(docBytes);
    }
}
