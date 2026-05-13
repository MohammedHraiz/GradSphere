package com.gradproject.platform.modules.dashboard.dto;

import java.util.List;
import java.util.Map;

public record AdminDashboardDTO(
        long totalUsers,
        long totalStudents,
        long totalSupervisors,
        long totalDeanOfficeUsers,
        long totalAdmins,
        long totalTeams,
        long totalProjects,
        long archivedProjectsCount,
        long pendingInvitationsCount,
        long pendingSupervisorRequestsCount,
        long unassignedProjectsCount,
        Map<String, Long> projectsByStatus,
        Map<String, Long> projectsByCategory,
        Map<String, Long> usersByRole,
        List<DashboardUserItemDTO> recentUsers,
        List<DashboardProjectItemDTO> recentProjects,
        DashboardTaskSummaryDTO taskSummary,
        DashboardMilestoneSummaryDTO milestoneSummary,
        long overdueTasksCount,
        List<DashboardProjectProgressDTO> highestPendingTaskLoadProjects
) {
}
