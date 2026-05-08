package com.gradproject.platform.modules.meeting;

import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PdfGeneratorServiceTest {

    @Mock MeetingRepository meetingRepository;
    @Mock UserRepository userRepository;
    @Mock TeamMemberRepository teamMemberRepository;

    @Test
    void meetingPdfAccessIsAuthorized() {
        User supervisor = user(UUID.randomUUID(), "supervisor@example.com", UserRole.ROLE_SUPERVISOR);
        User student = user(UUID.randomUUID(), "student@example.com", UserRole.ROLE_STUDENT);
        Project project = project(UUID.randomUUID(), student, supervisor);
        Meeting meeting = meeting(project, supervisor);
        PdfGeneratorService service = new PdfGeneratorService(meetingRepository, userRepository, teamMemberRepository);

        when(meetingRepository.findDetailedById(meeting.getId())).thenReturn(Optional.of(meeting));

        Authentication auth = new UsernamePasswordAuthenticationToken(student, null, student.getAuthorities());

        assertThat(service.generateMeetingForm(meeting.getId(), auth)).isNotNull();
    }

    @Test
    void meetingPdfAccessIsDeniedForUnrelatedStudent() {
        User supervisor = user(UUID.randomUUID(), "supervisor@example.com", UserRole.ROLE_SUPERVISOR);
        User student = user(UUID.randomUUID(), "student@example.com", UserRole.ROLE_STUDENT);
        User unrelated = user(UUID.randomUUID(), "other@example.com", UserRole.ROLE_STUDENT);
        Project project = project(UUID.randomUUID(), student, supervisor);
        Meeting meeting = meeting(project, supervisor);
        PdfGeneratorService service = new PdfGeneratorService(meetingRepository, userRepository, teamMemberRepository);

        when(meetingRepository.findDetailedById(meeting.getId())).thenReturn(Optional.of(meeting));
        when(teamMemberRepository.findByTeamIdAndUserId(project.getTeam().getId(), unrelated.getId())).thenReturn(Optional.empty());

        Authentication auth = new UsernamePasswordAuthenticationToken(unrelated, null, unrelated.getAuthorities());

        assertThatThrownBy(() -> service.generateMeetingForm(meeting.getId(), auth))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("You are not allowed to download this meeting form");
    }

    private static Meeting meeting(Project project, User supervisor) {
        Meeting meeting = Meeting.builder()
                .project(project)
                .supervisor(supervisor)
                .title("Weekly sync")
                .meetingDate(LocalDateTime.now())
                .summary("Summary")
                .progressDiscussed("Progress")
                .tasksAssigned("Tasks")
                .nextSteps("Next")
                .attendanceRecords(new java.util.ArrayList<>(java.util.List.of(
                        MeetingAttendance.builder().student(project.getStudent()).status(MeetingAttendanceStatus.PRESENT).build()
                )))
                .build();
        ReflectionTestUtils.setField(meeting, "id", UUID.randomUUID());
        return meeting;
    }

    private static Project project(UUID id, User student, User supervisor) {
        Team team = new Team();
        ReflectionTestUtils.setField(team, "id", UUID.randomUUID());
        team.setName("Team");
        team.setLeader(student);
        team.setMaxSize(5);

        Project project = new Project();
        project.setId(id);
        project.setTitle("Project");
        project.setDescription("Description");
        project.setStudent(student);
        project.setTeam(team);
        project.setSupervisor(supervisor);
        project.setStatus(ProjectStatus.UNDER_REVIEW);
        return project;
    }

    private static TeamMember member(Team team, User user) {
        return TeamMember.builder().team(team).user(user).memberRole("MEMBER").membershipStatus("ACTIVE").build();
    }

    private static User user(UUID id, String email, UserRole role) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setEmail(email);
        user.setName(email);
        user.setPasswordHash("secret");
        user.setRole(role);
        return user;
    }
}
