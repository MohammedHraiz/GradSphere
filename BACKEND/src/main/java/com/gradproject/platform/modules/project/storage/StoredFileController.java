package com.gradproject.platform.modules.project.storage;

import com.gradproject.platform.exception.BadRequestException;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/files")
public class StoredFileController {

    private final FileStorageService fileStorageService;

    public StoredFileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/profile-photos/{userId}")
    public ResponseEntity<ByteArrayResource> getProfilePhoto(@PathVariable UUID userId) {
        FileStorageService.StoredFilePayload payload = fileStorageService.loadProfilePhoto(userId)
                .orElseThrow(() -> new BadRequestException("Profile photo not found."));

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType(payload.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + payload.fileName() + "\"")
                .body(payload.resource());
    }
}