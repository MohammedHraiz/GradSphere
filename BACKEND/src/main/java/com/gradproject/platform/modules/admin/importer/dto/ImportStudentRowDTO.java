package com.gradproject.platform.modules.admin.importer.dto;

import com.gradproject.platform.modules.admin.importer.ImportRowStatus;

import java.util.List;

public record ImportStudentRowDTO(
        int rowNumber,
        String name,
        String universityId,
        String generatedEmail,
        String department,
        String role,
        ImportRowStatus status,
        List<String> errors
) {
}
