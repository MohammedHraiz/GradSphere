package com.gradproject.platform.modules.meeting.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record MeetingDraftDTO(
        @NotBlank(message = "Meeting title is required.")
        @Size(max = 255, message = "Meeting title must be 255 characters or less.")
        String title,

        @NotNull(message = "Meeting date is required.")
        LocalDateTime meetingDate,

        @Size(max = 5000, message = "Summary must be 5000 characters or less.")
        String summary,

        @Size(max = 5000, message = "Progress discussed must be 5000 characters or less.")
        String progressDiscussed,

        @Size(max = 5000, message = "Tasks assigned must be 5000 characters or less.")
        String tasksAssigned,

        @Size(max = 5000, message = "Next steps must be 5000 characters or less.")
        String nextSteps,

        LocalDateTime nextMeetingDate,

        String meetingType,

        String locationOrLink,

        String requestMessage
) {
}
