package com.gradproject.platform.modules.user.dto;

import java.time.Instant;
import java.util.UUID;

public record UserProfileResponseDTO(
        UUID id,
        String name,
        String email,
        String universityId,
        String role,
        String department,
        String phoneNumber,
        String specialty,
        String officeHours,
        String profilePhotoUrl,
        Instant createdAt,
        boolean hasTeam
) {
}
