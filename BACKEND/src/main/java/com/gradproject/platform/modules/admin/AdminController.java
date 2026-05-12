package com.gradproject.platform.modules.admin;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gradproject.platform.modules.project.dto.ArchiveProjectResponseDTO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
//@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5177"})
@RequiredArgsConstructor
public class AdminController {

    private final ArchiveService archiveService;

    @PreAuthorize("hasRole('DEAN_OFFICE') or hasRole('ADMIN')")
    @PostMapping("/archive/{projectId}")
    public ResponseEntity<ArchiveProjectResponseDTO> archiveProject(@PathVariable UUID projectId) {
        return ResponseEntity.ok(archiveService.archiveProject(projectId));
    }
}

