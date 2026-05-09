package com.gradproject.platform.modules.dean.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DirectoryTeamDTO(
        UUID teamId,
        String teamName,
        UUID projectId,
        String projectTitle,
        String projectStatus,
        String projectHealth,
        String projectHealthLabel,
        String projectHealthReason,
        DirectoryUserDTO supervisor,
        DirectoryUserDTO leader,
        List<DirectoryUserDTO> members,
        long membersCount,
        Integer maxMembers,
        Instant createdAt
) {
}
