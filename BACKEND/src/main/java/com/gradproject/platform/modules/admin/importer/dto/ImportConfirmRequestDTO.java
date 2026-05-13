package com.gradproject.platform.modules.admin.importer.dto;

import java.util.List;

public record ImportConfirmRequestDTO(
        List<ImportStudentRowDTO> rows,
        String departmentOverride,
        Boolean skipInvalid
) {
}
