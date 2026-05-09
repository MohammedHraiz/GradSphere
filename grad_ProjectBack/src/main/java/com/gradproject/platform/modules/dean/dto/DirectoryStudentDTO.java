package com.gradproject.platform.modules.dean.dto;

import java.util.UUID;

public record DirectoryStudentDTO(
        UUID id,
        String name,
        String email,
        String universityId,
        String department,
        String specialty,
        String phoneNumber,
        String profilePhotoUrl,
        UUID teamId,
        String teamName,
        UUID projectId,
        String projectTitle,
        String projectStatus,
        String projectHealth,
        String projectHealthLabel,
        UUID supervisorId,
        String supervisorName,
        String supervisorEmail,
        String supervisorProfilePhotoUrl,
        long assignedTasksCount,
        long completedTasksCount
) {
}
