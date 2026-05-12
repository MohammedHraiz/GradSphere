package com.gradproject.platform.modules.meeting.dto;

import com.gradproject.platform.modules.meeting.MeetingAttendanceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record MeetingAttendanceRequestDTO(
        @NotNull(message = "Student is required.")
        UUID studentId,

        @NotNull(message = "Attendance status is required.")
        MeetingAttendanceStatus status,

        @Size(max = 1000, message = "Absence reason must be 1000 characters or less.")
        String absenceReason
) {
}
