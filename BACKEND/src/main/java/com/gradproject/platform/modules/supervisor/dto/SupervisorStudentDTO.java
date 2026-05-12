package com.gradproject.platform.modules.supervisor.dto;

import com.gradproject.platform.modules.project.ProjectStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record SupervisorStudentDTO(
        UUID studentId,
        String name,
        String email,
        String universityId,
        String department,
        String profilePhotoUrl,
        String teamName,
        UUID projectId,
        String projectTitle,
        ProjectStatus projectStatus,
        long taskCount,
        long completedTaskCount,
        long meetingCount,
        LocalDateTime lastCompletedMeetingDate
) {
}
