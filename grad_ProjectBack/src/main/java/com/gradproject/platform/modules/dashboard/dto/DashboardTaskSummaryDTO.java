package com.gradproject.platform.modules.dashboard.dto;

public record DashboardTaskSummaryDTO(
        long total,
        long todo,
        long inProgress,
        long done,
        long overdue
) {
}
