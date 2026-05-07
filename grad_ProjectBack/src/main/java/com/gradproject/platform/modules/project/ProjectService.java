package com.gradproject.platform.modules.project;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.project.comment.ProjectComment;
import com.gradproject.platform.modules.project.dto.FeedbackRequestDTO;
import com.gradproject.platform.modules.project.dto.ProposalSubmissionDTO;
import com.gradproject.platform.modules.project.dto.ProjectResponseDTO;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.project.submission.ProposalSubmission;
import com.gradproject.platform.modules.project.submission.ProposalSubmissionRepository;
import com.gradproject.platform.modules.project.storage.FileStorageService;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequest;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestRepository;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestStatus;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import com.gradproject.platform.modules.user.dto.SupervisorSummaryDTO;
import jakarta.transaction.Transactional;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final SupervisorRequestRepository supervisorRequestRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final FileStorageService fileStorageService;
    private final ProposalSubmissionRepository proposalSubmissionRepository;

    public ProjectService(ProjectRepository projectRepository, UserRepository userRepository, SupervisorRequestRepository supervisorRequestRepository, TeamMemberRepository teamMemberRepository, FileStorageService fileStorageService, ProposalSubmissionRepository proposalSubmissionRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.supervisorRequestRepository = supervisorRequestRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.fileStorageService = fileStorageService;
        this.proposalSubmissionRepository = proposalSubmissionRepository;
    }

    @PreAuthorize("hasAnyRole('SUPERVISOR', 'DEAN_OFFICE', 'ADMIN')")
    public Project updateProjectStatus(java.util.UUID projectId, FeedbackRequestDTO request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BadRequestException("Project not found."));

        User author = resolveCurrentAuthor();
        if (author.getRole() == UserRole.ROLE_SUPERVISOR
                && (project.getSupervisor() == null || !author.getId().equals(project.getSupervisor().getId()))) {
            throw new BadRequestException("You are not assigned to this project.");
        }

        if (project.getStatus() == ProjectStatus.ARCHIVED
                && author.getRole() != UserRole.ROLE_DEAN_OFFICE
                && author.getRole() != UserRole.ROLE_ADMIN) {
            throw new BadRequestException("Archived projects cannot be modified by students or supervisors.");
        }

        String commentText = request.getComment();
        if (commentText == null || commentText.trim().isEmpty()) {
            commentText = "Status changed to " + request.getNewStatus().name();
        }

        ProjectComment comment = ProjectCommentMapper.toEntity(request);
        comment.setContent(commentText.trim());
        comment.setAuthor(author);
        comment.setProject(project);

        project.setStatus(request.getNewStatus());
        project.getComments().add(comment);

        return projectRepository.save(project);
    }

    public ProjectResponseDTO assignSupervisor(java.util.UUID projectId, java.util.UUID supervisorId) {
        User currentUser = resolveCurrentAuthor();
        if (currentUser.getRole() != UserRole.ROLE_DEAN_OFFICE && currentUser.getRole() != UserRole.ROLE_ADMIN) {
            throw new BadRequestException("Only dean office or admin can assign supervisors.");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BadRequestException("Project not found."));

        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new BadRequestException("Supervisor not found."));

        if (supervisor.getRole() != UserRole.ROLE_SUPERVISOR) {
            throw new BadRequestException("Selected user is not a supervisor.");
        }

        if (project.getStatus() == ProjectStatus.ARCHIVED) {
            throw new BadRequestException("Cannot assign supervisor to archived project.");
        }

        project.setSupervisor(supervisor);
        if (project.getStatus() == ProjectStatus.SUBMITTED || project.getStatus() == ProjectStatus.PENDING) {
            project.setStatus(ProjectStatus.UNDER_REVIEW);
        }

        supervisorRequestRepository.findByProjectIdAndStatus(project.getId(), SupervisorRequestStatus.PENDING)
                .forEach(request -> {
                    request.setStatus(SupervisorRequestStatus.CANCELED);
                    request.setRespondedAt(java.time.Instant.now());
                });

        return toResponse(projectRepository.save(project));
    }

    public java.util.List<ProjectResponseDTO> getMyAssignedProjects() {
        User currentUser = resolveCurrentAuthor();
        if (currentUser.getRole() != UserRole.ROLE_SUPERVISOR) {
            throw new BadRequestException("Only supervisors can view assigned projects.");
        }
        return projectRepository.findBySupervisorIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public java.util.List<ProjectResponseDTO> getUnassignedProjects() {
        User currentUser = resolveCurrentAuthor();
        if (currentUser.getRole() != UserRole.ROLE_DEAN_OFFICE && currentUser.getRole() != UserRole.ROLE_ADMIN) {
            throw new BadRequestException("Only dean office or admin can view unassigned projects.");
        }
        return projectRepository.findBySupervisorIsNullOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ProjectResponseDTO resubmitProposal(java.util.UUID projectId, String title, String description, MultipartFile proposalFile) {
        return resubmitProposal(projectId, description, proposalFile, null, null, null);
    }

    public ProjectResponseDTO resubmitProposal(java.util.UUID projectId, String description, MultipartFile proposalFile, java.util.UUID supervisorId, String requestMessage, String studentChangeNote) {
        User currentUser = resolveCurrentAuthor();
        if (currentUser.getRole() != UserRole.ROLE_STUDENT) {
            throw new BadRequestException("Only the team leader can resubmit the project proposal.");
        }

        String cleanDescription = description == null ? "" : description.trim();
        if (!StringUtils.hasText(cleanDescription)) {
            throw new BadRequestException("Proposal description is required.");
        }
        if (!StringUtils.hasText(studentChangeNote)) {
            throw new BadRequestException("Please explain what changed in this resubmission.");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BadRequestException("Project not found."));

        TeamMember membership = teamMemberRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new BadRequestException("Project does not belong to your team."));

        if (project.getTeam() == null || membership.getTeam() == null || !project.getTeam().getId().equals(membership.getTeam().getId())) {
            throw new BadRequestException("Project does not belong to your team.");
        }
        if (!"LEADER".equalsIgnoreCase(String.valueOf(membership.getMemberRole()))) {
            throw new BadRequestException("Only the team leader can resubmit the project proposal.");
        }
        if (project.getStatus() == ProjectStatus.ARCHIVED) {
            throw new BadRequestException("Archived projects cannot be modified by students or supervisors.");
        }
        if (project.getStatus() == ProjectStatus.APPROVED || project.getStatus() == ProjectStatus.FINAL_APPROVAL_DEAN) {
            throw new BadRequestException("Approved or archived projects cannot be resubmitted.");
        }
        if (project.getStatus() != ProjectStatus.NEEDS_CHANGES && project.getStatus() != ProjectStatus.REJECTED && project.getStatus() != ProjectStatus.REVISION_REQUIRED) {
            throw new BadRequestException("Proposal can only be resubmitted when changes are requested or rejected.");
        }

        String projectName = membership.getTeam().getName() == null ? "" : membership.getTeam().getName().trim();
        if (!StringUtils.hasText(projectName)) {
            throw new BadRequestException("Team name is required.");
        }

        project.setTitle(projectName);
        project.setDescription(cleanDescription);
        if (proposalFile != null && !proposalFile.isEmpty()) {
            project.setDocumentPath(fileStorageService.storeProposal(proposalFile));
        }
        project.setStatus(ProjectStatus.SUBMITTED);
        project.setProposalVersion(project.getProposalVersion() + 1);

        project = projectRepository.save(project);
        createProposalSubmission(project, cleanDescription, project.getDocumentPath(), studentChangeNote, currentUser);

        if (project.getSupervisor() == null && !supervisorRequestRepository.existsByProjectIdAndStatus(project.getId(), SupervisorRequestStatus.PENDING)) {
            if (supervisorId != null) {
                createSupervisorRequest(project, membership, currentUser, supervisorId, requestMessage);
            }
        }

        return toResponse(project);
    }

    public ProposalSubmission createProposalSubmission(Project project, String description, String documentPath, String studentChangeNote, User submittedBy) {
        Integer versionNumber = project.getProposalVersion();
        if (proposalSubmissionRepository.existsByProjectIdAndVersionNumber(project.getId(), versionNumber)) {
            throw new BadRequestException("Proposal submission version already exists.");
        }

        ProposalSubmission submission = new ProposalSubmission();
        submission.setProject(project);
        submission.setVersionNumber(versionNumber);
        submission.setDescription(description);
        submission.setDocumentPath(documentPath);
        submission.setStudentChangeNote(StringUtils.hasText(studentChangeNote) ? studentChangeNote.trim() : null);
        submission.setSubmittedBy(submittedBy);
        submission.setSubmittedAt(Instant.now());
        return proposalSubmissionRepository.save(submission);
    }

    public List<ProposalSubmissionDTO> getProjectSubmissions(java.util.UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BadRequestException("Project not found."));
        validateProjectAccess(project);

        List<ProposalSubmission> submissions = proposalSubmissionRepository.findByProjectIdOrderByVersionNumberDesc(projectId);
        int latestVersion = submissions.stream()
                .map(ProposalSubmission::getVersionNumber)
                .filter(java.util.Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(project.getProposalVersion() == null ? 1 : project.getProposalVersion());

        return submissions.stream()
                .map(submission -> new ProposalSubmissionDTO(
                        submission.getId(),
                        projectId,
                        submission.getVersionNumber(),
                        submission.getDescription(),
                        submission.getStudentChangeNote(),
                        submission.getSubmittedBy() != null ? submission.getSubmittedBy().getName() : null,
                        submission.getSubmittedAt(),
                        StringUtils.hasText(submission.getDocumentPath()),
                        submission.getVersionNumber() != null && submission.getVersionNumber() == latestVersion
                ))
                .toList();
    }

    public Resource loadProposalSubmissionFile(java.util.UUID projectId, java.util.UUID submissionId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BadRequestException("Project not found."));
        validateProjectAccess(project);

        ProposalSubmission submission = proposalSubmissionRepository.findByIdAndProjectId(submissionId, projectId)
                .orElseThrow(() -> new BadRequestException("Proposal submission not found."));

        String documentPath = submission.getDocumentPath();
        if (!StringUtils.hasText(documentPath)) {
            throw new BadRequestException("Proposal file not found.");
        }

        String storedFileName = documentPath.substring(documentPath.lastIndexOf('/') + 1);
        try {
            return fileStorageService.loadAsResource(storedFileName);
        } catch (RuntimeException exception) {
            throw new BadRequestException("Proposal file not found.");
        }
    }

    public String getProposalSubmissionFileName(java.util.UUID projectId, java.util.UUID submissionId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BadRequestException("Project not found."));
        validateProjectAccess(project);

        ProposalSubmission submission = proposalSubmissionRepository.findByIdAndProjectId(submissionId, projectId)
                .orElseThrow(() -> new BadRequestException("Proposal submission not found."));
        String documentPath = submission.getDocumentPath();
        if (!StringUtils.hasText(documentPath)) {
            return "proposal.pdf";
        }
        return documentPath.substring(documentPath.lastIndexOf('/') + 1);
    }

    public SupervisorRequest createSupervisorRequest(Project project, TeamMember membership, User requestedBy, java.util.UUID supervisorId, String message) {
        if (supervisorId == null) {
            throw new BadRequestException("Please select a supervisor.");
        }
        if (project.getSupervisor() != null) {
            throw new BadRequestException("Project already has an assigned supervisor.");
        }
        if (project.getStatus() == ProjectStatus.ARCHIVED) {
            throw new BadRequestException("Cannot request supervisor for archived project.");
        }

        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new BadRequestException("Supervisor not found."));
        if (supervisor.getRole() != UserRole.ROLE_SUPERVISOR) {
            throw new BadRequestException("Selected user is not a supervisor.");
        }
        if (supervisorRequestRepository.existsByProjectIdAndSupervisorIdAndStatus(project.getId(), supervisorId, SupervisorRequestStatus.PENDING)) {
            throw new BadRequestException("You already requested this supervisor.");
        }
        if (supervisorRequestRepository.existsByProjectIdAndStatus(project.getId(), SupervisorRequestStatus.PENDING)) {
            throw new BadRequestException("This project already has a pending supervisor request.");
        }

        SupervisorRequest supervisorRequest = new SupervisorRequest();
        supervisorRequest.setProject(project);
        supervisorRequest.setTeam(membership.getTeam());
        supervisorRequest.setRequestedBy(requestedBy);
        supervisorRequest.setSupervisor(supervisor);
        supervisorRequest.setStatus(SupervisorRequestStatus.PENDING);
        supervisorRequest.setMessage(StringUtils.hasText(message) ? message.trim() : null);
        return supervisorRequestRepository.save(supervisorRequest);
    }

    public Resource loadProposalFile(java.util.UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BadRequestException("Project not found."));
        validateProjectAccess(project);

        String documentPath = project.getDocumentPath();
        if (!StringUtils.hasText(documentPath)) {
            throw new BadRequestException("Proposal file not found.");
        }

        String storedFileName = documentPath.substring(documentPath.lastIndexOf('/') + 1);
        try {
            return fileStorageService.loadAsResource(storedFileName);
        } catch (RuntimeException exception) {
            throw new BadRequestException("Proposal file not found.");
        }
    }

    public String getProposalFileName(java.util.UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BadRequestException("Project not found."));
        String documentPath = project.getDocumentPath();
        if (!StringUtils.hasText(documentPath)) {
            return "proposal.pdf";
        }
        return documentPath.substring(documentPath.lastIndexOf('/') + 1);
    }

    public ProjectResponseDTO toResponse(Project project) {
        User student = project.getStudent();
        com.gradproject.platform.modules.team.Team team = project.getTeam();
        User supervisor = project.getSupervisor();
        SupervisorRequest pendingRequest = team != null
                ? supervisorRequestRepository.findFirstByTeamIdAndStatusOrderByCreatedAtDesc(team.getId(), SupervisorRequestStatus.PENDING).orElse(null)
                : null;
        SupervisorRequest lastRequest = team != null
                ? supervisorRequestRepository.findFirstByTeamIdOrderByCreatedAtDesc(team.getId()).orElse(null)
                : null;
        String latestFeedback = project.getComments() == null ? null : project.getComments().stream()
                .filter(comment -> comment.getContent() != null)
                .max(java.util.Comparator.comparing(ProjectComment::getTimestamp, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                .map(ProjectComment::getContent)
                .orElse(null);

        return new ProjectResponseDTO(
                project.getId(),
                project.getTitle(),
                project.getDescription(),
                project.getDocumentPath(),
                project.getProposalVersion(),
                project.getStatus(),
                student != null ? student.getId() : null,
                student != null ? student.getName() : null,
                student != null ? student.getEmail() : null,
                team != null ? team.getId() : null,
                team != null ? team.getName() : null,
                supervisor != null ? new SupervisorSummaryDTO(
                        supervisor.getId(),
                        supervisor.getName(),
                        supervisor.getEmail(),
                        null,
                        null
                ) : null,
                latestFeedback,
                pendingRequest != null ? pendingRequest.getId() : null,
                pendingRequest != null ? pendingRequest.getStatus() : null,
                pendingRequest != null && pendingRequest.getSupervisor() != null ? pendingRequest.getSupervisor().getName() : null,
                lastRequest != null ? lastRequest.getResponseMessage() : null,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }

    private User resolveCurrentAuthor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("Authenticated user not found");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return userRepository.findById(user.getId())
                    .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        }

        if (principal instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    private void validateProjectAccess(Project project) {
        User currentUser = resolveCurrentAuthor();
        if (currentUser.getRole() == UserRole.ROLE_ADMIN || currentUser.getRole() == UserRole.ROLE_DEAN_OFFICE) {
            return;
        }

        if (currentUser.getRole() == UserRole.ROLE_SUPERVISOR
                && project.getSupervisor() != null
                && currentUser.getId().equals(project.getSupervisor().getId())) {
            return;
        }

        if (currentUser.getRole() == UserRole.ROLE_STUDENT && project.getTeam() != null) {
            boolean teamMember = teamMemberRepository.findByUserId(currentUser.getId())
                    .map(membership -> membership.getTeam() != null && project.getTeam().getId().equals(membership.getTeam().getId()))
                    .orElse(false);
            if (teamMember) {
                return;
            }
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to access this proposal file.");
    }
}

