package com.gradproject.platform.modules.supervisor;

import com.gradproject.platform.modules.meeting.MeetingRepository;
import com.gradproject.platform.modules.meeting.MeetingStatus;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.supervisor.dto.SupervisorStudentDTO;
import com.gradproject.platform.modules.task.TaskRepository;
import com.gradproject.platform.modules.task.TaskStatus;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class SupervisorStudentService {

    private final ProjectRepository projectRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TaskRepository taskRepository;
    private final MeetingRepository meetingRepository;
    private final UserRepository userRepository;

    public SupervisorStudentService(ProjectRepository projectRepository,
                                    TeamMemberRepository teamMemberRepository,
                                    TaskRepository taskRepository,
                                    MeetingRepository meetingRepository,
                                    UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.taskRepository = taskRepository;
        this.meetingRepository = meetingRepository;
        this.userRepository = userRepository;
    }

    public List<SupervisorStudentDTO> getMyStudents() {
        User supervisor = requireCurrentUser();
        if (supervisor.getRole() != UserRole.ROLE_SUPERVISOR) {
            throw new AccessDeniedException("Only supervisors can view assigned students.");
        }

        return projectRepository.findBySupervisorIdOrderByCreatedAtDesc(supervisor.getId())
                .stream()
                .flatMap(project -> buildProjectStudents(project).stream()
                        .map(student -> toDto(student, project)))
                .toList();
    }

    private List<User> buildProjectStudents(Project project) {
        Map<UUID, User> students = new LinkedHashMap<>();
        Team team = project.getTeam();

        if (team != null && team.getLeader() != null && team.getLeader().getRole() == UserRole.ROLE_STUDENT) {
            students.put(team.getLeader().getId(), team.getLeader());
        }

        if (team != null) {
            teamMemberRepository.findAllByTeamId(team.getId()).forEach(member -> {
                User user = member.getUser();
                if (user != null && user.getRole() == UserRole.ROLE_STUDENT) {
                    students.putIfAbsent(user.getId(), user);
                }
            });
        } else if (project.getStudent() != null && project.getStudent().getRole() == UserRole.ROLE_STUDENT) {
            students.put(project.getStudent().getId(), project.getStudent());
        }

        return new ArrayList<>(students.values());
    }

    private SupervisorStudentDTO toDto(User student, Project project) {
        long taskCount = taskRepository.countByProjectIdAndAssignedToId(project.getId(), student.getId());
        long completedTaskCount = taskRepository.countByProjectIdAndAssignedToIdAndStatus(project.getId(), student.getId(), TaskStatus.COMPLETED);
        long meetingCount = meetingRepository.countByProjectIdAndStatus(project.getId(), MeetingStatus.COMPLETED);

        return new SupervisorStudentDTO(
                student.getId(),
                student.getName(),
                student.getEmail(),
                student.getUniversityId(),
                student.getDepartment() != null ? student.getDepartment().name() : null,
                student.getProfilePhotoUrl(),
                project.getTeam() != null ? project.getTeam().getName() : null,
                project.getId(),
                project.getTitle(),
                project.getStatus(),
                taskCount,
                completedTaskCount,
                meetingCount,
                meetingRepository.findFirstByProjectIdAndStatusOrderByMeetingDateDesc(project.getId(), MeetingStatus.COMPLETED)
                        .map(meeting -> meeting.getMeetingDate())
                        .orElse(null)
        );
    }

    private User requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authenticated user not found.");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return userRepository.findById(user.getId())
                    .orElseThrow(() -> new AccessDeniedException("Authenticated user not found."));
        }
        if (principal instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new AccessDeniedException("Authenticated user not found."));
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found."));
    }
}
