package com.gradproject.platform.modules.dean.dto;

import java.util.List;
import java.util.UUID;

public record DirectorySupervisorDTO(
        UUID id,
        String name,
        String email,
        String universityId,
        String department,
        String specialty,
        String officeHours,
        String profilePhotoUrl,
        long assignedProjectsCount,
        long assignedTeamsCount,
        long activeProjectsCount,
        long completedProjectsCount,
        int capacityLimit,
        String capacityStatus,
        List<DirectoryProjectSummaryDTO> latestAssignedProjects
) {
}
