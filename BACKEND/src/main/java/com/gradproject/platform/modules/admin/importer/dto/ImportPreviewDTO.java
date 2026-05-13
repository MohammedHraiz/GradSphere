package com.gradproject.platform.modules.admin.importer.dto;

import java.util.List;

public record ImportPreviewDTO(
        String detectedDepartment,
        String detectedDepartmentLabel,
        int totalRows,
        int validRows,
        int invalidRows,
        int duplicatesInFile,
        int existingUsers,
        List<ImportStudentRowDTO> rows
) {
}
