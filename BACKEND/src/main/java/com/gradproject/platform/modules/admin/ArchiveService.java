package com.gradproject.platform.modules.admin;

import com.gradproject.platform.exception.ProjectNotArchivableException;
import com.gradproject.platform.modules.notification.NotificationService;
import com.gradproject.platform.modules.notification.NotificationType;
import com.gradproject.platform.exception.ProjectNotFoundException;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.project.dto.ArchiveProjectResponseDTO;
import com.gradproject.platform.modules.project.dto.GraduatedStudentDTO;
import com.gradproject.platform.modules.project.history.ProjectHistory;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ArchiveService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final NotificationService notificationService;

    public ArchiveProjectResponseDTO archiveProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));

        if (project.getStatus() == ProjectStatus.ARCHIVED) {
            throw new ProjectNotArchivableException("Project is already archived.");
        }

        if (project.getStatus() != ProjectStatus.APPROVED) {
            throw new ProjectNotArchivableException("Only approved projects can be archived.");
        }

        User admin = resolveCurrentAdmin();
        Instant archivedAt = Instant.now();

        Map<UUID, User> studentsById = new LinkedHashMap<>();
        collectStudent(studentsById, project.getStudent());

        Team team = project.getTeam();
        if (team != null) {
            collectStudent(studentsById, team.getLeader());
            teamMemberRepository.findAllByTeamId(team.getId())
                    .forEach(member -> collectStudent(studentsById, member.getUser()));
        }

        List<User> students = new ArrayList<>(studentsById.values());
        students.forEach(student -> student.setGraduated(true));
        userRepository.saveAll(students);

        ProjectHistory history = ProjectHistory.builder()
                .project(project)
                .previousStatus(project.getStatus())
                .newStatus(ProjectStatus.ARCHIVED)
                .performedBy(admin)
                .archivedAt(archivedAt)
                .build();

        project.setStatus(ProjectStatus.ARCHIVED);
        project.getHistoryEntries().add(history);
        projectRepository.save(project);

        List<User> recipients = new ArrayList<>(students);
        if (project.getSupervisor() != null) {
            recipients.add(project.getSupervisor());
        }
        notificationService.createNotifications(
                recipients,
                "Project archived",
                "Project \"" + project.getTitle() + "\" has been archived.",
                NotificationType.PROJECT_ARCHIVED,
                "/project?projectId=" + project.getId()
        );

        return ArchiveProjectResponseDTO.builder()
                .projectId(project.getId())
                .projectStatus(project.getStatus())
                .archivedAt(archivedAt)
                .archivedByAdminId(admin.getId())
                .graduatedStudents(students.stream()
                        .map(this::toStudentDto)
                        .toList())
                .build();
    }

    private void collectStudent(Map<UUID, User> studentsById, User user) {
        if (user != null && user.getId() != null && user.getRole() == UserRole.ROLE_STUDENT) {
            studentsById.putIfAbsent(user.getId(), user);
        }
    }

    private User resolveCurrentAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ProjectNotArchivableException("Authenticated administrator not found");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return userRepository.findById(user.getId())
                    .orElseThrow(() -> new ProjectNotArchivableException("Authenticated administrator not found"));
        }

        if (principal instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new ProjectNotArchivableException("Authenticated administrator not found"));
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ProjectNotArchivableException("Authenticated administrator not found"));
    }

    private GraduatedStudentDTO toStudentDto(User user) {
        return GraduatedStudentDTO.builder()
                .studentId(user.getId())
                .studentName(user.getName())
                .email(user.getEmail())
                .build();
    }
}

