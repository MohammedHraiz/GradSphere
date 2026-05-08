package com.gradproject.platform.modules.meeting.dto;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record MeetingResponseDTO(
        UUID id,
        UUID projectId,
        String projectTitle,
        UUID supervisorId,
        String supervisorName,
        String title,
        LocalDateTime meetingDate,
        String status,
        String meetingType,
        String locationOrLink,
        String requestMessage,
        UUID requestedById,
        String requestedByName,
        String summary,
        String progressDiscussed,
        String tasksAssigned,
        String nextSteps,
        LocalDateTime nextMeetingDate,
        List<MeetingAttendanceResponseDTO> attendance,
        Instant createdAt,
        Instant updatedAt,
        boolean canEdit,
        boolean canDelete
) {
}
