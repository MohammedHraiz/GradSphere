package com.gradproject.platform.modules.project.storage;

import com.gradproject.platform.exception.FileStorageException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;
    private static final long MAX_PROFILE_PHOTO_SIZE_BYTES = 2L * 1024 * 1024;

    private final Path proposalUploadDirectory;
    private final Path profilePhotoUploadDirectory;
    private final Path milestoneUploadDirectory;

    public FileStorageService(
            @Value("${app.storage.proposals-dir:./uploads/proposals}") String proposalUploadDir,
            @Value("${app.storage.profile-photos-dir:./uploads/profile-photos}") String profilePhotoUploadDir,
            @Value("${app.storage.milestones-dir:./uploads/milestones}") String milestoneUploadDir
    ) {
        this.proposalUploadDirectory = Paths.get(proposalUploadDir).toAbsolutePath().normalize();
        this.profilePhotoUploadDirectory = Paths.get(profilePhotoUploadDir).toAbsolutePath().normalize();
        this.milestoneUploadDirectory = Paths.get(milestoneUploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    void init() {
        try {
            Files.createDirectories(proposalUploadDirectory);
            Files.createDirectories(profilePhotoUploadDirectory);
            Files.createDirectories(milestoneUploadDirectory);
            log.info("Proposal upload directory ready at {}", proposalUploadDirectory);
            log.info("Profile photo upload directory ready at {}", profilePhotoUploadDirectory);
            log.info("Milestone upload directory ready at {}", milestoneUploadDirectory);
        } catch (IOException ex) {
            throw new FileStorageException("Could not create upload directory", ex);
        }
    }

    public String storeProposal(MultipartFile file) {
        validateFile(file);

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String sanitizedName = sanitizeFilename(originalFilename);
        String storedFileName = appendUuidToFilename(sanitizedName);

        Path targetLocation = proposalUploadDirectory.resolve(storedFileName).normalize();
        if (!targetLocation.startsWith(proposalUploadDirectory)) {
            throw new FileStorageException("Invalid file storage path");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new FileStorageException("Could not store proposal file", ex);
        }

        log.info("Stored proposal file {} as {}", originalFilename, targetLocation);
        return "/files/" + storedFileName;
    }

    public String storeProfilePhoto(MultipartFile file) {
        validateProfilePhoto(file);

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String sanitizedName = sanitizeProfilePhotoFilename(originalFilename);
        Path targetLocation = profilePhotoUploadDirectory.resolve(sanitizedName).normalize();
        if (!targetLocation.startsWith(profilePhotoUploadDirectory)) {
            throw new FileStorageException("Invalid file storage path");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new FileStorageException("Could not store profile photo", ex);
        }

        log.info("Stored profile photo {} as {}", originalFilename, targetLocation);
        return "/files/profile-photos/" + sanitizedName;
    }

    public String storeMilestoneSubmission(MultipartFile file) {
        validateMilestoneSubmission(file);

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String sanitizedName = sanitizeMilestoneFilename(originalFilename);
        Path targetLocation = milestoneUploadDirectory.resolve(sanitizedName).normalize();
        if (!targetLocation.startsWith(milestoneUploadDirectory)) {
            throw new FileStorageException("Invalid file storage path");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new FileStorageException("Could not store milestone submission", ex);
        }

        log.info("Stored milestone submission {} as {}", originalFilename, targetLocation);
        return "/files/milestones/" + sanitizedName;
    }

    public void deleteProfilePhoto(String photoPath) {
        if (!isManagedProfilePhoto(photoPath)) {
            return;
        }

        String fileName = photoPath.substring("/files/profile-photos/".length());
        Path target = profilePhotoUploadDirectory.resolve(fileName).normalize();
        if (!target.startsWith(profilePhotoUploadDirectory)) {
            return;
        }

        try {
            Files.deleteIfExists(target);
        } catch (IOException ex) {
            log.warn("Could not delete old profile photo {}", target, ex);
        }
    }

    public Resource loadAsResource(String storedFileName) {
        try {
            Path filePath = proposalUploadDirectory.resolve(storedFileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new FileStorageException("File not found: " + storedFileName);
        } catch (MalformedURLException ex) {
            throw new FileStorageException("Could not read file: " + storedFileName, ex);
        }
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

        String originalFilename = file.getOriginalFilename();
        if (!StringUtils.hasText(originalFilename)) {
            throw new FileStorageException("Proposal file name is required");
        }

        String normalizedFilename = StringUtils.cleanPath(originalFilename).toLowerCase(Locale.ROOT);
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

    private String sanitizeFilename(String filename) {
        String strippedName = Paths.get(filename).getFileName().toString();
        int dotIndex = strippedName.lastIndexOf('.');
        String baseName = dotIndex > 0 ? strippedName.substring(0, dotIndex) : strippedName;
        String extension = dotIndex > 0 ? strippedName.substring(dotIndex).toLowerCase(Locale.ROOT) : "";
        String safeBaseName = baseName.replaceAll("[^a-zA-Z0-9._-]", "_");

        if (!StringUtils.hasText(safeBaseName)) {
            safeBaseName = "proposal";
        }

        return safeBaseName + "_" + UUID.randomUUID() + extension;
    }

    private String appendUuidToFilename(String filename) {
        return filename;
    }

    private String sanitizeProfilePhotoFilename(String filename) {
        String strippedName = Paths.get(filename).getFileName().toString();
        String extension = "";
        int dotIndex = strippedName.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = strippedName.substring(dotIndex).toLowerCase(Locale.ROOT);
        }

        if (!extension.equals(".jpg") && !extension.equals(".jpeg") && !extension.equals(".png") && !extension.equals(".webp")) {
            extension = ".jpg";
        }

        return "profile_" + UUID.randomUUID() + extension;
    }

    private String sanitizeMilestoneFilename(String filename) {
        String strippedName = Paths.get(filename).getFileName().toString();
        int dotIndex = strippedName.lastIndexOf('.');
        String extension = dotIndex > 0 ? strippedName.substring(dotIndex).toLowerCase(Locale.ROOT) : ".pdf";
        String baseName = dotIndex > 0 ? strippedName.substring(0, dotIndex) : strippedName;
        String safeBaseName = baseName.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (!StringUtils.hasText(safeBaseName)) {
            safeBaseName = "milestone_submission";
        }
        return safeBaseName + "_" + UUID.randomUUID() + extension;
    }

    private boolean isManagedProfilePhoto(String photoPath) {
        return StringUtils.hasText(photoPath) && photoPath.startsWith("/files/profile-photos/");
    }
}

