package com.gradproject.platform.modules.project;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.LocalDateTime;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.meeting.BulkDownloadService;
import com.gradproject.platform.modules.meeting.Meeting;
import com.gradproject.platform.modules.meeting.MeetingRepository;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.project.dto.FeedbackRequestDTO;
import com.gradproject.platform.modules.project.dto.ProposalSubmissionDTO;
import com.gradproject.platform.modules.project.dto.ProjectResponseDTO;
import com.gradproject.platform.modules.project.storage.FileStorageService;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestRepository;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/projects")
//@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5177"})
@Validated
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;
    private final FileStorageService fileStorageService;
    private final BulkDownloadService bulkDownloadService;
    private final TeamMemberRepository teamMemberRepository;
    private final MeetingRepository meetingRepository;
    private final SupervisorRequestRepository supervisorRequestRepository;

    public ProjectController(ProjectRepository projectRepository, UserRepository userRepository, ProjectService projectService, FileStorageService fileStorageService, BulkDownloadService bulkDownloadService, TeamMemberRepository teamMemberRepository, MeetingRepository meetingRepository, SupervisorRequestRepository supervisorRequestRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.projectService = projectService;
        this.fileStorageService = fileStorageService;
        this.bulkDownloadService = bulkDownloadService;
        this.teamMemberRepository = teamMemberRepository;
        this.meetingRepository = meetingRepository;
        this.supervisorRequestRepository = supervisorRequestRepository;
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<ProjectResponseDTO> submitProject(
            @RequestParam(value = "title", required = false) String ignoredTitle,
            @RequestParam("description") @NotBlank(message = "Proposal description is required.") String description,
            @RequestParam("proposalFile") MultipartFile proposalFile,
            @RequestParam(value = "supervisorId", required = false) UUID supervisorId,
            @RequestParam(value = "requestMessage", required = false) String requestMessage,
            Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated student not found"));

        TeamMember membership = teamMemberRepository.findByUserId(student.getId())
                .orElseThrow(() -> new BadRequestException("You must create or join a team before submitting a proposal."));

        if (!"LEADER".equals(membership.getMemberRole())) {
            throw new BadRequestException("Only the team leader can submit the project proposal.");
        }

        Team team = membership.getTeam();
        if (team == null || team.getName() == null || team.getName().trim().isEmpty()) {
            throw new BadRequestException("Team name is required.");
        }
        projectRepository.findByTeamId(team.getId())
                .ifPresent(existing -> {
                    throw new BadRequestException("Your team already has a submitted project.");
                });
        if (proposalFile == null || proposalFile.isEmpty()) {
            throw new BadRequestException("Proposal file is required.");
        }
        if (supervisorId == null) {
            throw new BadRequestException("Please select a supervisor.");
        }

        Project project = new Project();
        project.setTitle(team.getName().trim());
        project.setDescription(description.trim());
        project.setDocumentPath(fileStorageService.storeProposal(proposalFile));
        project.setStudent(student);
        project.setTeam(team);
        project.setStatus(ProjectStatus.SUBMITTED);
        project.setProposalVersion(1);

        Project savedProject = projectRepository.save(project);
        projectService.createSupervisorRequest(savedProject, membership, student, supervisorId, requestMessage);
        meetingRepository.save(Meeting.builder()
                .project(savedProject)
                .meetingDate(LocalDateTime.now())
                .summary("Initial proposal review form")
                .tasks("Review the submitted proposal document and record feedback")
                .progressRating(0)
                .build());

        projectService.createProposalSubmission(savedProject, project.getDescription(), project.getDocumentPath(), "Initial submission", student);

        return ResponseEntity.ok(projectService.toResponse(savedProject));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/my-project")
    public ResponseEntity<ProjectResponseDTO> getMyProject(Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated student not found"));

        TeamMember membership = teamMemberRepository.findByUserId(student.getId()).orElse(null);
        if (membership != null && membership.getTeam() != null) {
            return projectRepository.findByTeamId(membership.getTeam().getId())
                .map(project -> ResponseEntity.ok(projectService.toResponse(project)))
                .orElseGet(() -> ResponseEntity.notFound().build());
        }

        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @GetMapping("/assigned")
    public ResponseEntity<List<ProjectResponseDTO>> getAssignedProjects() {
        return ResponseEntity.ok(projectService.getMyAssignedProjects());
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @GetMapping("/supervisor/my")
    public ResponseEntity<List<ProjectResponseDTO>> getMySupervisorProjects() {
        return ResponseEntity.ok(projectService.getMyAssignedProjects());
    }

    @PreAuthorize("hasAnyRole('SUPERVISOR', 'DEAN_OFFICE', 'ADMIN')")
    @PatchMapping("/{id}/feedback")
    public ResponseEntity<ProjectResponseDTO> addFeedback(@PathVariable UUID id, @Valid @RequestBody FeedbackRequestDTO request) {
        return ResponseEntity.ok(projectService.toResponse(projectService.updateProjectStatus(id, request)));
    }

    @PreAuthorize("hasAnyRole('DEAN_OFFICE', 'ADMIN')")
    @GetMapping("/all")
    public ResponseEntity<List<ProjectResponseDTO>> getAllProjects() {
        return ResponseEntity.ok(projectRepository.findAll().stream().map(projectService::toResponse).toList());
    }

    @PreAuthorize("hasAnyRole('DEAN_OFFICE', 'ADMIN')")
    @GetMapping("/unassigned")
    public ResponseEntity<List<ProjectResponseDTO>> getUnassignedProjects() {
        return ResponseEntity.ok(projectService.getUnassignedProjects());
    }

    @PreAuthorize("hasAnyRole('DEAN_OFFICE', 'ADMIN')")
    @PatchMapping("/{projectId}/assign-supervisor/{supervisorId}")
    public ResponseEntity<ProjectResponseDTO> assignSupervisor(@PathVariable UUID projectId, @PathVariable UUID supervisorId) {
        return ResponseEntity.ok(projectService.assignSupervisor(projectId, supervisorId));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PatchMapping(value = "/{projectId}/resubmit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProjectResponseDTO> resubmitProject(
            @PathVariable UUID projectId,
            @RequestParam(value = "title", required = false) String ignoredTitle,
            @RequestParam("description") String description,
            @RequestParam(value = "proposalFile", required = false) MultipartFile proposalFile,
            @RequestParam(value = "supervisorId", required = false) UUID supervisorId,
            @RequestParam(value = "requestMessage", required = false) String requestMessage,
            @RequestParam(value = "studentChangeNote", required = false) String studentChangeNote) {
        return ResponseEntity.ok(projectService.resubmitProposal(projectId, description, proposalFile, supervisorId, requestMessage, studentChangeNote));
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'SUPERVISOR', 'DEAN_OFFICE', 'ADMIN')")
    @GetMapping("/{projectId}/submissions")
    public ResponseEntity<java.util.List<ProposalSubmissionDTO>> getProjectSubmissions(@PathVariable UUID projectId) {
        return ResponseEntity.ok(projectService.getProjectSubmissions(projectId));
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'SUPERVISOR', 'DEAN_OFFICE', 'ADMIN')")
    @GetMapping("/{projectId}/submissions/{submissionId}/file")
    public ResponseEntity<Resource> downloadProposalSubmissionFile(@PathVariable UUID projectId, @PathVariable UUID submissionId) {
        Resource resource = projectService.loadProposalSubmissionFile(projectId, submissionId);
        String fileName = projectService.getProposalSubmissionFileName(projectId, submissionId);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'SUPERVISOR', 'DEAN_OFFICE', 'ADMIN')")
    @GetMapping("/{projectId}/proposal-file")
    public ResponseEntity<Resource> downloadProposalFile(@PathVariable UUID projectId) {
        Resource resource = projectService.loadProposalFile(projectId);
        String fileName = projectService.getProposalFileName(projectId);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }

    @PreAuthorize("hasRole('DEAN_OFFICE')")
    @PostMapping("/deadline-setup")
    public ResponseEntity<String> setupDeadline(@RequestBody Map<String, String> payload) {
        return ResponseEntity.ok("Deadline setup received: " + payload);
    }

    @PreAuthorize("hasAnyRole('DEAN_OFFICE', 'ADMIN')")
    @GetMapping("/{projectId}/download-all-meetings")
    public ResponseEntity<byte[]> downloadAllMeetings(@PathVariable UUID projectId, Authentication authentication) {
        byte[] zipBytes = bulkDownloadService.downloadAllMeetingForms(projectId, authentication);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/zip"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Project_" + projectId + "_Meetings.zip\"")
                .body(zipBytes);
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<ProjectResponseDTO> getProjectByStudentId(@PathVariable UUID studentId) {
        return projectRepository.findByStudentId(studentId)
                .map(project -> ResponseEntity.ok(projectService.toResponse(project)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
