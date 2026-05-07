package com.gradproject.platform.modules.meeting;

import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/meetings")
//@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5177"})
@RequiredArgsConstructor
public class MeetingController {

    private final PdfGeneratorService pdfGeneratorService;

    @PreAuthorize("hasAnyRole('SUPERVISOR', 'DEAN_OFFICE', 'ADMIN')")
    @GetMapping("/{id}/download-form")
    public ResponseEntity<Resource> downloadForm(@PathVariable UUID id, Authentication authentication) {
        Resource pdf = pdfGeneratorService.generateMeetingForm(id, authentication);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Project-Meeting-Attendance-Progress-Form.pdf\"")
                .body(pdf);
    }
}


