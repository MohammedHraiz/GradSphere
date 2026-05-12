package com.gradproject.platform.modules.project.storage;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.exception.FileStorageException;
import com.gradproject.platform.modules.milestone.Milestone;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.submission.ProposalSubmission;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;
    private static final long MAX_PROFILE_PHOTO_SIZE_BYTES = 2L * 1024 * 1024;

    private final StoredFileRepository storedFileRepository;
    private final UserRepository userRepository;
    private final Path proposalUploadDirectory;
    private final Path profilePhotoUploadDirectory;
    private final Path milestoneUploadDirectory;

    public FileStorageService(
            StoredFileRepository storedFileRepository,
            UserRepository userRepository,
            @Value("${app.storage.proposals-dir:./uploads/proposals}") String proposalUploadDir,
            @Value("${app.storage.profile-photos-dir:./uploads/profile-photos}") String profilePhotoUploadDir,
            @Value("${app.storage.milestones-dir:./uploads/milestones}") String milestoneUploadDir
    ) {
        this.storedFileRepository = storedFileRepository;
        this.userRepository = userRepository;
        this.proposalUploadDirectory = Paths.get(proposalUploadDir).toAbsolutePath().normalize();
        this.profilePhotoUploadDirectory = Paths.get(profilePhotoUploadDir).toAbsolutePath().normalize();
        this.milestoneUploadDirectory = Paths.get(milestoneUploadDir).toAbsolutePath().normalize();
    }

    public record StoredFilePayload(ByteArrayResource resource, String fileName, String contentType) {
    }

    public String buildProfilePhotoPath(UUID userId) {
        return "/files/profile-photos/" + userId;
    }

    public String buildProjectProposalPath(UUID projectId) {
        return "/api/projects/" + projectId + "/proposal-file";
    }

    public String buildProposalSubmissionPath(UUID projectId, UUID submissionId) {
        return "/api/projects/" + projectId + "/submissions/" + submissionId + "/file";
    }

    public String buildMilestoneSubmissionPath(UUID milestoneId) {
        return "/api/milestones/" + milestoneId + "/submission-file";
    }

    public String storeProposal(MultipartFile file) {
        validateFile(file);
        return "/files/" + sanitizeOriginalFilename(file.getOriginalFilename(), StoredFileKind.PROJECT_PROPOSAL);
    }

    public String storeProposal(Project project, ProposalSubmission proposalSubmission, User owner, MultipartFile file) {
        validateFile(file);
        StoredFile storedFile = createStoredFile(StoredFileKind.PROJECT_PROPOSAL, owner, file);
        storedFile.setProject(project);
        storedFile.setProposalSubmission(proposalSubmission);
        storedFileRepository.save(storedFile);
        return buildProjectProposalPath(project.getId());
    }

    public String cloneCurrentProposal(Project project, ProposalSubmission proposalSubmission, User owner) {
        StoredFile currentFile = getCurrentProjectProposal(project)
                .or(() -> importLegacyProjectProposal(project))
                .orElseThrow(() -> new FileStorageException("Proposal file not found."));

        StoredFile clonedFile = cloneStoredFile(currentFile, owner);
        clonedFile.setProject(project);
        clonedFile.setProposalSubmission(proposalSubmission);
        storedFileRepository.save(clonedFile);
        return buildProjectProposalPath(project.getId());
    }

    public String storeProfilePhoto(MultipartFile file) {
        validateProfilePhoto(file);
        return "/files/profile-photos/" + sanitizeOriginalFilename(file.getOriginalFilename(), StoredFileKind.PROFILE_PHOTO);
    }

    public String storeProfilePhoto(User user, MultipartFile file) {
        validateProfilePhoto(file);
        storedFileRepository.findFirstByProfileUserId(user.getId())
                .ifPresent(storedFileRepository::delete);

        StoredFile storedFile = createStoredFile(StoredFileKind.PROFILE_PHOTO, user, file);
        storedFile.setProfileUser(user);
        storedFileRepository.save(storedFile);
        return buildProfilePhotoPath(user.getId());
    }

    public String storeMilestoneSubmission(Milestone milestone, User owner, MultipartFile file) {
        validateMilestoneSubmission(file);
        storedFileRepository.findFirstByMilestoneId(milestone.getId())
                .ifPresent(storedFileRepository::delete);

        StoredFile storedFile = createStoredFile(StoredFileKind.MILESTONE_SUBMISSION, owner, file);
        storedFile.setProject(milestone.getProject());
        storedFile.setMilestone(milestone);
        storedFileRepository.save(storedFile);
        return buildMilestoneSubmissionPath(milestone.getId());
    }

    public Optional<StoredFilePayload> loadProfilePhoto(UUID userId) {
        return storedFileRepository.findFirstByProfileUserId(userId)
                .or(() -> importLegacyProfilePhoto(userId))
                .map(this::toPayload);
    }

    public StoredFilePayload loadProjectProposal(Project project) {
        return getCurrentProjectProposal(project)
                .or(() -> importLegacyProjectProposal(project))
                .map(this::toPayload)
                .orElseThrow(() -> new BadRequestException("Proposal file not found."));
    }

    public StoredFilePayload loadProposalSubmission(ProposalSubmission proposalSubmission) {
        return storedFileRepository.findFirstByProposalSubmissionId(proposalSubmission.getId())
                .or(() -> importLegacyProposalSubmission(proposalSubmission))
                .map(this::toPayload)
                .orElseThrow(() -> new BadRequestException("Proposal file not found."));
    }

    public StoredFilePayload loadMilestoneSubmission(Milestone milestone) {
        return storedFileRepository.findFirstByMilestoneId(milestone.getId())
                .or(() -> importLegacyMilestoneSubmission(milestone))
                .map(this::toPayload)
                .orElseThrow(() -> new BadRequestException("Milestone submission file not found."));
    }

    public boolean hasProjectProposal(Project project) {
        return storedFileRepository.findFirstByProjectIdAndKindOrderByCreatedAtDesc(project.getId(), StoredFileKind.PROJECT_PROPOSAL).isPresent()
                || StringUtils.hasText(project.getDocumentPath());
    }

    public boolean hasMilestoneSubmission(Milestone milestone) {
        return storedFileRepository.findFirstByMilestoneId(milestone.getId()).isPresent()
                || StringUtils.hasText(milestone.getSubmissionFilePath());
    }

    public String resolveProfilePhotoUrl(User user) {
        if (user == null || user.getId() == null) {
            return null;
        }

        if (storedFileRepository.findFirstByProfileUserId(user.getId()).isPresent() || StringUtils.hasText(user.getProfilePhotoUrl())) {
            return buildProfilePhotoPath(user.getId());
        }
        return null;
    }

    private Optional<StoredFile> getCurrentProjectProposal(Project project) {
        return storedFileRepository.findFirstByProjectIdAndKindOrderByCreatedAtDesc(project.getId(), StoredFileKind.PROJECT_PROPOSAL);
    }

    private void validateProfilePhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("Profile photo is required.");
        }

        if (file.getSize() > MAX_PROFILE_PHOTO_SIZE_BYTES) {
            throw new FileStorageException("Profile photo is too large.");
        }

        String contentType = StringUtils.hasText(file.getContentType()) ? file.getContentType().toLowerCase(Locale.ROOT) : "";
        if (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/webp")) {
            throw new FileStorageException("Profile photo must be JPG, PNG, or WebP.");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("Proposal file is required");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new FileStorageException("Proposal file must not exceed 10MB");
        }

        if (!StringUtils.hasText(file.getOriginalFilename())) {
            throw new FileStorageException("Proposal file name is required");
        }

        String normalizedFilename = StringUtils.cleanPath(file.getOriginalFilename()).toLowerCase(Locale.ROOT);
        if (!normalizedFilename.endsWith(".pdf")) {
            throw new FileStorageException("Proposal file must be a PDF.");
        }
    }

    private void validateMilestoneSubmission(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("Milestone submission file is required.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new FileStorageException("Milestone submission must not exceed 10MB.");
        }
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename()).toLowerCase(Locale.ROOT);
        if (!originalFilename.endsWith(".pdf")
                && !originalFilename.endsWith(".doc")
                && !originalFilename.endsWith(".docx")
                && !originalFilename.endsWith(".zip")) {
            throw new FileStorageException("Milestone submission must be PDF, DOC, DOCX, or ZIP.");
        }
    }

    private StoredFile createStoredFile(StoredFileKind kind, User owner, MultipartFile file) {
        StoredFile storedFile = new StoredFile();
        storedFile.setKind(kind);
        storedFile.setOwnerUser(owner);
        storedFile.setOriginalFilename(sanitizeOriginalFilename(file.getOriginalFilename(), kind));
        storedFile.setMimeType(resolveMimeType(file));
        storedFile.setFileSize(file.getSize());
        storedFile.setContent(readBytes(file));
        return storedFile;
    }

    private StoredFile cloneStoredFile(StoredFile source, User owner) {
        StoredFile storedFile = new StoredFile();
        storedFile.setKind(source.getKind());
        storedFile.setOwnerUser(owner);
        storedFile.setOriginalFilename(source.getOriginalFilename());
        storedFile.setMimeType(source.getMimeType());
        storedFile.setFileSize(source.getFileSize());
        storedFile.setContent(source.getContent());
        return storedFile;
    }

    private StoredFilePayload toPayload(StoredFile storedFile) {
        return new StoredFilePayload(
                new ByteArrayResource(storedFile.getContent()),
                StringUtils.hasText(storedFile.getOriginalFilename()) ? storedFile.getOriginalFilename() : "download",
                StringUtils.hasText(storedFile.getMimeType()) ? storedFile.getMimeType() : "application/octet-stream"
        );
    }

    private String sanitizeOriginalFilename(String originalFilename, StoredFileKind kind) {
        String cleanedFilename = StringUtils.cleanPath(originalFilename == null ? "" : originalFilename);
        String strippedName = Paths.get(cleanedFilename).getFileName().toString();
        if (StringUtils.hasText(strippedName)) {
            return strippedName;
        }

        return switch (kind) {
            case PROFILE_PHOTO -> "profile-photo";
            case MILESTONE_SUBMISSION -> "milestone-submission";
            case PROJECT_PROPOSAL -> "proposal.pdf";
        };
    }

    private String resolveMimeType(MultipartFile file) {
        String contentType = StringUtils.hasText(file.getContentType()) ? file.getContentType().trim() : null;
        if (StringUtils.hasText(contentType)) {
            return contentType;
        }

        String normalizedName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename()).toLowerCase(Locale.ROOT);
        if (normalizedName.endsWith(".pdf")) return "application/pdf";
        if (normalizedName.endsWith(".doc")) return "application/msword";
        if (normalizedName.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (normalizedName.endsWith(".zip")) return "application/zip";
        if (normalizedName.endsWith(".png")) return "image/png";
        if (normalizedName.endsWith(".webp")) return "image/webp";
        if (normalizedName.endsWith(".jpg") || normalizedName.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new FileStorageException("Could not read uploaded file", ex);
        }
    }

    public ByteArrayResource loadAsResource(String storedFileName) {
        String fileName = StringUtils.cleanPath(storedFileName == null ? "" : storedFileName);
        if (!StringUtils.hasText(fileName)) {
            throw new FileStorageException("File not found: " + storedFileName);
        }

        Path filePath = proposalUploadDirectory.resolve(fileName).normalize();
        if (!filePath.startsWith(proposalUploadDirectory) || !Files.exists(filePath) || !Files.isReadable(filePath)) {
            throw new FileStorageException("File not found: " + storedFileName);
        }

        try {
            return new ByteArrayResource(Files.readAllBytes(filePath));
        } catch (IOException ex) {
            throw new FileStorageException("Could not read file: " + storedFileName, ex);
        }
    }

    private Optional<StoredFile> importLegacyProfilePhoto(UUID userId) {
        return userRepository.findById(userId)
                .flatMap(user -> importLegacyFile(
                        user.getProfilePhotoUrl(),
                        profilePhotoUploadDirectory,
                        StoredFileKind.PROFILE_PHOTO,
                        user,
                        null,
                        null,
                        null
                ));
    }

    private Optional<StoredFile> importLegacyProjectProposal(Project project) {
        return importLegacyFile(
                project.getDocumentPath(),
                proposalUploadDirectory,
                StoredFileKind.PROJECT_PROPOSAL,
                project.getStudent(),
                project,
                null,
                null
        );
    }

    private Optional<StoredFile> importLegacyProposalSubmission(ProposalSubmission proposalSubmission) {
        return importLegacyFile(
                proposalSubmission.getDocumentPath(),
                proposalUploadDirectory,
                StoredFileKind.PROJECT_PROPOSAL,
                proposalSubmission.getSubmittedBy(),
                proposalSubmission.getProject(),
                proposalSubmission,
                null
        );
    }

    private Optional<StoredFile> importLegacyMilestoneSubmission(Milestone milestone) {
        return importLegacyFile(
                milestone.getSubmissionFilePath(),
                milestoneUploadDirectory,
                StoredFileKind.MILESTONE_SUBMISSION,
                milestone.getProject() != null ? milestone.getProject().getStudent() : null,
                milestone.getProject(),
                null,
                milestone
        );
    }

    private Optional<StoredFile> importLegacyFile(
            String legacyPath,
            Path baseDirectory,
            StoredFileKind kind,
            User owner,
            Project project,
            ProposalSubmission proposalSubmission,
            Milestone milestone
    ) {
        String fileName = extractLegacyFileName(legacyPath);
        if (!StringUtils.hasText(fileName)) {
            return Optional.empty();
        }

        Path filePath = baseDirectory.resolve(fileName).normalize();
        if (!filePath.startsWith(baseDirectory) || !Files.exists(filePath) || !Files.isReadable(filePath)) {
            return Optional.empty();
        }

        try {
            byte[] bytes = Files.readAllBytes(filePath);
            StoredFile storedFile = new StoredFile();
            storedFile.setKind(kind);
            storedFile.setOwnerUser(owner);
            storedFile.setProject(project);
            storedFile.setProposalSubmission(proposalSubmission);
            storedFile.setMilestone(milestone);
            storedFile.setProfileUser(kind == StoredFileKind.PROFILE_PHOTO ? owner : null);
            storedFile.setOriginalFilename(fileName);
            storedFile.setMimeType(Files.probeContentType(filePath));
            storedFile.setFileSize(bytes.length);
            storedFile.setContent(bytes);
            StoredFile savedFile = storedFileRepository.save(storedFile);
            log.info("Imported legacy {} file {} into database storage", kind, filePath);
            return Optional.of(savedFile);
        } catch (IOException ex) {
            log.warn("Could not import legacy file {}", filePath, ex);
            return Optional.empty();
        }
    }

    private String extractLegacyFileName(String pathValue) {
        if (!StringUtils.hasText(pathValue)) {
            return null;
        }

        String cleanedPath = pathValue.split("\\?", 2)[0].trim();
        int lastSlashIndex = cleanedPath.lastIndexOf('/');
        if (lastSlashIndex < 0 || lastSlashIndex >= cleanedPath.length() - 1) {
            return null;
        }
        return cleanedPath.substring(lastSlashIndex + 1);
    }
}

