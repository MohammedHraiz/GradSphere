package com.gradproject.platform.modules.dashboard;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.dashboard.dto.AdminDashboardDTO;
import com.gradproject.platform.modules.dashboard.dto.DashboardMilestoneItemDTO;
import com.gradproject.platform.modules.dashboard.dto.DashboardMilestoneSummaryDTO;
import com.gradproject.platform.modules.dashboard.dto.DashboardProjectItemDTO;
import com.gradproject.platform.modules.dashboard.dto.DashboardProjectProgressDTO;
import com.gradproject.platform.modules.dashboard.dto.DashboardSupervisorRequestItemDTO;
import com.gradproject.platform.modules.dashboard.dto.DashboardTaskItemDTO;
import com.gradproject.platform.modules.dashboard.dto.DashboardTaskSummaryDTO;
import com.gradproject.platform.modules.dashboard.dto.DashboardUserItemDTO;
import com.gradproject.platform.modules.dashboard.dto.DeanDashboardDTO;
import com.gradproject.platform.modules.dashboard.dto.StudentDashboardDTO;
import com.gradproject.platform.modules.dashboard.dto.SupervisorDashboardDTO;
import com.gradproject.platform.modules.invitation.InvitationRepository;
import com.gradproject.platform.modules.invitation.InvitationStatus;
import com.gradproject.platform.modules.meeting.MeetingRepository;
import com.gradproject.platform.modules.milestone.Milestone;
import com.gradproject.platform.modules.milestone.MilestoneStatus;
import com.gradproject.platform.modules.milestone.MilestoneRepository;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.project.comment.ProjectComment;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequest;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestRepository;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestStatus;
import com.gradproject.platform.modules.task.Task;
import com.gradproject.platform.modules.task.TaskRepository;
import com.gradproject.platform.modules.task.TaskStatus;
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
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    private final TaskRepository taskRepository;
    private final MilestoneRepository milestoneRepository;

    public DashboardService(UserRepository userRepository,
                            TeamRepository teamRepository,
                            TeamMemberRepository teamMemberRepository,
                            InvitationRepository invitationRepository,
                            ProjectRepository projectRepository,
                            SupervisorRequestRepository supervisorRequestRepository,
                            MeetingRepository meetingRepository,
                            TaskRepository taskRepository,
                            MilestoneRepository milestoneRepository) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.invitationRepository = invitationRepository;
        this.projectRepository = projectRepository;
        this.supervisorRequestRepository = supervisorRequestRepository;
        this.meetingRepository = meetingRepository;
        this.taskRepository = taskRepository;
        this.milestoneRepository = milestoneRepository;
    }

    public StudentDashboardDTO getStudentDashboard() {
        refreshOverdueTasks();
        User user = requireRole(UserRole.ROLE_STUDENT);
        Optional<TeamMember> membershipOptional = teamMemberRepository.findByUserId(user.getId());
        long pendingReceived = invitationRepository.countByReceiverIdAndStatus(user.getId(), InvitationStatus.PENDING);

        if (membershipOptional.isEmpty()) {
            return new StudentDashboardDTO(
                    user.getName(), user.getRole().name(), false, null, null, false, 0,
                    pendingReceived, 0, null, null, null, null, null, null, null, null,
                    null, null, false, false, 0, 0, emptyTaskSummary(), emptyMilestoneSummary(), List.of()
            );
        }

        TeamMember membership = membershipOptional.get();
        Team team = membership.getTeam();
        boolean isLeader = "LEADER".equalsIgnoreCase(String.valueOf(membership.getMemberRole()));
        long teamMemberCount = teamMemberRepository.countByTeamId(team.getId());
        long pendingSent = isLeader ? invitationRepository.countByTeamIdAndStatus(team.getId(), InvitationStatus.PENDING) : 0;
        Project project = projectRepository.findByTeamId(team.getId()).orElse(null);

        if (project == null) {
            return new StudentDashboardDTO(
                    user.getName(), user.getRole().name(), true, team.getId(), team.getName(), isLeader,
                    teamMemberCount, pendingReceived, pendingSent, null, null, normalizeProjectDomain(team.getProjectDomain()), null, null, null,
                    null, null, null, null, false, false, 0, 0, emptyTaskSummary(), emptyMilestoneSummary(), List.of()
            );
        }

        List<Task> tasks = taskRepository.findByProjectIdIn(List.of(project.getId()));
        List<Milestone> milestones = milestoneRepository.findByProjectIdIn(List.of(project.getId()));

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
                normalizeProjectDomain(resolveProjectDomain(project)),
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
                meetingRepository.countByProjectIdAndMeetingDateBefore(project.getId(), now),
                summarizeTasks(tasks),
                summarizeMilestones(milestones),
                List.of(toProjectProgress(project, tasks, milestones))
        );
    }

    public SupervisorDashboardDTO getSupervisorDashboard() {
        refreshOverdueTasks();
        User user = requireRole(UserRole.ROLE_SUPERVISOR);
        List<Project> assignedProjects = projectRepository.findBySupervisorIdOrderByCreatedAtDesc(user.getId());
        WorkflowSnapshot snapshot = snapshotForProjects(assignedProjects);
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
                statusMapForProjects(assignedProjects),
                categoryMapForProjects(assignedProjects),
                snapshot.taskSummary(),
                snapshot.milestoneSummary(),
                snapshot.overdueTasks().stream().limit(5).toList(),
                snapshot.upcomingMilestones().stream().limit(5).toList(),
                snapshot.progress()
        );
    }

    public DeanDashboardDTO getDeanDashboard() {
        refreshOverdueTasks();
        requireRole(UserRole.ROLE_DEAN_OFFICE);
        List<Project> allProjects = projectRepository.findAll();
        long totalTeams = teamRepository.count();
        WorkflowSnapshot snapshot = snapshotForProjects(allProjects);

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
                statusMapForProjects(allProjects),
                categoryMapForProjects(allProjects),
                snapshot.taskSummary(),
                snapshot.milestoneSummary(),
                snapshot.taskSummary().overdue(),
                snapshot.highestPendingLoadProjects(),
                snapshot.upcomingMilestones().stream().limit(5).toList()
        );
    }

    public AdminDashboardDTO getAdminDashboard() {
        refreshOverdueTasks();
        requireRole(UserRole.ROLE_ADMIN);
        List<Project> allProjects = projectRepository.findAll();
        WorkflowSnapshot snapshot = snapshotForProjects(allProjects);
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
                categoryMapForProjects(allProjects),
                usersByRole,
                userRepository.findTop5ByOrderByCreatedAtDesc().stream().map(this::toUserItem).toList(),
                projectRepository.findTop5ByOrderByCreatedAtDesc().stream().map(this::toProjectItem).toList(),
                snapshot.taskSummary(),
                snapshot.milestoneSummary(),
                snapshot.taskSummary().overdue(),
                snapshot.highestPendingLoadProjects()
        );
    }

    private WorkflowSnapshot snapshotForProjects(List<Project> projects) {
        if (projects.isEmpty()) {
            return new WorkflowSnapshot(emptyTaskSummary(), emptyMilestoneSummary(), List.of(), List.of(), List.of(), List.of());
        }

        List<UUID> projectIds = projects.stream().map(Project::getId).filter(Objects::nonNull).toList();
        Map<UUID, List<Task>> tasksByProject = taskRepository.findByProjectIdIn(projectIds).stream()
                .collect(Collectors.groupingBy(task -> task.getProject().getId()));
        Map<UUID, List<Milestone>> milestonesByProject = milestoneRepository.findByProjectIdIn(projectIds).stream()
                .collect(Collectors.groupingBy(milestone -> milestone.getProject().getId()));

        List<Task> allTasks = tasksByProject.values().stream().flatMap(Collection::stream).toList();
        List<Milestone> allMilestones = milestonesByProject.values().stream().flatMap(Collection::stream).toList();

        List<DashboardProjectProgressDTO> progress = projects.stream()
                .map(project -> toProjectProgress(
                        project,
                        tasksByProject.getOrDefault(project.getId(), List.of()),
                        milestonesByProject.getOrDefault(project.getId(), List.of())
                ))
                .toList();

        List<DashboardTaskItemDTO> overdueTasks = allTasks.stream()
                .filter(this::isOverdue)
                .sorted(Comparator.comparing(Task::getDueDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toTaskItem)
                .toList();

        List<DashboardMilestoneItemDTO> upcomingMilestones = allMilestones.stream()
                .filter(milestone -> milestone.getStatus() != MilestoneStatus.COMPLETED)
                .sorted(Comparator.comparing(Milestone::getDueDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toMilestoneItem)
                .toList();

        List<DashboardProjectProgressDTO> highestPendingLoadProjects = progress.stream()
                .sorted(Comparator.comparingLong(DashboardProjectProgressDTO::pendingTasksCount).reversed()
                        .thenComparingLong(DashboardProjectProgressDTO::overdueTasksCount).reversed())
                .limit(5)
                .toList();

        return new WorkflowSnapshot(
                summarizeTasks(allTasks),
                summarizeMilestones(allMilestones),
                overdueTasks,
                upcomingMilestones,
                progress,
                highestPendingLoadProjects
        );
    }

    private DashboardTaskSummaryDTO summarizeTasks(Collection<Task> tasks) {
        long todo = tasks.stream().filter(task -> task.getStatus() == TaskStatus.NOT_STARTED).count();
        long inProgress = tasks.stream().filter(task -> task.getStatus() == TaskStatus.IN_PROGRESS).count();
        long done = tasks.stream().filter(task -> task.getStatus() == TaskStatus.COMPLETED).count();
        long overdue = tasks.stream().filter(this::isOverdue).count();
        return new DashboardTaskSummaryDTO(tasks.size(), todo, inProgress, done, overdue);
    }

    private DashboardMilestoneSummaryDTO summarizeMilestones(Collection<Milestone> milestones) {
        long completed = milestones.stream().filter(milestone -> milestone.getStatus() == MilestoneStatus.COMPLETED).count();
        return new DashboardMilestoneSummaryDTO(milestones.size(), completed, milestones.size() - completed);
    }

    private DashboardProjectProgressDTO toProjectProgress(Project project, List<Task> tasks, List<Milestone> milestones) {
        long doneTasks = tasks.stream().filter(task -> task.getStatus() == TaskStatus.COMPLETED).count();
        long completedMilestones = milestones.stream().filter(milestone -> milestone.getStatus() == MilestoneStatus.COMPLETED).count();
        long pendingTasks = tasks.stream().filter(task -> task.getStatus() != TaskStatus.COMPLETED).count();
        long overdueTasks = tasks.stream().filter(this::isOverdue).count();
        return new DashboardProjectProgressDTO(
                project.getId(),
                project.getTitle(),
                project.getTeam() != null ? project.getTeam().getName() : null,
                percentage(doneTasks, tasks.size()),
                percentage(completedMilestones, milestones.size()),
                percentage(doneTasks + completedMilestones, tasks.size() + milestones.size()),
                pendingTasks,
                overdueTasks,
                completedMilestones,
                milestones.size()
        );
    }

    private DashboardTaskItemDTO toTaskItem(Task task) {
        return new DashboardTaskItemDTO(
                task.getId(),
                task.getProject() != null ? task.getProject().getId() : null,
                task.getProject() != null ? task.getProject().getTitle() : null,
                task.getTitle(),
                task.getAssignedTo() != null ? task.getAssignedTo().getName() : null,
                task.getDueDate(),
                task.getStatus()
        );
    }

    private DashboardMilestoneItemDTO toMilestoneItem(Milestone milestone) {
        return new DashboardMilestoneItemDTO(
                milestone.getId(),
                milestone.getProject() != null ? milestone.getProject().getId() : null,
                milestone.getProject() != null ? milestone.getProject().getTitle() : null,
                milestone.getTitle(),
                milestone.getDueDate(),
                milestone.getStatus() == MilestoneStatus.COMPLETED,
                milestone.getCompletedDate()
        );
    }

    private int percentage(long completed, long total) {
        if (total <= 0) {
            return 0;
        }
        return (int) Math.round((completed * 100.0) / total);
    }

    private DashboardTaskSummaryDTO emptyTaskSummary() {
        return new DashboardTaskSummaryDTO(0, 0, 0, 0, 0);
    }

    private DashboardMilestoneSummaryDTO emptyMilestoneSummary() {
        return new DashboardMilestoneSummaryDTO(0, 0, 0);
    }

    private void refreshOverdueTasks() {
        // Overdue is derived from due date and current status.
    }

    private boolean isOverdue(Task task) {
        return task.getDueDate() != null
                && task.getDueDate().isBefore(LocalDate.now())
                && task.getStatus() != TaskStatus.COMPLETED;
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

    private Map<String, Long> categoryMapForProjects(List<Project> projects) {
        return projects.stream()
                .map(this::resolveProjectDomain)
                .map(this::normalizeProjectDomain)
                .collect(Collectors.groupingBy(Function.identity(), LinkedHashMap::new, Collectors.counting()));
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
                normalizeProjectDomain(resolveProjectDomain(project)),
                project.getTeam() != null ? project.getTeam().getName() : null,
                project.getStatus(),
                project.getSupervisor() != null ? project.getSupervisor().getName() : null,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }

    private String resolveProjectDomain(Project project) {
        if (project == null) {
            return null;
        }
        if (StringUtils.hasText(project.getProjectDomain())) {
            return project.getProjectDomain().trim();
        }
        if (project.getTeam() != null && StringUtils.hasText(project.getTeam().getProjectDomain())) {
            return project.getTeam().getProjectDomain().trim();
        }
        return null;
    }

    private String normalizeProjectDomain(String value) {
        return StringUtils.hasText(value) ? value.trim() : "Uncategorized";
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

    private record WorkflowSnapshot(
            DashboardTaskSummaryDTO taskSummary,
            DashboardMilestoneSummaryDTO milestoneSummary,
            List<DashboardTaskItemDTO> overdueTasks,
            List<DashboardMilestoneItemDTO> upcomingMilestones,
            List<DashboardProjectProgressDTO> progress,
            List<DashboardProjectProgressDTO> highestPendingLoadProjects
    ) {
    }
}
