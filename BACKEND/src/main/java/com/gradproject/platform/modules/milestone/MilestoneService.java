package com.gradproject.platform.modules.milestone;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.milestone.dto.MilestoneResponseDTO;
import com.gradproject.platform.modules.milestone.dto.MilestoneSubmissionRequestDTO;
import com.gradproject.platform.modules.milestone.dto.MilestoneUpsertRequestDTO;
import com.gradproject.platform.modules.notification.NotificationService;
import com.gradproject.platform.modules.notification.NotificationType;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectCollaborationAccessService;
import com.gradproject.platform.modules.project.storage.FileStorageService;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRole;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final ProjectCollaborationAccessService accessService;
    private final NotificationService notificationService;
    private final FileStorageService fileStorageService;

    public MilestoneService(MilestoneRepository milestoneRepository,
                            ProjectCollaborationAccessService accessService,
                            NotificationService notificationService,
                            FileStorageService fileStorageService) {
        this.milestoneRepository = milestoneRepository;
        this.accessService = accessService;
        this.notificationService = notificationService;
        this.fileStorageService = fileStorageService;
    }

    @Transactional(readOnly = true)
    public List<MilestoneResponseDTO> getProjectMilestones(UUID projectId) {
        Project project = accessService.requireProjectViewAccess(projectId);
        return milestoneRepository.findByProjectIdOrderByDueDateAscCreatedAtDesc(project.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    public MilestoneResponseDTO createMilestone(UUID projectId, MilestoneUpsertRequestDTO request) {
        Project project = accessService.requireProjectManageAccess(projectId);
        User currentUser = accessService.requireCurrentUser();

        Milestone milestone = new Milestone();
        milestone.setProject(project);
        applyCreatePayload(milestone, request);
        milestone.setCreatedByUser(currentUser);

        Milestone savedMilestone = milestoneRepository.save(milestone);
        notifyTeam(savedMilestone, currentUser, true);
        return toResponse(savedMilestone);
    }

    public MilestoneResponseDTO updateMilestone(UUID milestoneId, MilestoneUpsertRequestDTO request) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new BadRequestException("Milestone not found."));
        accessService.requireProjectManageAccess(milestone.getProject().getId());
        User currentUser = accessService.requireCurrentUser();

        applyUpdatePayload(milestone, request);
        Milestone savedMilestone = milestoneRepository.save(milestone);
        notifyTeam(savedMilestone, currentUser, false);
        return toResponse(savedMilestone);
    }

    public MilestoneResponseDTO submitMilestone(UUID milestoneId, MilestoneSubmissionRequestDTO request, MultipartFile file) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new BadRequestException("Milestone not found."));
        User currentUser = accessService.requireCurrentUser();
        if (currentUser.getRole() != UserRole.ROLE_STUDENT || !accessService.isProjectStudent(milestone.getProject(), currentUser)) {
            throw new AccessDeniedException("Only project students can submit milestone work.");
        }

        String storedPath = fileStorageService.storeMilestoneSubmission(milestone, currentUser, file);
        milestone.setSubmissionFilePath(storedPath);
        milestone.setSubmissionFileName(file.getOriginalFilename());
        milestone.setSubmissionNotes(request != null && StringUtils.hasText(request.notes()) ? request.notes().trim() : null);
        milestone.setSubmittedAt(Instant.now());
        milestone.setStatus(MilestoneStatus.SUBMITTED);
        if (milestone.getCompletedDate() != null && milestone.getStatus() != MilestoneStatus.COMPLETED) {
            milestone.setCompletedDate(null);
        }

        Milestone savedMilestone = milestoneRepository.save(milestone);
        User supervisor = milestone.getProject().getSupervisor();
        if (supervisor != null) {
            notificationService.createNotification(
                    supervisor,
                    "Milestone submitted",
                    currentUser.getName() + " submitted work for milestone \"" + milestone.getTitle() + "\".",
                    NotificationType.MILESTONE_UPDATED,
                    buildProjectLink(milestone.getProject().getId())
            );
        }
        return toResponse(savedMilestone);
    }

    public void deleteMilestone(UUID milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new BadRequestException("Milestone not found."));
        accessService.requireProjectManageAccess(milestone.getProject().getId());
        milestoneRepository.delete(milestone);
    }

    @Transactional(readOnly = true)
    public FileStorageService.StoredFilePayload loadMilestoneSubmission(UUID milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new BadRequestException("Milestone not found."));
        accessService.requireProjectViewAccess(milestone.getProject().getId());
        return fileStorageService.loadMilestoneSubmission(milestone);
    }

    public MilestoneResponseDTO toResponse(Milestone milestone) {
        return new MilestoneResponseDTO(
                milestone.getId(),
                milestone.getProject() != null ? milestone.getProject().getId() : null,
                milestone.getProject() != null ? milestone.getProject().getTitle() : null,
                milestone.getTitle(),
                milestone.getDescription(),
                milestone.getDueDate(),
                milestone.getKeyRequirements(),
                milestone.getStatus(),
                milestone.getCompletedDate(),
                milestone.getReviewFeedback(),
                fileStorageService.hasMilestoneSubmission(milestone) ? fileStorageService.buildMilestoneSubmissionPath(milestone.getId()) : null,
                milestone.getSubmissionFileName(),
                milestone.getSubmissionNotes(),
                milestone.getSubmittedAt(),
                milestone.getCreatedByUser() != null ? milestone.getCreatedByUser().getId() : null,
                milestone.getCreatedByUser() != null ? milestone.getCreatedByUser().getName() : null,
                milestone.getCreatedAt(),
                milestone.getUpdatedAt()
        );
    }

    private void applyCreatePayload(Milestone milestone, MilestoneUpsertRequestDTO request) {
        String title = request.title() == null ? "" : request.title().trim();
        if (!StringUtils.hasText(title)) {
            throw new BadRequestException("Milestone title is required.");
        }
        milestone.setTitle(title);
        milestone.setDescription(StringUtils.hasText(request.description()) ? request.description().trim() : null);
        milestone.setDueDate(request.deadlineDate());
        milestone.setKeyRequirements(StringUtils.hasText(request.keyRequirements()) ? request.keyRequirements().trim() : null);
        milestone.setStatus(MilestoneStatus.NOT_STARTED);
        milestone.setCompletedDate(null);
        milestone.setReviewFeedback(null);
    }

    private void applyUpdatePayload(Milestone milestone, MilestoneUpsertRequestDTO request) {
        if (request.title() != null) {
            String title = request.title().trim();
            if (!StringUtils.hasText(title)) {
                throw new BadRequestException("Milestone title is required.");
            }
            milestone.setTitle(title);
        }
        if (request.description() != null) {
            milestone.setDescription(StringUtils.hasText(request.description()) ? request.description().trim() : null);
        }
        if (request.deadlineDate() != null) {
            milestone.setDueDate(request.deadlineDate());
        }
        if (request.keyRequirements() != null) {
            milestone.setKeyRequirements(StringUtils.hasText(request.keyRequirements()) ? request.keyRequirements().trim() : null);
        }
        if (request.reviewFeedback() != null) {
            milestone.setReviewFeedback(StringUtils.hasText(request.reviewFeedback()) ? request.reviewFeedback().trim() : null);
        }
        if (request.status() != null) {
            milestone.setStatus(request.status());
            if (request.status() == MilestoneStatus.COMPLETED) {
                milestone.setCompletedDate(request.completedDate() != null ? request.completedDate() : Instant.now());
            } else if (request.status() != MilestoneStatus.APPROVED) {
                milestone.setCompletedDate(null);
            }
        } else if (request.completedDate() != null) {
            milestone.setCompletedDate(request.completedDate());
        }
    }

    private void notifyTeam(Milestone milestone, User actor, boolean created) {
        notificationService.createNotifications(
                accessService.getProjectStudents(milestone.getProject()),
                created ? "New milestone created" : "Milestone updated",
                actor.getName() + (created ? " created milestone \"" : " updated milestone \"")
                        + milestone.getTitle() + "\" for project \"" + milestone.getProject().getTitle() + "\".",
                created ? NotificationType.MILESTONE_CREATED : NotificationType.MILESTONE_UPDATED,
                buildProjectLink(milestone.getProject().getId())
        );
    }

    private String buildProjectLink(UUID projectId) {
        return "/project?projectId=" + projectId;
    }
}
