package com.gradproject.platform.modules.dashboard.dto;

import com.gradproject.platform.modules.user.UserRole;

import java.time.Instant;
import java.util.UUID;

public record DashboardUserItemDTO(
        UUID userId,
        String name,
        String email,
        UserRole role,
        Instant createdAt
) {
}
