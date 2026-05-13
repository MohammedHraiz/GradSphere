package com.gradproject.platform.modules.admin.importer.dto;

import com.gradproject.platform.modules.user.dto.UserProfileResponseDTO;

import java.util.List;

public record ImportResultDTO(
        int createdCount,
        int skippedCount,
        int failedCount,
        List<UserProfileResponseDTO> createdUsers,
        List<ImportStudentRowDTO> skippedRows,
        List<String> errors
) {
}
