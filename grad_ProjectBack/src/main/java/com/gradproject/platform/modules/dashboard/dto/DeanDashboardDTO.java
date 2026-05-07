package com.gradproject.platform.modules.dashboard.dto;

import java.util.List;
import java.util.Map;

public record DeanDashboardDTO(
        long totalProjects,
        long submittedProjectsCount,
        long underReviewProjectsCount,
        long needsChangesProjectsCount,
        long approvedProjectsCount,
        long rejectedProjectsCount,
        long archivedProjectsCount,
        long unassignedProjectsCount,
        long pendingSupervisorRequestsCount,
        long totalTeams,
        long activeTeamsCount,
        long totalStudents,
        long totalSupervisors,
        List<DashboardProjectItemDTO> recentProjects,
        List<DashboardSupervisorRequestItemDTO> recentSupervisorRequests,
        Map<String, Long> projectsByStatus
) {
}
