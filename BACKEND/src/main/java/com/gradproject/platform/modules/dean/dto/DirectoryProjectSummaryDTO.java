package com.gradproject.platform.modules.dean.dto;

import java.util.UUID;

public record DirectoryProjectSummaryDTO(
        UUID projectId,
        String projectTitle,
        String projectStatus
) {
}
