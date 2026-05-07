package com.gradproject.platform.modules.supervisorrequest;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.supervisorrequest.dto.SupervisorRequestMessageDTO;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SupervisorRequestServiceTest {

    @Mock SupervisorRequestRepository requestRepository;
    @Mock ProjectRepository projectRepository;
    @Mock UserRepository userRepository;
    @Mock TeamMemberRepository teamMemberRepository;

    SupervisorRequestService service;
    User leader;
    User member;
    User supervisor;
    User otherSupervisor;
    Team team;
    Project project;

    @BeforeEach
    void setUp() {
        service = new SupervisorRequestService(requestRepository, projectRepository, userRepository, teamMemberRepository);
        leader = user(UUID.randomUUID(), "leader@example.com", UserRole.ROLE_STUDENT);
        member = user(UUID.randomUUID(), "member@example.com", UserRole.ROLE_STUDENT);
        supervisor = user(UUID.randomUUID(), "supervisor@example.com", UserRole.ROLE_SUPERVISOR);
        otherSupervisor = user(UUID.randomUUID(), "other@example.com", UserRole.ROLE_SUPERVISOR);
        team = team(UUID.randomUUID(), leader);
        project = project(UUID.randomUUID(), team, leader);
        authenticate(leader);
    }

    @Test
    void teamLeaderCanRequestSupervisor() {
        leaderRequestSetup();
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(requestRepository.save(any(SupervisorRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var dto = service.requestSupervisor(project.getId(), supervisor.getId(), new SupervisorRequestMessageDTO("Please supervise us", null));

        assertThat(dto.status()).isEqualTo(SupervisorRequestStatus.PENDING);
        assertThat(dto.supervisorId()).isEqualTo(supervisor.getId());
    }

    @Test
    void cannotRequestSupervisorWithoutValidSupervisorId() {
        assertThatThrownBy(() -> service.requestSupervisor(project.getId(), null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Please select a supervisor.");
    }

    @Test
    void normalMemberCannotRequestSupervisor() {
        authenticate(member);
        when(userRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(teamMemberRepository.findByUserId(member.getId())).thenReturn(Optional.of(membership(team, member, "MEMBER")));

        assertThatThrownBy(() -> service.requestSupervisor(project.getId(), supervisor.getId(), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Only team leader can request a supervisor.");
    }

    @Test
    void studentWithoutTeamCannotRequestSupervisor() {
        when(userRepository.findById(leader.getId())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.requestSupervisor(project.getId(), supervisor.getId(), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Only team leader can request a supervisor.");
    }

    @Test
    void cannotRequestNonSupervisorUser() {
        leaderRequestSetup();
        when(userRepository.findById(member.getId())).thenReturn(Optional.of(member));

        assertThatThrownBy(() -> service.requestSupervisor(project.getId(), member.getId(), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Selected user is not a supervisor.");
    }

    @Test
    void cannotRequestIfProjectAlreadyHasSupervisor() {
        project.setSupervisor(supervisor);
        leaderRequestSetup();

        assertThatThrownBy(() -> service.requestSupervisor(project.getId(), supervisor.getId(), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Project already has an assigned supervisor.");
    }

    @Test
    void pendingRequestBlocksAnotherRequest() {
        leaderRequestSetup();
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(requestRepository.existsByProjectIdAndStatus(project.getId(), SupervisorRequestStatus.PENDING)).thenReturn(true);

        assertThatThrownBy(() -> service.requestSupervisor(project.getId(), supervisor.getId(), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("This project already has a pending supervisor request.");
    }

    @Test
    void duplicatePendingSameSupervisorHasSpecificMessage() {
        leaderRequestSetup();
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(requestRepository.existsByProjectIdAndSupervisorIdAndStatus(project.getId(), supervisor.getId(), SupervisorRequestStatus.PENDING)).thenReturn(true);

        assertThatThrownBy(() -> service.requestSupervisor(project.getId(), supervisor.getId(), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("You already requested this supervisor.");
    }

    @Test
    void oldRejectedRequestDoesNotBlockNewRequest() {
        leaderRequestSetup();
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(requestRepository.save(any(SupervisorRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var dto = service.requestSupervisor(project.getId(), supervisor.getId(), null);

        assertThat(dto.status()).isEqualTo(SupervisorRequestStatus.PENDING);
    }

    @Test
    void requestedSupervisorCanAccept() {
        authenticate(supervisor);
        SupervisorRequest request = request(SupervisorRequestStatus.PENDING, project, team, leader, supervisor);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(requestRepository.findById(request.getId())).thenReturn(Optional.of(request));
        when(requestRepository.findByProjectIdAndStatus(project.getId(), SupervisorRequestStatus.PENDING)).thenReturn(List.of(request));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(requestRepository.save(any(SupervisorRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var dto = service.acceptRequest(request.getId());

        assertThat(dto.status()).isEqualTo(SupervisorRequestStatus.ACCEPTED);
        assertThat(project.getSupervisor()).isEqualTo(supervisor);
        assertThat(project.getStatus()).isEqualTo(ProjectStatus.UNDER_REVIEW);
    }

    @Test
    void nonRequestedSupervisorCannotAccept() {
        authenticate(otherSupervisor);
        SupervisorRequest request = request(SupervisorRequestStatus.PENDING, project, team, leader, supervisor);
        when(userRepository.findById(otherSupervisor.getId())).thenReturn(Optional.of(otherSupervisor));
        when(requestRepository.findById(request.getId())).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> service.acceptRequest(request.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("This request is not assigned to you.");
    }

    @Test
    void requestedSupervisorCanReject() {
        authenticate(supervisor);
        SupervisorRequest request = request(SupervisorRequestStatus.PENDING, project, team, leader, supervisor);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(requestRepository.findById(request.getId())).thenReturn(Optional.of(request));
        when(requestRepository.save(any(SupervisorRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var dto = service.rejectRequest(request.getId(), new SupervisorRequestMessageDTO(null, "No capacity"));

        assertThat(dto.status()).isEqualTo(SupervisorRequestStatus.REJECTED);
        assertThat(dto.responseMessage()).isEqualTo("No capacity");
    }

    @Test
    void cannotAcceptNonPendingRequest() {
        authenticate(supervisor);
        SupervisorRequest request = request(SupervisorRequestStatus.REJECTED, project, team, leader, supervisor);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(requestRepository.findById(request.getId())).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> service.acceptRequest(request.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Only pending requests can be accepted.");
    }

    private void leaderRequestSetup() {
        when(userRepository.findById(leader.getId())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(membership(team, leader, "LEADER")));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
    }

    private static void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
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

    private static Project project(UUID id, Team team, User student) {
        Project project = new Project();
        project.setId(id);
        project.setTitle("Project");
        project.setDescription("Project description");
        project.setTeam(team);
        project.setStudent(student);
        project.setStatus(ProjectStatus.SUBMITTED);
        return project;
    }

    private static TeamMember membership(Team team, User user, String role) {
        return TeamMember.builder().team(team).user(user).memberRole(role).membershipStatus("ACTIVE").build();
    }

    private static SupervisorRequest request(SupervisorRequestStatus status, Project project, Team team, User requestedBy, User supervisor) {
        SupervisorRequest request = new SupervisorRequest();
        ReflectionTestUtils.setField(request, "id", UUID.randomUUID());
        request.setProject(project);
        request.setTeam(team);
        request.setRequestedBy(requestedBy);
        request.setSupervisor(supervisor);
        request.setStatus(status);
        return request;
    }
}
