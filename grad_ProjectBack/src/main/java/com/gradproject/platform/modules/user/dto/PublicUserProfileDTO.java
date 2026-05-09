package com.gradproject.platform.modules.user.dto;

import java.time.Instant;
import java.util.UUID;

public record PublicUserProfileDTO(
        UUID id,
        String name,
        String email,
        String role,
        String department,
        String universityId,
        String profilePhotoUrl,
        String phoneNumber,
        String specialty,
        String officeHours,
        Instant createdAt
) {
}
