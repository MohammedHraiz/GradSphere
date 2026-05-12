package com.gradproject.platform.modules.dean.dto;

import java.util.UUID;

public record DirectoryUserDTO(
        UUID id,
        String name,
        String email,
        String universityId,
        String department,
        String specialty,
        String phoneNumber,
        String officeHours,
        String profilePhotoUrl,
        String roleInTeam
) {
}
