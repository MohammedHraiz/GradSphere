package com.gradproject.platform.modules.project;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.meeting.BulkDownloadService;
import com.gradproject.platform.modules.notification.NotificationService;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.project.submission.ProposalSubmission;
import com.gradproject.platform.modules.project.submission.ProposalSubmissionRepository;
import com.gradproject.platform.modules.project.storage.FileStorageService;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestRepository;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequest;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestStatus;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectControllerTest {

    @Mock ProjectRepository projectRepository;
    @Mock UserRepository userRepository;
    @Mock FileStorageService fileStorageService;
    @Mock BulkDownloadService bulkDownloadService;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock SupervisorRequestRepository supervisorRequestRepository;
    @Mock ProposalSubmissionRepository proposalSubmissionRepository;
    @Mock NotificationService notificationService;

    ProjectController controller;
    User leader;
    User supervisor;
    Team currentTeam;

    @BeforeEach
    void setUp() {
        ProjectService projectService = new ProjectService(projectRepository, userRepository, supervisorRequestRepository, teamMemberRepository, fileStorageService, proposalSubmissionRepository, notificationService);
        controller = new ProjectController(projectRepository, userRepository, projectService, fileStorageService, bulkDownloadService, teamMemberRepository, supervisorRequestRepository);
        leader = user(UUID.randomUUID(), "leader@example.com");
        supervisor = user(UUID.randomUUID(), "supervisor@example.com", UserRole.ROLE_SUPERVISOR);
        currentTeam = team(UUID.randomUUID(), leader);
    }

    @Test
    void leaderSubmitsProposalWithoutTitleUsingTeamNameAndCreatesSupervisorRequest() {
        currentTeam.setName("Smart Campus System");
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(member(currentTeam, leader, "LEADER")));
        when(projectRepository.findByTeamId(currentTeam.getId())).thenReturn(Optional.empty());
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(supervisorRequestRepository.existsByProjectIdAndSupervisorIdAndStatus(any(), any(), any())).thenReturn(false);
        when(supervisorRequestRepository.existsByProjectIdAndStatus(any(), any())).thenReturn(false);
        when(proposalSubmissionRepository.existsByProjectIdAndVersionNumber(any(), any())).thenReturn(false);
        when(fileStorageService.storeProposal(any(Project.class), any(ProposalSubmission.class), any(User.class), any())).thenReturn("/files/proposal.pdf");
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(supervisorRequestRepository.save(any(SupervisorRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(proposalSubmissionRepository.save(any(ProposalSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(supervisorRequestRepository.findFirstByTeamIdAndStatusOrderByCreatedAtDesc(currentTeam.getId(), SupervisorRequestStatus.PENDING)).thenReturn(Optional.empty());
        when(supervisorRequestRepository.findFirstByTeamIdOrderByCreatedAtDesc(currentTeam.getId())).thenReturn(Optional.empty());

        var response = controller.submitProject(
                null,
                "A valid proposal description for this current team",
                new MockMultipartFile("proposalFile", "proposal.pdf", "application/pdf", new byte[] { 1 }),
                supervisor.getId(),
                "Please supervise us",
                new UsernamePasswordAuthenticationToken(leader.getEmail(), null)
        );

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().title()).isEqualTo("Smart Campus System");
        assertThat(response.getBody().proposalVersion()).isEqualTo(1);
        assertThat(currentTeam.getName()).isEqualTo("Smart Campus System");

        org.mockito.ArgumentCaptor<ProposalSubmission> submissionCaptor = org.mockito.ArgumentCaptor.forClass(ProposalSubmission.class);
        verify(proposalSubmissionRepository, times(2)).save(submissionCaptor.capture());
        java.util.List<ProposalSubmission> savedSubmissions = submissionCaptor.getAllValues();
        ProposalSubmission submission = savedSubmissions.get(savedSubmissions.size() - 1);
        assertThat(submission.getVersionNumber()).isEqualTo(1);
        assertThat(submission.getDescription()).isEqualTo("A valid proposal description for this current team");
        assertThat(submission.getDocumentPath()).isEqualTo("/files/proposal.pdf");
        assertThat(submission.getStudentChangeNote()).isEqualTo("Initial submission");
        assertThat(submission.getSubmittedBy()).isEqualTo(leader);
    }

    @Test
    void submissionBlockedIfCurrentTeamAlreadyHasProject() {
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(member(currentTeam, leader, "LEADER")));
        when(projectRepository.findByTeamId(currentTeam.getId())).thenReturn(Optional.of(project(UUID.randomUUID(), currentTeam, leader)));

        assertThatThrownBy(() -> controller.submitProject(
                null,
                "A valid proposal description for this current team",
                new MockMultipartFile("proposalFile", "proposal.pdf", "application/pdf", new byte[] { 1 }),
                supervisor.getId(),
                null,
                new UsernamePasswordAuthenticationToken(leader.getEmail(), null)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Your team already has a submitted project.");
    }

    @Test
    void supervisorIdIsRequiredOnFirstSubmission() {
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(member(currentTeam, leader, "LEADER")));
        when(projectRepository.findByTeamId(currentTeam.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.submitProject(
                null,
                "A valid proposal description for this current team",
                new MockMultipartFile("proposalFile", "proposal.pdf", "application/pdf", new byte[] { 1 }),
                null,
                null,
                new UsernamePasswordAuthenticationToken(leader.getEmail(), null)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Please select a supervisor.");
    }

    @Test
    void nonSupervisorIdIsRejectedOnSubmission() {
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(member(currentTeam, leader, "LEADER")));
        when(projectRepository.findByTeamId(currentTeam.getId())).thenReturn(Optional.empty());
        when(userRepository.findById(leader.getId())).thenReturn(Optional.of(leader));
        when(fileStorageService.storeProposal(any(Project.class), any(ProposalSubmission.class), any(User.class), any())).thenReturn("/files/proposal.pdf");
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThatThrownBy(() -> controller.submitProject(
                null,
                "A valid proposal description for this current team",
                new MockMultipartFile("proposalFile", "proposal.pdf", "application/pdf", new byte[] { 1 }),
                leader.getId(),
                null,
                new UsernamePasswordAuthenticationToken(leader.getEmail(), null)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Selected user is not a supervisor.");
    }

    @Test
    void normalMemberCannotSubmitProposal() {
        currentTeam.setName("Team One");
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(member(currentTeam, leader, "MEMBER")));

        assertThatThrownBy(() -> controller.submitProject(
                null,
                "Valid description",
                new MockMultipartFile("proposalFile", "proposal.pdf", "application/pdf", new byte[] { 1 }),
                supervisor.getId(),
                null,
                new UsernamePasswordAuthenticationToken(leader.getEmail(), null)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Only the team leader can submit the project proposal.");
    }

    @Test
    void submissionIgnoresOldStudentProjectWhenTeamHasNoProject() {
        currentTeam.setName("Current Team");
        Project oldProject = project(UUID.randomUUID(), team(UUID.randomUUID(), leader), leader);
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(member(currentTeam, leader, "LEADER")));
        when(projectRepository.findByTeamId(currentTeam.getId())).thenReturn(Optional.empty());
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(fileStorageService.storeProposal(any(Project.class), any(ProposalSubmission.class), any(User.class), any())).thenReturn("/files/proposal.pdf");
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(supervisorRequestRepository.save(any(SupervisorRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(supervisorRequestRepository.findFirstByTeamIdAndStatusOrderByCreatedAtDesc(currentTeam.getId(), SupervisorRequestStatus.PENDING)).thenReturn(Optional.empty());
        when(supervisorRequestRepository.findFirstByTeamIdOrderByCreatedAtDesc(currentTeam.getId())).thenReturn(Optional.empty());

        var response = controller.submitProject(
                null,
                "New proposal description",
                new MockMultipartFile("proposalFile", "proposal.pdf", "application/pdf", new byte[] { 1 }),
                supervisor.getId(),
                null,
                new UsernamePasswordAuthenticationToken(leader.getEmail(), null)
        );

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().title()).isEqualTo("Current Team");
    }

    @Test
    void myProjectReturnsCurrentTeamProjectForLeader() {
        Project currentProject = project(UUID.randomUUID(), currentTeam, leader);
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(member(currentTeam, leader, "LEADER")));
        when(projectRepository.findByTeamId(currentTeam.getId())).thenReturn(Optional.of(currentProject));
        when(supervisorRequestRepository.findFirstByTeamIdAndStatusOrderByCreatedAtDesc(currentTeam.getId(), SupervisorRequestStatus.PENDING)).thenReturn(Optional.empty());
        when(supervisorRequestRepository.findFirstByTeamIdOrderByCreatedAtDesc(currentTeam.getId())).thenReturn(Optional.empty());

        var response = controller.getMyProject(new UsernamePasswordAuthenticationToken(leader.getEmail(), null));

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().teamId()).isEqualTo(currentTeam.getId());
    }

    @Test
    void myProjectReturnsCurrentTeamProjectForMember() {
        User memberUser = user(UUID.randomUUID(), "member@example.com");
        Project currentProject = project(UUID.randomUUID(), currentTeam, leader);
        when(userRepository.findByEmail(memberUser.getEmail())).thenReturn(Optional.of(memberUser));
        when(teamMemberRepository.findByUserId(memberUser.getId())).thenReturn(Optional.of(member(currentTeam, memberUser, "MEMBER")));
        when(projectRepository.findByTeamId(currentTeam.getId())).thenReturn(Optional.of(currentProject));
        when(supervisorRequestRepository.findFirstByTeamIdAndStatusOrderByCreatedAtDesc(currentTeam.getId(), SupervisorRequestStatus.PENDING)).thenReturn(Optional.empty());
        when(supervisorRequestRepository.findFirstByTeamIdOrderByCreatedAtDesc(currentTeam.getId())).thenReturn(Optional.empty());

        var response = controller.getMyProject(new UsernamePasswordAuthenticationToken(memberUser.getEmail(), null));

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().teamId()).isEqualTo(currentTeam.getId());
    }

    @Test
    void myProjectReturnsNotFoundWhenNoTeam() {
        User memberUser = user(UUID.randomUUID(), "noteam@example.com");
        when(userRepository.findByEmail(memberUser.getEmail())).thenReturn(Optional.of(memberUser));
        when(teamMemberRepository.findByUserId(memberUser.getId())).thenReturn(Optional.empty());

        var response = controller.getMyProject(new UsernamePasswordAuthenticationToken(memberUser.getEmail(), null));

        assertThat(response.getStatusCode().is4xxClientError()).isTrue();
        assertThat(response.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void myProjectDoesNotReturnOldStudentProjectForCurrentTeam() {
        User memberUser = user(UUID.randomUUID(), "member-old@example.com");
        Project oldProject = project(UUID.randomUUID(), team(UUID.randomUUID(), leader), memberUser);
        when(userRepository.findByEmail(memberUser.getEmail())).thenReturn(Optional.of(memberUser));
        when(teamMemberRepository.findByUserId(memberUser.getId())).thenReturn(Optional.of(member(currentTeam, memberUser, "MEMBER")));
        when(projectRepository.findByTeamId(currentTeam.getId())).thenReturn(Optional.empty());

        var response = controller.getMyProject(new UsernamePasswordAuthenticationToken(memberUser.getEmail(), null));

        assertThat(response.getStatusCode().is4xxClientError()).isTrue();
        assertThat(response.getStatusCode().value()).isEqualTo(404);
    }

    private static User user(UUID id, String email) {
        return user(id, email, UserRole.ROLE_STUDENT);
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

    private static Team team(UUID id, User leader) {
        Team team = new Team();
        ReflectionTestUtils.setField(team, "id", id);
        team.setName("Team");
        team.setLeader(leader);
        team.setMaxSize(5);
        return team;
    }

    private static TeamMember member(Team team, User user, String role) {
        return TeamMember.builder().team(team).user(user).memberRole(role).membershipStatus("ACTIVE").build();
    }

    private static Project project(UUID id, Team team, User student) {
        Project project = new Project();
        project.setId(id);
        project.setTitle("Old Project");
        project.setDescription("Old Description");
        project.setTeam(team);
        project.setStudent(student);
        project.setStatus(ProjectStatus.ARCHIVED);
        return project;
    }
}
