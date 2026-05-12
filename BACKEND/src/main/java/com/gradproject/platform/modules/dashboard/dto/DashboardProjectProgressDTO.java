package com.gradproject.platform.modules.dashboard.dto;

import java.util.UUID;

public record DashboardProjectProgressDTO(
        UUID projectId,
        String projectTitle,
        String teamName,
        int taskCompletionPercentage,
        int milestoneCompletionPercentage,
        int overallCompletionPercentage,
        long pendingTasksCount,
        long overdueTasksCount,
        long completedMilestonesCount,
        long totalMilestonesCount
) {
}
