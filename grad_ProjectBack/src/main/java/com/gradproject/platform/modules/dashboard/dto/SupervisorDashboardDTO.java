package com.gradproject.platform.modules.dashboard.dto;

import java.util.List;
import java.util.Map;

public record SupervisorDashboardDTO(
        String userName,
        long pendingSupervisorRequestsCount,
        long assignedProjectsCount,
        long underReviewProjectsCount,
        long needsChangesProjectsCount,
        long approvedProjectsCount,
        long rejectedProjectsCount,
        long archivedProjectsCount,
        List<DashboardSupervisorRequestItemDTO> recentPendingRequests,
        List<DashboardProjectItemDTO> recentAssignedProjects,
        String latestFeedbackGiven,
        Map<String, Long> projectsByStatus
) {
}
