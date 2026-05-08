package com.gradproject.platform.modules.meeting;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.meeting.dto.MeetingAttendanceRequestDTO;
import com.gradproject.platform.modules.meeting.dto.MeetingCompletionDTO;
import com.gradproject.platform.modules.meeting.dto.MeetingDraftDTO;
import com.gradproject.platform.modules.notification.NotificationService;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class MeetingServiceTest {

    @Mock MeetingRepository meetingRepository;
    @Mock ProjectRepository projectRepository;
    @Mock UserRepository userRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock NotificationService notificationService;

    MeetingService service;
    User supervisor;
    User otherSupervisor;
    User student;
    User teammate;
    User dean;
    User unrelatedStudent;
    Project project;
    Team team;

    @BeforeEach
    void setUp() {
        service = new MeetingService(meetingRepository, projectRepository, userRepository, teamMemberRepository, notificationService);
        supervisor = user(UUID.randomUUID(), "supervisor@example.com", UserRole.ROLE_SUPERVISOR);
        otherSupervisor = user(UUID.randomUUID(), "other-supervisor@example.com", UserRole.ROLE_SUPERVISOR);
        student = user(UUID.randomUUID(), "student@example.com", UserRole.ROLE_STUDENT);
        teammate = user(UUID.randomUUID(), "teammate@example.com", UserRole.ROLE_STUDENT);
        dean = user(UUID.randomUUID(), "dean@example.com", UserRole.ROLE_DEAN_OFFICE);
        unrelatedStudent = user(UUID.randomUUID(), "other-student@example.com", UserRole.ROLE_STUDENT);
        team = team(UUID.randomUUID(), student);
        project = project(UUID.randomUUID(), team, student, supervisor);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void assignedSupervisorCanCreateMeeting() {
        authenticate(supervisor);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(member(team, teammate, "MEMBER")));
        when(meetingRepository.save(any(Meeting.class))).thenAnswer(invocation -> {
            Meeting meeting = invocation.getArgument(0);
            ReflectionTestUtils.setField(meeting, "id", UUID.randomUUID());
            return meeting;
        });

        var response = service.createMeeting(project.getId(), draftRequest());

        assertThat(response.projectId()).isEqualTo(project.getId());
        assertThat(response.supervisorId()).isEqualTo(supervisor.getId());
        assertThat(response.canEdit()).isTrue();
        assertThat(response.attendance()).isEmpty();
    }

    @Test
    void unassignedSupervisorCannotCreateMeeting() {
        authenticate(otherSupervisor);
        when(userRepository.findById(otherSupervisor.getId())).thenReturn(Optional.of(otherSupervisor));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> service.createMeeting(project.getId(), draftRequest()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("You are not assigned to this project.");
    }

    @Test
    void studentCanViewOwnProjectMeetings() {
        Meeting meeting = meeting(project, supervisor);
        authenticate(student);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(meetingRepository.findAllByProjectIdOrderByMeetingDateDesc(project.getId())).thenReturn(List.of(meeting));

        var meetings = service.getProjectMeetings(project.getId());

        assertThat(meetings).hasSize(1);
        assertThat(meetings.get(0).attendance()).isNotEmpty();
    }

    @Test
    void unrelatedStudentCannotViewMeetings() {
        authenticate(unrelatedStudent);
        when(userRepository.findById(unrelatedStudent.getId())).thenReturn(Optional.of(unrelatedStudent));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(teamMemberRepository.findByTeamIdAndUserId(team.getId(), unrelatedStudent.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getProjectMeetings(project.getId()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("You are not allowed to view meetings for this project.");
    }

    @Test
    void deanCanViewMeetings() {
        authenticate(dean);
        when(userRepository.findById(dean.getId())).thenReturn(Optional.of(dean));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(meetingRepository.findAllByProjectIdOrderByMeetingDateDesc(project.getId())).thenReturn(List.of(meeting(project, supervisor)));

        assertThat(service.getProjectMeetings(project.getId())).hasSize(1);
    }

    @Test
    void archivedProjectMeetingsAreReadOnly() {
        Meeting archivedMeeting = meeting(project, supervisor);
        project.setStatus(ProjectStatus.ARCHIVED);
        archivedMeeting.setProject(project);
        authenticate(supervisor);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(meetingRepository.findDetailedById(archivedMeeting.getId())).thenReturn(Optional.of(archivedMeeting));

        assertThatThrownBy(() -> service.updateMeeting(archivedMeeting.getId(), draftRequest()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Archived project meetings are read-only.");
    }

    @Test
    void attendanceStudentsMustBelongToProjectTeam() {
        User outsider = user(UUID.randomUUID(), "outsider@example.com", UserRole.ROLE_STUDENT);
        Meeting scheduledMeeting = meeting(project, supervisor);
        scheduledMeeting.setStatus(MeetingStatus.SCHEDULED);

        authenticate(supervisor);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(meetingRepository.findDetailedById(scheduledMeeting.getId())).thenReturn(Optional.of(scheduledMeeting));
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(member(team, teammate, "MEMBER")));

        MeetingCompletionDTO invalidRequest = new MeetingCompletionDTO(
                "Weekly sync",
                LocalDateTime.now().plusDays(1),
                "Summary",
                "Progress",
                "Tasks",
                "Next steps",
                LocalDateTime.now().plusDays(7),
                null,
                null,
                null,
                List.of(
                        new MeetingAttendanceRequestDTO(student.getId(), MeetingAttendanceStatus.PRESENT, null),
                        new MeetingAttendanceRequestDTO(outsider.getId(), MeetingAttendanceStatus.ABSENT, "Missing")
                )
        );

        assertThatThrownBy(() -> service.completeMeeting(scheduledMeeting.getId(), invalidRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Student is not a member of this project team.");
    }

    @Test
    void editMeetingUpdatesAttendance() {
        Meeting existingMeeting = meeting(project, supervisor);
        existingMeeting.setAttendanceRecords(new java.util.ArrayList<>());

        authenticate(supervisor);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(meetingRepository.findDetailedById(existingMeeting.getId())).thenReturn(Optional.of(existingMeeting));
        when(meetingRepository.save(any(Meeting.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.updateMeeting(existingMeeting.getId(), draftRequest());

        assertThat(response.attendance()).isEmpty();
    }

    @Test
    void studentMyMeetingsReturnsEmptyWhenNoProject() {
        authenticate(student);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(projectRepository.findByStudentId(student.getId())).thenReturn(Optional.empty());
        when(teamMemberRepository.findByUserId(student.getId())).thenReturn(Optional.empty());

        var result = service.getMyMeetings();

        assertThat(result).isEmpty();
        verify(meetingRepository, never()).findAllByProjectIdOrderByMeetingDateDesc(any());
    }

    @Test
    void supervisorMeetingsIncludeRequestedMeetingsForAssignedProject() {
        Meeting requestedMeeting = meeting(project, supervisor);
        requestedMeeting.setSupervisor(null);
        requestedMeeting.setStatus(MeetingStatus.REQUESTED);
        requestedMeeting.setRequestedBy(student);

        authenticate(supervisor);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(projectRepository.findBySupervisorIdOrderByCreatedAtDesc(supervisor.getId())).thenReturn(List.of(project));
        when(meetingRepository.findAllByProjectIdOrderByMeetingDateDesc(project.getId())).thenReturn(List.of(requestedMeeting));

        var result = service.getSupervisorMeetings();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).status()).isEqualTo(MeetingStatus.REQUESTED.name());
    }

    @Test
    void assignedSupervisorCanApproveRequestedMeetingWithoutMeetingSupervisor() {
        Meeting requestedMeeting = meeting(project, supervisor);
        requestedMeeting.setSupervisor(null);
        requestedMeeting.setStatus(MeetingStatus.REQUESTED);
        requestedMeeting.setRequestedBy(student);

        authenticate(supervisor);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(meetingRepository.findDetailedById(requestedMeeting.getId())).thenReturn(Optional.of(requestedMeeting));
        when(meetingRepository.save(any(Meeting.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.approveMeetingRequest(requestedMeeting.getId());

        assertThat(result.status()).isEqualTo(MeetingStatus.SCHEDULED.name());
        assertThat(result.supervisorId()).isEqualTo(supervisor.getId());
    }

    @Test
    void studentCanRequestMeetingWithoutAttendance() {
        authenticate(student);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(meetingRepository.save(any(Meeting.class))).thenAnswer(invocation -> {
            Meeting meeting = invocation.getArgument(0);
            ReflectionTestUtils.setField(meeting, "id", UUID.randomUUID());
            return meeting;
        });

        var result = service.requestMeeting(project.getId(), draftRequest());

        assertThat(result.status()).isEqualTo(MeetingStatus.REQUESTED.name());
        assertThat(result.attendance()).isEmpty();
    }

    @Test
    void completingMeetingStillRequiresAttendance() {
        Meeting scheduledMeeting = meeting(project, supervisor);
        scheduledMeeting.setStatus(MeetingStatus.SCHEDULED);
        scheduledMeeting.setAttendanceRecords(new java.util.ArrayList<>());

        authenticate(supervisor);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(meetingRepository.findDetailedById(scheduledMeeting.getId())).thenReturn(Optional.of(scheduledMeeting));
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(member(team, teammate, "MEMBER")));

        assertThatThrownBy(() -> service.completeMeeting(scheduledMeeting.getId(), completionWithoutAttendance()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Attendance status is required.");
    }

    @Test
    void studentCanCancelOnlyOwnRequestedMeeting() {
        Meeting requestedMeeting = meeting(project, supervisor);
        requestedMeeting.setSupervisor(null);
        requestedMeeting.setStatus(MeetingStatus.REQUESTED);
        requestedMeeting.setRequestedBy(student);

        authenticate(student);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(meetingRepository.findDetailedById(requestedMeeting.getId())).thenReturn(Optional.of(requestedMeeting));
        when(meetingRepository.save(any(Meeting.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.cancelMeeting(requestedMeeting.getId());

        assertThat(result.status()).isEqualTo(MeetingStatus.CANCELED.name());
    }

    @Test
    void studentCannotCancelScheduledMeetingTheyDidNotRequest() {
        Meeting scheduledMeeting = meeting(project, supervisor);
        scheduledMeeting.setStatus(MeetingStatus.SCHEDULED);
        scheduledMeeting.setRequestedBy(null);

        authenticate(student);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(meetingRepository.findDetailedById(scheduledMeeting.getId())).thenReturn(Optional.of(scheduledMeeting));

        assertThatThrownBy(() -> service.cancelMeeting(scheduledMeeting.getId()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("You are not allowed to modify this meeting.");
    }

    private static MeetingDraftDTO draftRequest() {
        return new MeetingDraftDTO(
                "Weekly sync",
                LocalDateTime.now().plusDays(1),
                "Summary",
                "Progress",
                "Tasks",
                "Next steps",
                LocalDateTime.now().plusDays(7),
                null,
                null,
                null
        );
    }

    private static MeetingCompletionDTO completionRequest(User leader, User teammate) {
        return new MeetingCompletionDTO(
                "Weekly sync",
                LocalDateTime.now().plusDays(1),
                "Summary",
                "Progress",
                "Tasks",
                "Next steps",
                LocalDateTime.now().plusDays(7),
                null,
                null,
                null,
                List.of(
                        new MeetingAttendanceRequestDTO(leader.getId(), MeetingAttendanceStatus.PRESENT, null),
                        new MeetingAttendanceRequestDTO(teammate.getId(), MeetingAttendanceStatus.ABSENT, "Sick leave")
                )
        );
    }

    private static MeetingCompletionDTO completionWithoutAttendance() {
        return new MeetingCompletionDTO(
                "Weekly sync",
                LocalDateTime.now().plusDays(1),
                "Summary",
                "Progress",
                "Tasks",
                "Next steps",
                LocalDateTime.now().plusDays(7),
                null,
                null,
                null,
                List.of()
        );
    }

    private static Meeting meeting(Project project, User supervisor) {
        Meeting meeting = Meeting.builder()
                .project(project)
                .supervisor(supervisor)
                .title("Meeting")
                .meetingDate(LocalDateTime.now().minusDays(1))
                .summary("Summary")
                .progressDiscussed("Progress")
                .tasksAssigned("Tasks")
                .nextSteps("Next")
                .attendanceRecords(new java.util.ArrayList<>(List.of(
                        MeetingAttendance.builder().student(project.getStudent()).status(MeetingAttendanceStatus.PRESENT).build()
                )))
                .build();
        ReflectionTestUtils.setField(meeting, "id", UUID.randomUUID());
        return meeting;
    }

    private static TeamMember member(Team team, User user, String role) {
        return TeamMember.builder().team(team).user(user).memberRole(role).membershipStatus("ACTIVE").build();
    }

    private static Team team(UUID id, User leader) {
        Team team = new Team();
        ReflectionTestUtils.setField(team, "id", id);
        team.setName("Team");
        team.setLeader(leader);
        team.setMaxSize(5);
        return team;
    }

    private static Project project(UUID id, Team team, User student, User supervisor) {
        Project project = new Project();
        project.setId(id);
        project.setTitle("Project");
        project.setDescription("Description");
        project.setTeam(team);
        project.setStudent(student);
        project.setSupervisor(supervisor);
        project.setStatus(ProjectStatus.UNDER_REVIEW);
        return project;
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

    private static void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
    }
}
