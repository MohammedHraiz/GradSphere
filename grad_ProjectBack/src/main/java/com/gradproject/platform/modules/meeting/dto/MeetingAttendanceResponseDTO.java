package com.gradproject.platform.modules.meeting.dto;

import com.gradproject.platform.modules.meeting.MeetingAttendanceStatus;

import java.util.UUID;

public record MeetingAttendanceResponseDTO(
        UUID studentId,
        String studentName,
        String studentEmail,
        String studentUniversityId,
        MeetingAttendanceStatus status,
        String absenceReason
) {
}
