package com.gradproject.platform.modules.dashboard.dto;

import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StudentDashboardDTO(
        String userName,
        String role,
        boolean hasTeam,
        UUID teamId,
        String teamName,
        boolean isTeamLeader,
        long teamMemberCount,
        long pendingReceivedInvitationsCount,
        long pendingSentInvitationsCount,
        UUID projectId,
        String projectTitle,
        ProjectStatus projectStatus,
        String assignedSupervisorName,
        String assignedSupervisorEmail,
        SupervisorRequestStatus pendingSupervisorRequestStatus,
        SupervisorRequestStatus latestSupervisorRequestStatus,
        String latestFeedback,
        Instant latestFeedbackDate,
        boolean proposalSubmitted,
        boolean proposalCanResubmit,
        long upcomingMeetingsCount,
        long completedMeetingsCount,
        DashboardTaskSummaryDTO taskSummary,
        DashboardMilestoneSummaryDTO milestoneSummary,
        List<DashboardProjectProgressDTO> projectProgress
) {
}
