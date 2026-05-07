package com.gradproject.platform.modules.dashboard;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.dashboard.dto.AdminDashboardDTO;
import com.gradproject.platform.modules.dashboard.dto.DashboardProjectItemDTO;
import com.gradproject.platform.modules.dashboard.dto.DashboardSupervisorRequestItemDTO;
import com.gradproject.platform.modules.dashboard.dto.DashboardUserItemDTO;
import com.gradproject.platform.modules.dashboard.dto.DeanDashboardDTO;
import com.gradproject.platform.modules.dashboard.dto.StudentDashboardDTO;
import com.gradproject.platform.modules.dashboard.dto.SupervisorDashboardDTO;
import com.gradproject.platform.modules.invitation.InvitationRepository;
import com.gradproject.platform.modules.invitation.InvitationStatus;
import com.gradproject.platform.modules.meeting.MeetingRepository;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.project.comment.ProjectComment;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequest;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestRepository;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestStatus;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.team.TeamRepository;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final InvitationRepository invitationRepository;
    private final ProjectRepository projectRepository;
    private final SupervisorRequestRepository supervisorRequestRepository;
    private final MeetingRepository meetingRepository;

    public DashboardService(UserRepository userRepository,
                            TeamRepository teamRepository,
                            TeamMemberRepository teamMemberRepository,
                            InvitationRepository invitationRepository,
                            ProjectRepository projectRepository,
                            SupervisorRequestRepository supervisorRequestRepository,
                            MeetingRepository meetingRepository) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.invitationRepository = invitationRepository;
        this.projectRepository = projectRepository;
        this.supervisorRequestRepository = supervisorRequestRepository;
        this.meetingRepository = meetingRepository;
    }

    public StudentDashboardDTO getStudentDashboard() {
        User user = requireRole(UserRole.ROLE_STUDENT);
        Optional<TeamMember> membershipOptional = teamMemberRepository.findByUserId(user.getId());
        long pendingReceived = invitationRepository.countByReceiverIdAndStatus(user.getId(), InvitationStatus.PENDING);

        if (membershipOptional.isEmpty()) {
            return new StudentDashboardDTO(user.getName(), user.getRole().name(), false, null, null, false, 0,
                    pendingReceived, 0, null, null, null, null, null, null, null,
                    null, null, false, false, 0, 0);
        }

        TeamMember membership = membershipOptional.get();
        Team team = membership.getTeam();
        boolean isLeader = "LEADER".equalsIgnoreCase(String.valueOf(membership.getMemberRole()));
        long teamMemberCount = teamMemberRepository.countByTeamId(team.getId());
        long pendingSent = isLeader ? invitationRepository.countByTeamIdAndStatus(team.getId(), InvitationStatus.PENDING) : 0;
        Project project = projectRepository.findByTeamId(team.getId()).orElse(null);

        if (project == null) {
            return new StudentDashboardDTO(user.getName(), user.getRole().name(), true, team.getId(), team.getName(), isLeader,
                    teamMemberCount, pendingReceived, pendingSent, null, null, null, null, null,
                    null, null, null, null, false, false, 0, 0);
        }

        SupervisorRequest pendingRequest = supervisorRequestRepository
                .findFirstByTeamIdAndStatusOrderByCreatedAtDesc(team.getId(), SupervisorRequestStatus.PENDING)
                .orElse(null);
        SupervisorRequest latestRequest = supervisorRequestRepository
                .findFirstByTeamIdOrderByCreatedAtDesc(team.getId())
                .orElse(null);
        ProjectComment latestComment = latestComment(project).orElse(null);
        boolean canResubmit = isLeader && (project.getStatus() == ProjectStatus.NEEDS_CHANGES
                || project.getStatus() == ProjectStatus.REVISION_REQUIRED
                || project.getStatus() == ProjectStatus.REJECTED);
        LocalDateTime now = LocalDateTime.now();

        return new StudentDashboardDTO(
                user.getName(),
                user.getRole().name(),
                true,
                team.getId(),
                team.getName(),
                isLeader,
                teamMemberCount,
                pendingReceived,
                pendingSent,
                project.getId(),
                project.getTitle(),
                project.getStatus(),
                project.getSupervisor() != null ? project.getSupervisor().getName() : null,
                project.getSupervisor() != null ? project.getSupervisor().getEmail() : null,
                pendingRequest != null ? pendingRequest.getStatus() : null,
                latestRequest != null ? latestRequest.getStatus() : null,
                latestComment != null ? latestComment.getContent() : null,
                latestComment != null ? latestComment.getTimestamp() : null,
                true,
                canResubmit,
                meetingRepository.countByProjectIdAndMeetingDateAfter(project.getId(), now),
                meetingRepository.countByProjectIdAndMeetingDateBefore(project.getId(), now)
        );
    }

    public SupervisorDashboardDTO getSupervisorDashboard() {
        User user = requireRole(UserRole.ROLE_SUPERVISOR);
        List<Project> assignedProjects = projectRepository.findBySupervisorIdOrderByCreatedAtDesc(user.getId());
        String latestFeedback = assignedProjects.stream()
                .flatMap(project -> project.getComments().stream())
                .filter(comment -> comment.getAuthor() != null && user.getId().equals(comment.getAuthor().getId()))
                .max(Comparator.comparing(ProjectComment::getTimestamp, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(ProjectComment::getContent)
                .orElse(null);

        return new SupervisorDashboardDTO(
                user.getName(),
                supervisorRequestRepository.countBySupervisorIdAndStatus(user.getId(), SupervisorRequestStatus.PENDING),
                assignedProjects.size(),
                countAssigned(user, ProjectStatus.UNDER_REVIEW),
                countAssigned(user, ProjectStatus.NEEDS_CHANGES) + countAssigned(user, ProjectStatus.REVISION_REQUIRED),
                countAssigned(user, ProjectStatus.APPROVED) + countAssigned(user, ProjectStatus.FINAL_APPROVAL_DEAN),
                countAssigned(user, ProjectStatus.REJECTED),
                countAssigned(user, ProjectStatus.ARCHIVED),
                supervisorRequestRepository.findTop5BySupervisorIdAndStatusOrderByCreatedAtDesc(user.getId(), SupervisorRequestStatus.PENDING)
                        .stream().map(this::toRequestItem).toList(),
                projectRepository.findTop5BySupervisorIdOrderByCreatedAtDesc(user.getId()).stream().map(this::toProjectItem).toList(),
                latestFeedback,
                statusMapForProjects(assignedProjects)
        );
    }

    public DeanDashboardDTO getDeanDashboard() {
        requireRole(UserRole.ROLE_DEAN_OFFICE);
        List<Project> allProjects = projectRepository.findAll();
        long totalTeams = teamRepository.count();

        return new DeanDashboardDTO(
                allProjects.size(),
                projectRepository.countByStatus(ProjectStatus.SUBMITTED) + projectRepository.countByStatus(ProjectStatus.PENDING),
                projectRepository.countByStatus(ProjectStatus.UNDER_REVIEW),
                projectRepository.countByStatus(ProjectStatus.NEEDS_CHANGES) + projectRepository.countByStatus(ProjectStatus.REVISION_REQUIRED),
                projectRepository.countByStatus(ProjectStatus.APPROVED) + projectRepository.countByStatus(ProjectStatus.FINAL_APPROVAL_DEAN),
                projectRepository.countByStatus(ProjectStatus.REJECTED),
                projectRepository.countByStatus(ProjectStatus.ARCHIVED),
                projectRepository.countBySupervisorIsNull(),
                supervisorRequestRepository.countByStatus(SupervisorRequestStatus.PENDING),
                totalTeams,
                totalTeams,
                userRepository.countByRole(UserRole.ROLE_STUDENT),
                userRepository.countByRole(UserRole.ROLE_SUPERVISOR),
                projectRepository.findTop5ByOrderByCreatedAtDesc().stream().map(this::toProjectItem).toList(),
                supervisorRequestRepository.findTop5ByOrderByCreatedAtDesc().stream().map(this::toRequestItem).toList(),
                statusMapForProjects(allProjects)
        );
    }

    public AdminDashboardDTO getAdminDashboard() {
        requireRole(UserRole.ROLE_ADMIN);
        List<Project> allProjects = projectRepository.findAll();
        Map<String, Long> usersByRole = new LinkedHashMap<>();
        Arrays.stream(UserRole.values()).forEach(role -> usersByRole.put(role.name(), userRepository.countByRole(role)));

        return new AdminDashboardDTO(
                userRepository.count(),
                userRepository.countByRole(UserRole.ROLE_STUDENT),
                userRepository.countByRole(UserRole.ROLE_SUPERVISOR),
                userRepository.countByRole(UserRole.ROLE_DEAN_OFFICE),
                userRepository.countByRole(UserRole.ROLE_ADMIN),
                teamRepository.count(),
                allProjects.size(),
                projectRepository.countByStatus(ProjectStatus.ARCHIVED),
                invitationRepository.countByStatus(InvitationStatus.PENDING),
                supervisorRequestRepository.countByStatus(SupervisorRequestStatus.PENDING),
                projectRepository.countBySupervisorIsNull(),
                statusMapForProjects(allProjects),
                usersByRole,
                userRepository.findTop5ByOrderByCreatedAtDesc().stream().map(this::toUserItem).toList(),
                projectRepository.findTop5ByOrderByCreatedAtDesc().stream().map(this::toProjectItem).toList()
        );
    }

    private long countAssigned(User supervisor, ProjectStatus status) {
        return projectRepository.countBySupervisorIdAndStatus(supervisor.getId(), status);
    }

    private Map<String, Long> statusMapForProjects(List<Project> projects) {
        Map<String, Long> counts = new LinkedHashMap<>();
        Arrays.stream(ProjectStatus.values()).forEach(status -> counts.put(status.name(), 0L));
        projects.forEach(project -> counts.computeIfPresent(project.getStatus().name(), (key, value) -> value + 1));
        return counts;
    }

    private Optional<ProjectComment> latestComment(Project project) {
        if (project.getComments() == null) {
            return Optional.empty();
        }
        return project.getComments().stream()
                .filter(comment -> comment.getContent() != null)
                .max(Comparator.comparing(ProjectComment::getTimestamp, Comparator.nullsLast(Comparator.naturalOrder())));
    }

    private DashboardProjectItemDTO toProjectItem(Project project) {
        return new DashboardProjectItemDTO(
                project.getId(),
                project.getTitle(),
                project.getTeam() != null ? project.getTeam().getName() : null,
                project.getStatus(),
                project.getSupervisor() != null ? project.getSupervisor().getName() : null,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }

    private DashboardSupervisorRequestItemDTO toRequestItem(SupervisorRequest request) {
        Project project = request.getProject();
        return new DashboardSupervisorRequestItemDTO(
                request.getId(),
                project != null ? project.getId() : null,
                project != null ? project.getTitle() : null,
                request.getTeam() != null ? request.getTeam().getName() : null,
                request.getSupervisor() != null ? request.getSupervisor().getName() : null,
                request.getRequestedBy() != null ? request.getRequestedBy().getName() : null,
                request.getStatus(),
                request.getMessage(),
                request.getCreatedAt()
        );
    }

    private DashboardUserItemDTO toUserItem(User user) {
        return new DashboardUserItemDTO(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCreatedAt());
    }

    private User requireRole(UserRole role) {
        User user = resolveCurrentUser();
        if (user.getRole() != role) {
            throw new BadRequestException("You are not allowed to view this dashboard.");
        }
        return user;
    }

    private User resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new BadRequestException("Authenticated user not found.");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return userRepository.findById(user.getId())
                    .orElseThrow(() -> new BadRequestException("Authenticated user not found."));
        }
        if (principal instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new BadRequestException("Authenticated user not found."));
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new BadRequestException("Authenticated user not found."));
    }
}
