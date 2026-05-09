package com.gradproject.platform.modules.meeting.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

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

        String requestMessage,

        String overallRating,

        @Size(max = 5000, message = "Concern actions must be 5000 characters or less.")
        String concernActions,

        List<@Valid MeetingAttendanceRequestDTO> attendance
) {
        public MeetingDraftDTO(
                String title,
                LocalDateTime meetingDate,
                String summary,
                String progressDiscussed,
                String tasksAssigned,
                String nextSteps,
                LocalDateTime nextMeetingDate,
                String meetingType,
                String locationOrLink,
                String requestMessage
        ) {
                this(title, meetingDate, summary, progressDiscussed, tasksAssigned, nextSteps, nextMeetingDate,
                        meetingType, locationOrLink, requestMessage, null, null, null);
        }
}
