package com.gradproject.platform.modules.project;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.notification.NotificationService;
import com.gradproject.platform.modules.project.comment.ProjectComment;
import com.gradproject.platform.modules.project.dto.FeedbackRequestDTO;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.project.submission.ProposalSubmission;
import com.gradproject.platform.modules.project.submission.ProposalSubmissionRepository;
import com.gradproject.platform.modules.project.storage.FileStorageService;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequest;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestRepository;
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
import org.springframework.core.io.ByteArrayResource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock ProjectRepository projectRepository;
    @Mock UserRepository userRepository;
    @Mock SupervisorRequestRepository supervisorRequestRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock FileStorageService fileStorageService;
    @Mock ProposalSubmissionRepository proposalSubmissionRepository;
    @Mock NotificationService notificationService;

    ProjectService service;
    User dean;
    User student;
    User supervisor;
    User otherSupervisor;
    Project project;

    @BeforeEach
    void setUp() {
        service = new ProjectService(projectRepository, userRepository, supervisorRequestRepository, teamMemberRepository, fileStorageService, proposalSubmissionRepository, notificationService);
        dean = user(UUID.randomUUID(), "dean@example.com", UserRole.ROLE_DEAN_OFFICE);
        student = user(UUID.randomUUID(), "student@example.com", UserRole.ROLE_STUDENT);
        supervisor = user(UUID.randomUUID(), "supervisor@example.com", UserRole.ROLE_SUPERVISOR);
        otherSupervisor = user(UUID.randomUUID(), "other@example.com", UserRole.ROLE_SUPERVISOR);
        project = project(UUID.randomUUID(), student);
    }

    @Test
    void deanCanManuallyAssignSupervisor() {
        authenticate(dean);
        when(userRepository.findById(dean.getId())).thenReturn(Optional.of(dean));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(supervisorRequestRepository.findByProjectIdAndStatus(project.getId(), SupervisorRequestStatus.PENDING)).thenReturn(List.of());
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var dto = service.assignSupervisor(project.getId(), supervisor.getId());

        assertThat(dto.supervisor().id()).isEqualTo(supervisor.getId());
        assertThat(dto.status()).isEqualTo(ProjectStatus.UNDER_REVIEW);
    }

    @Test
    void studentCannotManuallyAssignSupervisor() {
        authenticate(student);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));

        assertThatThrownBy(() -> service.assignSupervisor(project.getId(), supervisor.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Only dean office or admin can assign supervisors.");
    }

    @Test
    void cannotAssignNonSupervisorUser() {
        authenticate(dean);
        when(userRepository.findById(dean.getId())).thenReturn(Optional.of(dean));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));

        assertThatThrownBy(() -> service.assignSupervisor(project.getId(), student.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Selected user is not a supervisor.");
    }

    @Test
    void cannotAssignArchivedProject() {
        authenticate(dean);
        project.setStatus(ProjectStatus.ARCHIVED);
        when(userRepository.findById(dean.getId())).thenReturn(Optional.of(dean));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));

        assertThatThrownBy(() -> service.assignSupervisor(project.getId(), supervisor.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Cannot assign supervisor to archived project.");
    }

    @Test
    void manualAssignmentCancelsPendingRequests() {
        authenticate(dean);
        SupervisorRequest pending = new SupervisorRequest();
        pending.setStatus(SupervisorRequestStatus.PENDING);
        when(userRepository.findById(dean.getId())).thenReturn(Optional.of(dean));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(supervisorRequestRepository.findByProjectIdAndStatus(project.getId(), SupervisorRequestStatus.PENDING)).thenReturn(List.of(pending));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.assignSupervisor(project.getId(), supervisor.getId());

        assertThat(pending.getStatus()).isEqualTo(SupervisorRequestStatus.CANCELED);
    }

    @Test
    void supervisorSeesOnlyAssignedProjects() {
        authenticate(supervisor);
        project.setSupervisor(supervisor);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(projectRepository.findBySupervisorIdOrderByCreatedAtDesc(supervisor.getId())).thenReturn(List.of(project));

        var projects = service.getMyAssignedProjects();

        assertThat(projects).hasSize(1);
        assertThat(projects.get(0).supervisor().id()).isEqualTo(supervisor.getId());
    }

    @Test
    void supervisorCannotAddFeedbackToUnassignedProject() {
        authenticate(otherSupervisor);
        project.setSupervisor(supervisor);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(otherSupervisor.getId())).thenReturn(Optional.of(otherSupervisor));

        assertThatThrownBy(() -> service.updateProjectStatus(project.getId(), new FeedbackRequestDTO("feedback", ProjectStatus.UNDER_REVIEW)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("You are not assigned to this project.");
    }

    @Test
    void assignedSupervisorCanAddFeedback() {
        authenticate(supervisor);
        project.setSupervisor(supervisor);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Project saved = service.updateProjectStatus(project.getId(), new FeedbackRequestDTO("Looks good", ProjectStatus.APPROVED));

        assertThat(saved.getStatus()).isEqualTo(ProjectStatus.APPROVED);
        assertThat(saved.getComments()).extracting(ProjectComment::getContent).contains("Looks good");
    }

    @Test
    void archivedProjectCannotBeModifiedBySupervisor() {
        authenticate(supervisor);
        project.setSupervisor(supervisor);
        project.setStatus(ProjectStatus.ARCHIVED);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));

        assertThatThrownBy(() -> service.updateProjectStatus(project.getId(), new FeedbackRequestDTO("Reopen", ProjectStatus.UNDER_REVIEW)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Archived projects cannot be modified by students or supervisors.");
    }

    @Test
    void deanCanChangeStatusFromArchived() {
        authenticate(dean);
        project.setStatus(ProjectStatus.ARCHIVED);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(dean.getId())).thenReturn(Optional.of(dean));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Project saved = service.updateProjectStatus(project.getId(), new FeedbackRequestDTO("Reopening project", ProjectStatus.UNDER_REVIEW));

        assertThat(saved.getStatus()).isEqualTo(ProjectStatus.UNDER_REVIEW);
        assertThat(saved.getComments()).extracting(ProjectComment::getContent).contains("Reopening project");
    }

    @Test
    void studentSeesAssignedSupervisorInProjectDto() {
        project.setSupervisor(supervisor);

        var dto = service.toResponse(project);

        assertThat(dto.supervisor().id()).isEqualTo(supervisor.getId());
    }

    @Test
    void leaderCanResubmitWhenNeedsChanges() {
        authenticate(student);
        project.setStatus(ProjectStatus.NEEDS_CHANGES);
        project.getComments().add(ProjectComment.builder().content("Please revise").project(project).author(supervisor).statusAtTime(ProjectStatus.NEEDS_CHANGES).build());
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(teamMemberRepository.findByUserId(student.getId())).thenReturn(Optional.of(member(project.getTeam(), student, "LEADER")));
        when(fileStorageService.storeProposal(any())).thenReturn("/files/revised.pdf");
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var dto = service.resubmitProposal(project.getId(), " Revised description ", new MockMultipartFile("proposalFile", "proposal.pdf", "application/pdf", new byte[] { 1 }), null, null, "Updated scope");

        assertThat(dto.status()).isEqualTo(ProjectStatus.SUBMITTED);
        assertThat(dto.title()).isEqualTo("Team");
        assertThat(dto.documentPath()).isEqualTo("/files/revised.pdf");
        assertThat(dto.proposalVersion()).isEqualTo(2);
        assertThat(project.getComments()).hasSize(1);
    }

    @Test
    void leaderCanResubmitWhenRejected() {
        authenticate(student);
        project.setStatus(ProjectStatus.REJECTED);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(teamMemberRepository.findByUserId(student.getId())).thenReturn(Optional.of(member(project.getTeam(), student, "LEADER")));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var dto = service.resubmitProposal(project.getId(), "New description", null, null, null, "Added missing sections");

        assertThat(dto.status()).isEqualTo(ProjectStatus.SUBMITTED);
        assertThat(dto.documentPath()).isNull();
        assertThat(dto.proposalVersion()).isEqualTo(2);
    }

    @Test
    void resubmissionRequiresChangeNote() {
        authenticate(student);
        project.setStatus(ProjectStatus.REJECTED);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));

        assertThatThrownBy(() -> service.resubmitProposal(project.getId(), "Updated description", null, null, null, "  "))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Please explain what changed in this resubmission.");
    }

    @Test
    void resubmissionWithNewFileReplacesFileAndWithoutNewFileKeepsOldFile() {
        authenticate(student);
        project.setStatus(ProjectStatus.REJECTED);
        project.setDocumentPath("/files/old.pdf");
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(teamMemberRepository.findByUserId(student.getId())).thenReturn(Optional.of(member(project.getTeam(), student, "LEADER")));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var dto = service.resubmitProposal(project.getId(), "New description", null, null, null, "Clarified requirements");

        assertThat(dto.documentPath()).isEqualTo("/files/old.pdf");

        project.setStatus(ProjectStatus.REJECTED);
        when(fileStorageService.storeProposal(any())).thenReturn("/files/new.pdf");
        dto = service.resubmitProposal(project.getId(), "New description", new MockMultipartFile("proposalFile", "proposal.pdf", "application/pdf", new byte[] { 1 }), null, null, "Added diagrams");

        assertThat(dto.documentPath()).isEqualTo("/files/new.pdf");
    }

    @Test
    void normalMemberCannotResubmit() {
        authenticate(student);
        project.setStatus(ProjectStatus.NEEDS_CHANGES);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(teamMemberRepository.findByUserId(student.getId())).thenReturn(Optional.of(member(project.getTeam(), student, "MEMBER")));

        assertThatThrownBy(() -> service.resubmitProposal(project.getId(), "Description", null, null, null, "Updated plan"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Only the team leader can resubmit the project proposal.");
    }

    @Test
    void studentFromAnotherTeamCannotResubmit() {
        authenticate(student);
        project.setStatus(ProjectStatus.NEEDS_CHANGES);
        Team otherTeam = new Team();
        ReflectionTestUtils.setField(otherTeam, "id", UUID.randomUUID());
        otherTeam.setName("Other");
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(teamMemberRepository.findByUserId(student.getId())).thenReturn(Optional.of(member(otherTeam, student, "LEADER")));

        assertThatThrownBy(() -> service.resubmitProposal(project.getId(), "Description", null, null, null, "Updated plan"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Project does not belong to your team.");
    }

    @Test
    void cannotResubmitApprovedProject() {
        authenticate(student);
        project.setStatus(ProjectStatus.APPROVED);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(teamMemberRepository.findByUserId(student.getId())).thenReturn(Optional.of(member(project.getTeam(), student, "LEADER")));

        assertThatThrownBy(() -> service.resubmitProposal(project.getId(), "Description", null, null, null, "Updated plan"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Approved or archived projects cannot be resubmitted.");
    }

    @Test
    void resubmissionUsesCurrentTeamNameAsProjectTitle() {
        authenticate(student);
        project.setStatus(ProjectStatus.REJECTED);
        project.getTeam().setName("Smart Campus System");
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(teamMemberRepository.findByUserId(student.getId())).thenReturn(Optional.of(member(project.getTeam(), student, "LEADER")));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var dto = service.resubmitProposal(project.getId(), "Updated description", null, null, null, "Adjusted scope");

        assertThat(project.getTeam().getName()).isEqualTo("Smart Campus System");
        assertThat(dto.title()).isEqualTo("Smart Campus System");
    }

    @Test
    void resubmissionCreatesSupervisorRequestOnlyWhenNeeded() {
        authenticate(student);
        project.setStatus(ProjectStatus.REJECTED);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(teamMemberRepository.findByUserId(student.getId())).thenReturn(Optional.of(member(project.getTeam(), student, "LEADER")));
        when(supervisorRequestRepository.existsByProjectIdAndStatus(project.getId(), SupervisorRequestStatus.PENDING)).thenReturn(false);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(supervisorRequestRepository.existsByProjectIdAndSupervisorIdAndStatus(project.getId(), supervisor.getId(), SupervisorRequestStatus.PENDING)).thenReturn(false);
        when(supervisorRequestRepository.save(any(SupervisorRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.resubmitProposal(project.getId(), "Updated description", null, supervisor.getId(), "Again please", "Expanded scope");

        org.mockito.Mockito.verify(supervisorRequestRepository).save(any(SupervisorRequest.class));
    }

    @Test
    void createProposalSubmissionStoresMetadata() {
        when(proposalSubmissionRepository.existsByProjectIdAndVersionNumber(project.getId(), 2)).thenReturn(false);
        when(proposalSubmissionRepository.save(any(ProposalSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));
        project.setProposalVersion(2);

        ProposalSubmission saved = service.createProposalSubmission(project, "Updated description", "/files/proposal.pdf", "  clarified scope  ", student);

        assertThat(saved.getProject()).isEqualTo(project);
        assertThat(saved.getVersionNumber()).isEqualTo(2);
        assertThat(saved.getDescription()).isEqualTo("Updated description");
        assertThat(saved.getDocumentPath()).isEqualTo("/files/proposal.pdf");
        assertThat(saved.getStudentChangeNote()).isEqualTo("clarified scope");
        assertThat(saved.getSubmittedBy()).isEqualTo(student);
        assertThat(saved.getSubmittedAt()).isNotNull();
    }

    @Test
    void createProposalSubmissionDoesNotDuplicateExistingVersion() {
        project.setProposalVersion(1);
        when(proposalSubmissionRepository.existsByProjectIdAndVersionNumber(project.getId(), 1)).thenReturn(true);

        assertThatThrownBy(() -> service.createProposalSubmission(project, "Initial", "/files/proposal.pdf", "Initial submission", student))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Proposal submission version already exists.");
    }

    @Test
    void getProjectSubmissionsReturnsVersionOneAndTwoAndMarksOnlyNewestLatest() {
        authenticate(dean);
        project.setProposalVersion(1);
        when(userRepository.findById(dean.getId())).thenReturn(Optional.of(dean));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));

        ProposalSubmission latest = new ProposalSubmission();
        ReflectionTestUtils.setField(latest, "id", UUID.randomUUID());
        latest.setProject(project);
        latest.setVersionNumber(2);
        latest.setDescription("Latest");
        latest.setDocumentPath("/files/latest.pdf");
        latest.setStudentChangeNote("Refined scope");
        latest.setSubmittedBy(student);
        latest.setSubmittedAt(Instant.now());

        ProposalSubmission older = new ProposalSubmission();
        ReflectionTestUtils.setField(older, "id", UUID.randomUUID());
        older.setProject(project);
        older.setVersionNumber(1);
        older.setDescription("Initial description");
        older.setDocumentPath("/files/initial.pdf");
        older.setStudentChangeNote(null);
        older.setSubmittedBy(student);
        older.setSubmittedAt(Instant.now());

        when(proposalSubmissionRepository.findByProjectIdOrderByVersionNumberDesc(project.getId())).thenReturn(List.of(latest, older));

        var results = service.getProjectSubmissions(project.getId());

        assertThat(results).hasSize(2);
        assertThat(results).extracting(result -> result.versionNumber()).containsExactly(2, 1);
        assertThat(results.get(0).isLatest()).isTrue();
        assertThat(results.get(0).hasFile()).isTrue();
        assertThat(results.get(1).isLatest()).isFalse();
        assertThat(results.get(1).hasFile()).isTrue();
        assertThat(results.get(1).studentChangeNote()).isNull();
    }

    @Test
    void statusUpdateFeedbackAndSupervisorAssignmentDoNotIncrementProposalVersion() {
        project.setProposalVersion(3);
        authenticate(dean);
        when(userRepository.findById(dean.getId())).thenReturn(Optional.of(dean));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Project saved = service.updateProjectStatus(project.getId(), new FeedbackRequestDTO("Status only", ProjectStatus.APPROVED));

        assertThat(saved.getProposalVersion()).isEqualTo(3);
    }

    @Test
    void cannotResubmitArchivedProject() {
        authenticate(student);
        project.setStatus(ProjectStatus.ARCHIVED);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(teamMemberRepository.findByUserId(student.getId())).thenReturn(Optional.of(member(project.getTeam(), student, "LEADER")));

        assertThatThrownBy(() -> service.resubmitProposal(project.getId(), "Description", null, null, null, "Updated plan"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Archived projects cannot be modified by students or supervisors.");
    }

    @Test
    void deanCanAccessProposalFile() {
        authenticate(dean);
        project.setDocumentPath("/files/proposal.pdf");
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(dean.getId())).thenReturn(Optional.of(dean));
        when(fileStorageService.loadAsResource("proposal.pdf")).thenReturn(new ByteArrayResource(new byte[] { 1 }));

        assertThat(service.loadProposalFile(project.getId())).isNotNull();
    }

    @Test
    void assignedSupervisorCanAccessProposalFile() {
        authenticate(supervisor);
        project.setSupervisor(supervisor);
        project.setDocumentPath("/files/proposal.pdf");
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(fileStorageService.loadAsResource("proposal.pdf")).thenReturn(new ByteArrayResource(new byte[] { 1 }));

        assertThat(service.loadProposalFile(project.getId())).isNotNull();
    }

    @Test
    void unassignedSupervisorCannotAccessProposalFile() {
        authenticate(otherSupervisor);
        project.setSupervisor(supervisor);
        project.setDocumentPath("/files/proposal.pdf");
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(otherSupervisor.getId())).thenReturn(Optional.of(otherSupervisor));

        assertThatThrownBy(() -> service.loadProposalFile(project.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("You are not allowed to access this proposal file.");
    }

    @Test
    void teamMemberCanAccessOwnProposalFile() {
        authenticate(student);
        project.setDocumentPath("/files/proposal.pdf");
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(teamMemberRepository.findByUserId(student.getId())).thenReturn(Optional.of(member(project.getTeam(), student, "MEMBER")));
        when(fileStorageService.loadAsResource("proposal.pdf")).thenReturn(new ByteArrayResource(new byte[] { 1 }));

        assertThat(service.loadProposalFile(project.getId())).isNotNull();
    }

    @Test
    void unrelatedStudentCannotAccessProposalFile() {
        authenticate(student);
        project.setDocumentPath("/files/proposal.pdf");
        Team otherTeam = new Team();
        ReflectionTestUtils.setField(otherTeam, "id", UUID.randomUUID());
        otherTeam.setName("Other");
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(teamMemberRepository.findByUserId(student.getId())).thenReturn(Optional.of(member(otherTeam, student, "MEMBER")));

        assertThatThrownBy(() -> service.loadProposalFile(project.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("You are not allowed to access this proposal file.");
    }

    @Test
    void missingProposalFileReturnsClearError() {
        authenticate(dean);
        project.setDocumentPath(null);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(dean.getId())).thenReturn(Optional.of(dean));

        assertThatThrownBy(() -> service.loadProposalFile(project.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Proposal file not found.");
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

    private static Project project(UUID id, User student) {
        Project project = new Project();
        project.setId(id);
        project.setTitle("Project");
        project.setDescription("Project description");
        project.setStudent(student);
        project.setStatus(ProjectStatus.SUBMITTED);
        Team team = new Team();
        ReflectionTestUtils.setField(team, "id", UUID.randomUUID());
        team.setName("Team");
        team.setLeader(student);
        team.setMaxSize(5);
        project.setTeam(team);
        return project;
    }

    private static TeamMember member(Team team, User user, String role) {
        return TeamMember.builder()
                .team(team)
                .user(user)
                .memberRole(role)
                .membershipStatus("ACTIVE")
                .build();
    }
}
