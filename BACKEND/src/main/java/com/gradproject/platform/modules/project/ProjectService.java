package com.gradproject.platform.modules.project;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.notification.NotificationService;
import com.gradproject.platform.modules.notification.NotificationType;
import com.gradproject.platform.modules.project.comment.ProjectComment;
import com.gradproject.platform.modules.project.dto.FeedbackRequestDTO;
import com.gradproject.platform.modules.project.dto.ProposalSubmissionDTO;
import com.gradproject.platform.modules.project.dto.ProjectTeamMemberDTO;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final SupervisorRequestRepository supervisorRequestRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final FileStorageService fileStorageService;
    private final ProposalSubmissionRepository proposalSubmissionRepository;
    private final NotificationService notificationService;

    public ProjectService(ProjectRepository projectRepository, UserRepository userRepository, SupervisorRequestRepository supervisorRequestRepository, TeamMemberRepository teamMemberRepository, FileStorageService fileStorageService, ProposalSubmissionRepository proposalSubmissionRepository, NotificationService notificationService) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.supervisorRequestRepository = supervisorRequestRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.fileStorageService = fileStorageService;
        this.proposalSubmissionRepository = proposalSubmissionRepository;
        this.notificationService = notificationService;
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

        boolean hasExplicitComment = StringUtils.hasText(request.getComment());
        ProjectComment comment = ProjectCommentMapper.toEntity(request);
        comment.setContent(commentText.trim());
        comment.setAuthor(author);
        comment.setProject(project);

        project.setStatus(request.getNewStatus());
        project.getComments().add(comment);

        Project savedProject = projectRepository.save(project);
        notifyProjectStatusUpdate(savedProject, author, hasExplicitComment ? comment.getContent() : null);
        return savedProject;
    }

    public ProjectResponseDTO assignSupervisor(java.util.UUID projectId, java.util.UUID supervisorId) {
        User currentUser = resolveCurrentAuthor();
        if (currentUser.getRole() != UserRole.ROLE_DEAN_OFFICE && currentUser.getRole() != UserRole.ROLE_ADMIN) {
            throw new BadRequestException("Only dean office or admin can assign supervisors.");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BadRequestException("Project not found."));
        ProjectStatus previousStatus = project.getStatus();

        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new BadRequestException("Supervisor not found."));

        if (supervisor.getRole() != UserRole.ROLE_SUPERVISOR) {
            throw new BadRequestException("Selected user is not a supervisor.");
        }

        if (project.getStatus() == ProjectStatus.ARCHIVED) {
            throw new BadRequestException("Cannot assign supervisor to archived project.");
        }

        project.setSupervisor(supervisor);
        if (project.getTeam() != null) {
            project.getTeam().setSupervisor(supervisor);
        }
        if (project.getStatus() == ProjectStatus.SUBMITTED || project.getStatus() == ProjectStatus.PENDING) {
            project.setStatus(ProjectStatus.UNDER_REVIEW);
        }

        supervisorRequestRepository.findByProjectIdAndStatus(project.getId(), SupervisorRequestStatus.PENDING)
                .forEach(request -> {
                    request.setStatus(SupervisorRequestStatus.CANCELED);
                    request.setRespondedAt(java.time.Instant.now());
                });

        Project savedProject = projectRepository.save(project);
        List<User> assignedRecipients = new ArrayList<>();
        if (savedProject.getTeam() != null && savedProject.getTeam().getLeader() != null) {
            assignedRecipients.add(savedProject.getTeam().getLeader());
        }
        assignedRecipients.add(supervisor);
        notificationService.createNotifications(
                assignedRecipients,
                "Supervisor assigned",
                supervisor.getName() + " was assigned to project \"" + savedProject.getTitle() + "\".",
                NotificationType.SUPERVISOR_ASSIGNED,
                buildProjectLink(savedProject.getId())
        );
        if (previousStatus != savedProject.getStatus()) {
            notifyProjectStatusUpdate(savedProject, currentUser, null);
        }
        return toResponse(savedProject);
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
        if (!StringUtils.hasText(project.getProjectDomain()) && StringUtils.hasText(membership.getTeam().getProjectDomain())) {
            project.setProjectDomain(membership.getTeam().getProjectDomain().trim());
        }
        project.setStatus(ProjectStatus.SUBMITTED);
        project.setProposalVersion(project.getProposalVersion() + 1);

        project = projectRepository.save(project);
        ProposalSubmission submission = createProposalSubmission(project, cleanDescription, null, studentChangeNote, currentUser);
        if (proposalFile != null && !proposalFile.isEmpty()) {
            attachProposalFile(project, submission, currentUser, proposalFile);
        } else {
            cloneProposalFile(project, submission, currentUser);
        }

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
        ProposalSubmission savedSubmission = proposalSubmissionRepository.save(submission);
        return savedSubmission != null ? savedSubmission : submission;
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

    public FileStorageService.StoredFilePayload loadProposalSubmissionFile(java.util.UUID projectId, java.util.UUID submissionId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BadRequestException("Project not found."));
        validateProjectAccess(project);

        ProposalSubmission submission = proposalSubmissionRepository.findByIdAndProjectId(submissionId, projectId)
                .orElseThrow(() -> new BadRequestException("Proposal submission not found."));
        FileStorageService.StoredFilePayload payload = fileStorageService.loadProposalSubmission(submission);
        if (payload != null) {
            return payload;
        }

        String documentPath = submission.getDocumentPath();
        if (!StringUtils.hasText(documentPath)) {
            throw new BadRequestException("Proposal file not found.");
        }

        String storedFileName = documentPath.substring(documentPath.lastIndexOf('/') + 1);
        try {
            return new FileStorageService.StoredFilePayload(fileStorageService.loadAsResource(storedFileName), storedFileName, "application/pdf");
        } catch (RuntimeException exception) {
            throw new BadRequestException("Proposal file not found.");
        }
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
        SupervisorRequest savedRequest = supervisorRequestRepository.save(supervisorRequest);
        notificationService.createNotification(
                supervisor,
                "Supervisor request received",
                requestedBy.getName() + " requested you to supervise project \"" + project.getTitle() + "\".",
                NotificationType.SUPERVISOR_REQUEST,
                buildProjectLink(project.getId())
        );
        return savedRequest;
    }

    public FileStorageService.StoredFilePayload loadProposalFile(java.util.UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BadRequestException("Project not found."));
        validateProjectAccess(project);
        FileStorageService.StoredFilePayload payload = fileStorageService.loadProjectProposal(project);
        if (payload != null) {
            return payload;
        }

        String documentPath = project.getDocumentPath();
        if (!StringUtils.hasText(documentPath)) {
            throw new BadRequestException("Proposal file not found.");
        }

        String storedFileName = documentPath.substring(documentPath.lastIndexOf('/') + 1);
        try {
            return new FileStorageService.StoredFilePayload(fileStorageService.loadAsResource(storedFileName), storedFileName, "application/pdf");
        } catch (RuntimeException exception) {
            throw new BadRequestException("Proposal file not found.");
        }
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
                resolveProjectDomain(project),
                project.getDocumentPath(),
                project.getProposalVersion(),
                project.getStatus(),
                student != null ? student.getId() : null,
                student != null ? student.getName() : null,
                student != null ? student.getEmail() : null,
                team != null ? team.getId() : null,
                team != null ? team.getName() : null,
                team != null ? buildProjectTeamMembers(team) : List.of(),
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

    private String resolveProjectDomain(Project project) {
        if (project == null) {
            return null;
        }
        if (StringUtils.hasText(project.getProjectDomain())) {
            return project.getProjectDomain().trim();
        }
        if (project.getTeam() != null && StringUtils.hasText(project.getTeam().getProjectDomain())) {
            return project.getTeam().getProjectDomain().trim();
        }
        return null;
    }

    private List<ProjectTeamMemberDTO> buildProjectTeamMembers(com.gradproject.platform.modules.team.Team team) {
        Map<java.util.UUID, ProjectTeamMemberDTO> members = new LinkedHashMap<>();

        if (team.getLeader() != null && team.getLeader().getRole() == UserRole.ROLE_STUDENT) {
            User leader = team.getLeader();
            members.put(leader.getId(), new ProjectTeamMemberDTO(
                    leader.getId(),
                    leader.getName(),
                    leader.getEmail(),
                    leader.getUniversityId(),
                    leader.getDepartment() != null ? leader.getDepartment().name() : null,
                    fileStorageService.resolveProfilePhotoUrl(leader),
                    "LEADER"
            ));
        }

        teamMemberRepository.findAllByTeamId(team.getId()).forEach(member -> {
            User user = member.getUser();
            if (user == null || user.getRole() != UserRole.ROLE_STUDENT) {
                return;
            }
            members.putIfAbsent(user.getId(), new ProjectTeamMemberDTO(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getUniversityId(),
                    user.getDepartment() != null ? user.getDepartment().name() : null,
                    fileStorageService.resolveProfilePhotoUrl(user),
                    member.getMemberRole()
            ));
        });

        return new ArrayList<>(members.values());
    }

    public void attachProposalFile(Project project, ProposalSubmission submission, User owner, MultipartFile proposalFile) {
        String projectDocumentPath = fileStorageService.storeProposal(project, submission, owner, proposalFile);
        if (!StringUtils.hasText(projectDocumentPath)) {
            projectDocumentPath = fileStorageService.storeProposal(proposalFile);
        }
        project.setDocumentPath(projectDocumentPath);
        String submissionDocumentPath = StringUtils.hasText(projectDocumentPath) && !projectDocumentPath.startsWith("/api/projects/")
                ? projectDocumentPath
                : fileStorageService.buildProposalSubmissionPath(project.getId(), submission.getId());
        submission.setDocumentPath(submissionDocumentPath);
        proposalSubmissionRepository.save(submission);
        projectRepository.save(project);
    }

    public void cloneProposalFile(Project project, ProposalSubmission submission, User owner) {
        String projectDocumentPath = fileStorageService.cloneCurrentProposal(project, submission, owner);
        if (!StringUtils.hasText(projectDocumentPath)) {
            projectDocumentPath = project.getDocumentPath();
        }
        project.setDocumentPath(projectDocumentPath);
        String submissionDocumentPath = StringUtils.hasText(projectDocumentPath) && !projectDocumentPath.startsWith("/api/projects/")
                ? projectDocumentPath
                : fileStorageService.buildProposalSubmissionPath(project.getId(), submission.getId());
        submission.setDocumentPath(submissionDocumentPath);
        proposalSubmissionRepository.save(submission);
        projectRepository.save(project);
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

    private void notifyProjectStatusUpdate(Project project, User author, String commentText) {
        List<User> teamMembers = getProjectStudents(project);
        List<User> statusRecipients = new ArrayList<>(teamMembers);
        if (project.getSupervisor() != null) {
            statusRecipients.add(project.getSupervisor());
        }

        notificationService.createNotifications(
                statusRecipients,
                "Project status updated",
                "Project \"" + project.getTitle() + "\" status changed to " + project.getStatus().name() + ".",
                NotificationType.PROJECT_STATUS_CHANGED,
                buildProjectLink(project.getId())
        );

        if (StringUtils.hasText(commentText)) {
            notificationService.createNotifications(
                    teamMembers,
                    "New project feedback",
                    author.getName() + " added feedback to project \"" + project.getTitle() + "\".",
                    NotificationType.PROJECT_FEEDBACK_ADDED,
                    buildProjectLink(project.getId())
            );
        }

        NotificationType statusSpecificType = switch (project.getStatus()) {
            case NEEDS_CHANGES, REVISION_REQUIRED -> NotificationType.PROPOSAL_NEEDS_CHANGES;
            case APPROVED, FINAL_APPROVAL_DEAN -> NotificationType.PROPOSAL_APPROVED;
            case REJECTED -> NotificationType.PROPOSAL_REJECTED;
            default -> null;
        };

        if (statusSpecificType != null) {
            notificationService.createNotifications(
                    teamMembers,
                    "Proposal update",
                    buildStatusSpecificMessage(project),
                    statusSpecificType,
                    buildProjectLink(project.getId())
            );
        }
    }

    private String buildStatusSpecificMessage(Project project) {
        return switch (project.getStatus()) {
            case NEEDS_CHANGES, REVISION_REQUIRED -> "Project \"" + project.getTitle() + "\" needs changes before approval.";
            case APPROVED, FINAL_APPROVAL_DEAN -> "Project \"" + project.getTitle() + "\" was approved.";
            case REJECTED -> "Project \"" + project.getTitle() + "\" was rejected.";
            default -> "Project \"" + project.getTitle() + "\" status changed.";
        };
    }

    private List<User> getProjectStudents(Project project) {
        Map<java.util.UUID, User> users = new LinkedHashMap<>();
        if (project.getTeam() == null) {
            return List.of();
        }
        if (project.getTeam().getLeader() != null && project.getTeam().getLeader().getRole() == UserRole.ROLE_STUDENT) {
            User leader = project.getTeam().getLeader();
            users.put(leader.getId(), leader);
        }
        teamMemberRepository.findAllByTeamId(project.getTeam().getId()).forEach(member -> {
            User user = member.getUser();
            if (user != null && user.getRole() == UserRole.ROLE_STUDENT) {
                users.putIfAbsent(user.getId(), user);
            }
        });
        return new ArrayList<>(users.values());
    }

    private String buildProjectLink(java.util.UUID projectId) {
        return "/project?projectId=" + projectId;
    }
}
