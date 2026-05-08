package com.gradproject.platform.modules.milestone;

import com.gradproject.platform.modules.notification.NotificationService;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectCollaborationAccessService;
import com.gradproject.platform.modules.project.storage.FileStorageService;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRole;
import com.gradproject.platform.modules.milestone.dto.MilestoneUpsertRequestDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MilestoneServiceTest {

    @Mock MilestoneRepository milestoneRepository;
    @Mock ProjectCollaborationAccessService accessService;
    @Mock NotificationService notificationService;
    @Mock FileStorageService fileStorageService;

    @InjectMocks MilestoneService milestoneService;

    @Test
    void createMilestoneNotifiesProjectStudents() {
        Project project = project();
        User supervisor = user("supervisor@example.com", UserRole.ROLE_SUPERVISOR);
        User student = user("student@example.com", UserRole.ROLE_STUDENT);

        when(accessService.requireProjectManageAccess(project.getId())).thenReturn(project);
        when(accessService.requireCurrentUser()).thenReturn(supervisor);
        when(accessService.getProjectStudents(project)).thenReturn(List.of(student));
        when(milestoneRepository.save(any(Milestone.class))).thenAnswer(invocation -> {
            Milestone milestone = invocation.getArgument(0);
            ReflectionTestUtils.setField(milestone, "id", UUID.randomUUID());
            return milestone;
        });

        milestoneService.createMilestone(project.getId(), new MilestoneUpsertRequestDTO(
                "Mid Review",
                "Prepare review",
                LocalDate.now().plusDays(5),
                "Slides and report",
                null,
                null,
                null
        ));

        verify(notificationService, times(1)).createNotifications(any(), any(), any(), any(), any());
    }

    private static Project project() {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setTitle("Project A");
        Team team = new Team();
        ReflectionTestUtils.setField(team, "id", UUID.randomUUID());
        team.setName("Team A");
        project.setTeam(team);
        return project;
    }

    private static User user(String email, UserRole role) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.setEmail(email);
        user.setName(email);
        user.setPasswordHash("secret");
        user.setRole(role);
        return user;
    }
}
