package com.gradproject.platform.modules.admin.importer;

import com.gradproject.platform.modules.admin.importer.dto.ImportConfirmRequestDTO;
import com.gradproject.platform.modules.admin.importer.dto.ImportPreviewDTO;
import com.gradproject.platform.modules.admin.importer.dto.ImportResultDTO;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/import/students/pdf")
@PreAuthorize("hasRole('ADMIN')")
public class UserImportController {

    private final UserImportService userImportService;

    public UserImportController(UserImportService userImportService) {
        this.userImportService = userImportService;
    }

    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportPreviewDTO> previewStudentPdf(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userImportService.previewStudentPdf(file));
    }

    @PostMapping("/confirm")
    public ResponseEntity<ImportResultDTO> confirmStudentPdfImport(@Valid @RequestBody ImportConfirmRequestDTO request) {
        return ResponseEntity.ok(userImportService.confirmStudentPdfImport(request));
    }
}
