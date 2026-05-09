package com.gradproject.platform.modules.dean;

import com.gradproject.platform.modules.dean.dto.DirectoryProjectSummaryDTO;
import com.gradproject.platform.modules.dean.dto.DirectoryStudentDTO;
import com.gradproject.platform.modules.dean.dto.DirectorySupervisorDTO;
import com.gradproject.platform.modules.dean.dto.DirectoryTeamDTO;
import com.gradproject.platform.modules.dean.dto.DirectoryUserDTO;
import com.gradproject.platform.modules.milestone.Milestone;
import com.gradproject.platform.modules.milestone.MilestoneRepository;
import com.gradproject.platform.modules.milestone.MilestoneStatus;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.task.Task;
import com.gradproject.platform.modules.task.TaskRepository;
import com.gradproject.platform.modules.task.TaskStatus;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.team.TeamRepository;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class DeanDirectoryService {
    private static final int SUPERVISOR_CAPACITY_LIMIT = 5;

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final MilestoneRepository milestoneRepository;

    public DeanDirectoryService(
            UserRepository userRepository,
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            ProjectRepository projectRepository,
            TaskRepository taskRepository,
            MilestoneRepository milestoneRepository
    ) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.milestoneRepository = milestoneRepository;
    }

    @Transactional(readOnly = true)
    public List<DirectorySupervisorDTO> getSupervisors() {
        return userRepository.findByRoleOrderByNameAsc(UserRole.ROLE_SUPERVISOR)
                .stream()
                .map(this::toSupervisorDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DirectoryTeamDTO> getTeams() {
        return teamRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Team::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toTeamDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DirectoryStudentDTO> getStudents() {
        return userRepository.findByRoleOrderByNameAsc(UserRole.ROLE_STUDENT)
                .stream()
                .map(this::toStudentDto)
                .toList();
    }

    private DirectorySupervisorDTO toSupervisorDto(User supervisor) {
        List<Project> assignedProjects = projectRepository.findBySupervisorIdOrderByCreatedAtDesc(supervisor.getId());
        long completedProjectsCount = assignedProjects.stream()
                .filter(project -> project.getStatus() == ProjectStatus.ARCHIVED)
                .count();
        long activeProjectsCount = assignedProjects.size() - completedProjectsCount;
        long assignedTeamsCount = assignedProjects.stream()
                .filter(project -> project.getStatus() != ProjectStatus.ARCHIVED)
                .map(Project::getTeam)
                .filter(java.util.Objects::nonNull)
                .map(Team::getId)
                .distinct()
                .count();
        long currentLoad = assignedTeamsCount > 0 ? assignedTeamsCount : activeProjectsCount;

        return new DirectorySupervisorDTO(
                supervisor.getId(),
                supervisor.getName(),
                supervisor.getEmail(),
                supervisor.getUniversityId(),
                departmentName(supervisor),
                supervisor.getSpecialty(),
                supervisor.getOfficeHours(),
                supervisor.getProfilePhotoUrl(),
                assignedProjects.size(),
                assignedTeamsCount,
                activeProjectsCount,
                completedProjectsCount,
                SUPERVISOR_CAPACITY_LIMIT,
                capacityStatus(currentLoad).name(),
                assignedProjects.stream().limit(5).map(this::toProjectSummaryDto).toList()
        );
    }

    private DirectoryTeamDTO toTeamDto(Team team) {
        List<TeamMember> members = teamMemberRepository.findAllByTeamId(team.getId());
        Project project = projectRepository.findByTeamId(team.getId()).orElse(null);
        User supervisor = team.getSupervisor() != null ? team.getSupervisor() : project != null ? project.getSupervisor() : null;
        HealthResult health = calculateProjectHealth(project);

        return new DirectoryTeamDTO(
                team.getId(),
                team.getName(),
                project != null ? project.getId() : null,
                project != null ? project.getTitle() : null,
                project != null && project.getStatus() != null ? project.getStatus().name() : null,
                health.health() != null ? health.health().name() : null,
                health.label(),
                health.reason(),
                toUserDto(supervisor, null),
                toUserDto(team.getLeader(), "LEADER"),
                members.stream()
                        .map(member -> toUserDto(member.getUser(), member.getMemberRole()))
                        .toList(),
                members.size(),
                team.getMaxSize(),
                team.getCreatedAt()
        );
    }

    private DirectoryStudentDTO toStudentDto(User student) {
        Optional<TeamMember> membership = teamMemberRepository.findByUserId(student.getId());
        Team team = membership.map(TeamMember::getTeam).orElse(null);
        Project project = team != null
                ? projectRepository.findByTeamId(team.getId()).orElse(null)
                : projectRepository.findByStudentId(student.getId()).orElse(null);
        User supervisor = project != null && project.getSupervisor() != null
                ? project.getSupervisor()
                : team != null ? team.getSupervisor() : null;
        long assignedTasksCount = project != null ? taskRepository.countByProjectIdAndAssignedToId(project.getId(), student.getId()) : 0;
        long completedTasksCount = project != null ? taskRepository.countByProjectIdAndAssignedToIdAndStatus(project.getId(), student.getId(), TaskStatus.COMPLETED) : 0;
        HealthResult health = calculateProjectHealth(project);

        return new DirectoryStudentDTO(
                student.getId(),
                student.getName(),
                student.getEmail(),
                student.getUniversityId(),
                departmentName(student),
                student.getSpecialty(),
                student.getPhoneNumber(),
                student.getProfilePhotoUrl(),
                team != null ? team.getId() : null,
                team != null ? team.getName() : null,
                project != null ? project.getId() : null,
                project != null ? project.getTitle() : null,
                project != null && project.getStatus() != null ? project.getStatus().name() : null,
                health.health() != null ? health.health().name() : null,
                health.label(),
                supervisor != null ? supervisor.getId() : null,
                supervisor != null ? supervisor.getName() : null,
                supervisor != null ? supervisor.getEmail() : null,
                supervisor != null ? supervisor.getProfilePhotoUrl() : null,
                assignedTasksCount,
                completedTasksCount
        );
    }

    private DirectoryProjectSummaryDTO toProjectSummaryDto(Project project) {
        return new DirectoryProjectSummaryDTO(
                project.getId(),
                project.getTitle(),
                project.getStatus() != null ? project.getStatus().name() : null
        );
    }

    private DirectoryUserDTO toUserDto(User user, String roleInTeam) {
        if (user == null) {
            return null;
        }

        return new DirectoryUserDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getUniversityId(),
                departmentName(user),
                user.getSpecialty(),
                user.getPhoneNumber(),
                user.getOfficeHours(),
                user.getProfilePhotoUrl(),
                roleInTeam
        );
    }

    private String departmentName(User user) {
        return user != null && user.getDepartment() != null ? user.getDepartment().name() : null;
    }

    private SupervisorCapacityStatus capacityStatus(long assignedCount) {
        if (assignedCount < SUPERVISOR_CAPACITY_LIMIT) {
            return SupervisorCapacityStatus.AVAILABLE;
        }
        if (assignedCount == SUPERVISOR_CAPACITY_LIMIT) {
            return SupervisorCapacityStatus.FULL_CAPACITY;
        }
        return SupervisorCapacityStatus.OVERLOADED;
    }

    private HealthResult calculateProjectHealth(Project project) {
        if (project == null || project.getId() == null) {
            return new HealthResult(null, "No Project", "No project linked");
        }

        List<Task> tasks = taskRepository.findByProjectIdOrderByDueDateAscCreatedAtDesc(project.getId());
        List<Milestone> milestones = milestoneRepository.findByProjectIdOrderByDueDateAscCreatedAtDesc(project.getId());
        LocalDate today = LocalDate.now();

        boolean overdueTask = tasks.stream().anyMatch(task ->
                task.getDueDate() != null
                        && task.getDueDate().isBefore(today)
                        && task.getStatus() != TaskStatus.COMPLETED);
        boolean overdueMilestone = milestones.stream().anyMatch(milestone ->
                milestone.getDueDate() != null
                        && milestone.getDueDate().isBefore(today)
                        && !isMilestoneComplete(milestone.getStatus()));

        if (overdueTask || overdueMilestone) {
            return new HealthResult(ProjectHealth.DELAYED, "Delayed", overdueTask ? "Overdue task detected" : "Overdue milestone detected");
        }

        boolean blockedTask = tasks.stream().anyMatch(task -> task.getStatus() == TaskStatus.BLOCKED);
        boolean needsChangesMilestone = milestones.stream().anyMatch(milestone -> milestone.getStatus() == MilestoneStatus.NEEDS_CHANGES);

        if (blockedTask || needsChangesMilestone) {
            return new HealthResult(ProjectHealth.AT_RISK, "At Risk", blockedTask ? "Blocked task detected" : "Milestone needs changes");
        }

        long totalProgressItems = tasks.size() + milestones.size();
        long completedProgressItems = tasks.stream().filter(task -> task.getStatus() == TaskStatus.COMPLETED).count()
                + milestones.stream().filter(milestone -> isMilestoneComplete(milestone.getStatus())).count();

        if (totalProgressItems > 0 && ((double) completedProgressItems / totalProgressItems) >= 0.8d) {
            return new HealthResult(ProjectHealth.EXCELLENT, "Excellent", "Completion rate is at least 80%");
        }

        return new HealthResult(ProjectHealth.ON_TRACK, "On Track", totalProgressItems == 0 ? "No risk detected yet" : "No overdue or blocked work detected");
    }

    private boolean isMilestoneComplete(MilestoneStatus status) {
        return status == MilestoneStatus.COMPLETED || status == MilestoneStatus.APPROVED;
    }

    private record HealthResult(ProjectHealth health, String label, String reason) {
    }
}
