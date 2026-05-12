package com.gradproject.platform.modules.dashboard.dto;

public record DashboardMilestoneSummaryDTO(
        long total,
        long completed,
        long pending
) {
}
