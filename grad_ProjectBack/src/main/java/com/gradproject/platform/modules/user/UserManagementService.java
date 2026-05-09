package com.gradproject.platform.modules.user;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.project.storage.FileStorageService;
import com.gradproject.platform.modules.user.dto.AdminUserCreateRequestDTO;
import com.gradproject.platform.modules.user.dto.AdminUserUpdateRequestDTO;
import com.gradproject.platform.modules.user.dto.PublicUserProfileDTO;
import com.gradproject.platform.modules.user.dto.UserProfileResponseDTO;
import com.gradproject.platform.modules.user.dto.UserProfileUpdateRequestDTO;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class UserManagementService {

    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    public UserManagementService(UserRepository userRepository, TeamMemberRepository teamMemberRepository, PasswordEncoder passwordEncoder, FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
    }

    public UserProfileResponseDTO getCurrentUserProfile(String email) {
        User user = getUserByEmail(email);
        return toProfileDto(user, hasTeam(user));
    }

    public PublicUserProfileDTO getPublicUserProfile(UUID userId) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authenticated user not found.");
        }

        User requester = getCurrentAuthenticatedUser();
        if (requester == null || requester.getId() == null) {
            throw new AccessDeniedException("Authenticated user not found.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found."));
        return toPublicProfileDto(user);
    }

    public UserProfileResponseDTO updateCurrentUserProfile(String email, UserProfileUpdateRequestDTO request) {
        if (!request.getExtraFields().isEmpty()) {
            throw new BadRequestException("You cannot edit this field.");
        }

        User user = getUserByEmail(email);
        user.setPhoneNumber(clean(request.getPhoneNumber()));
        user.setSpecialty(clean(request.getSpecialty()));

        if (user.getRole() == UserRole.ROLE_SUPERVISOR) {
            user.setOfficeHours(clean(request.getOfficeHours()));
        } else if (hasText(request.getOfficeHours())) {
            throw new BadRequestException("Office hours are only available for supervisors.");
        }

        return toProfileDto(userRepository.save(user), hasTeam(user));
    }

    public UserProfileResponseDTO uploadCurrentUserProfilePhoto(String email, MultipartFile photo) {
        User user = getUserByEmail(email);
        String previousPhoto = user.getProfilePhotoUrl();
        String storedPhotoPath = fileStorageService.storeProfilePhoto(photo);
        user.setProfilePhotoUrl(storedPhotoPath);
        User savedUser = userRepository.save(user);
        if (previousPhoto != null && !previousPhoto.equals(storedPhotoPath)) {
            fileStorageService.deleteProfilePhoto(previousPhoto);
        }
        return toProfileDto(savedUser, hasTeam(savedUser));
    }

    public UserProfileResponseDTO createUser(AdminUserCreateRequestDTO request) {
        requireAdmin();
        UserRole role = parseRole(request.getRole());
        UserDepartment department = parseDepartment(request.getDepartment(), role);
        String email = normalizeEmail(request.getEmail());
        String universityId = normalizeUniversityId(request.getUniversityId());

        validateEmailUnique(email, null);
        validateUniversityId(role, universityId, null);

        User user = new User();
        user.setName(cleanRequired(request.getName(), "Name is required."));
        user.setEmail(email);
        user.setUniversityId(universityId);
        user.setRole(role);
        user.setDepartment(department);
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));

        return toProfileDto(userRepository.save(user), false);
    }

    public List<UserProfileResponseDTO> searchUsers(String search, String role, String department) {
        requireAdmin();
        String normalizedSearch = hasText(search) ? "%" + search.trim().toLowerCase(Locale.ROOT) + "%" : null;
        String normalizedRole = normalizeFilterValue(role);
        String normalizedDepartment = normalizeFilterValue(department);
        UserRole resolvedRole = hasText(normalizedRole) ? parseRole(normalizedRole) : null;
        UserDepartment resolvedDepartment = hasText(normalizedDepartment) ? parseDepartmentFilter(normalizedDepartment) : null;

        return userRepository.searchUsers(normalizedSearch, resolvedRole, resolvedDepartment)
                .stream()
                .map(user -> toProfileDto(user, hasTeam(user)))
                .toList();
    }

    public UserProfileResponseDTO updateUser(UUID userId, AdminUserUpdateRequestDTO request) {
        requireAdmin();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found."));

        UserRole role = parseRole(request.getRole());
        UserDepartment department = parseDepartment(request.getDepartment(), role);
        String email = normalizeEmail(request.getEmail());
        String universityId = normalizeUniversityId(request.getUniversityId());

        validateEmailUnique(email, user.getId());
        validateUniversityId(role, universityId, user.getId());

        user.setName(cleanRequired(request.getName(), "Name is required."));
        user.setEmail(email);
        user.setUniversityId(universityId);
        user.setRole(role);
        user.setDepartment(department);
        user.setPhoneNumber(clean(request.getPhoneNumber()));
        user.setSpecialty(clean(request.getSpecialty()));
        user.setOfficeHours(role == UserRole.ROLE_SUPERVISOR ? clean(request.getOfficeHours()) : null);

        return toProfileDto(userRepository.save(user), hasTeam(user));
    }

    public User getCurrentAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return getUserByEmail(email);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("User not found."));
    }

    private void requireAdmin() {
        User currentUser = getCurrentAuthenticatedUser();
        if (currentUser.getRole() != UserRole.ROLE_ADMIN) {
            throw new AccessDeniedException("Only admin can edit this field.");
        }
    }

    private UserProfileResponseDTO toProfileDto(User user, boolean hasTeam) {
        return new UserProfileResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getUniversityId(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getDepartment() != null ? user.getDepartment().name() : null,
                user.getPhoneNumber(),
                user.getSpecialty(),
                user.getOfficeHours(),
                user.getProfilePhotoUrl(),
                user.getCreatedAt(),
                hasTeam
        );
    }

    private PublicUserProfileDTO toPublicProfileDto(User user) {
        return new PublicUserProfileDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getDepartment() != null ? user.getDepartment().name() : null,
                user.getUniversityId(),
                user.getProfilePhotoUrl(),
                user.getPhoneNumber(),
                user.getSpecialty(),
                user.getOfficeHours(),
                user.getCreatedAt()
        );
    }

    private boolean hasTeam(User user) {
        return teamMemberRepository.existsByUserId(user.getId());
    }

    private void validateEmailUnique(String email, UUID currentUserId) {
        boolean exists = currentUserId == null
                ? userRepository.existsByEmailIgnoreCase(email)
                : userRepository.existsByEmailIgnoreCaseAndIdNot(email, currentUserId);
        if (exists) {
            throw new BadRequestException("Email already exists.");
        }
    }

    private void validateUniversityId(UserRole role, String universityId, UUID currentUserId) {
        boolean requiresUniversityId = role == UserRole.ROLE_STUDENT || role == UserRole.ROLE_SUPERVISOR;
        if (requiresUniversityId && !hasText(universityId)) {
            throw new BadRequestException("University ID is required for students and supervisors.");
        }

        if (!hasText(universityId)) {
            return;
        }

        boolean exists = currentUserId == null
                ? userRepository.existsByUniversityIdIgnoreCase(universityId)
                : userRepository.existsByUniversityIdIgnoreCaseAndIdNot(universityId, currentUserId);
        if (exists) {
            throw new BadRequestException("University ID already exists.");
        }
    }

    private UserRole parseRole(String rawRole) {
        String normalized = clean(rawRole);
        if (!hasText(normalized)) {
            throw new BadRequestException("Role is required.");
        }

        String candidate = normalized.toUpperCase(Locale.ROOT);
        if (!candidate.startsWith("ROLE_")) {
            candidate = "ROLE_" + candidate;
        }

        try {
            return UserRole.valueOf(candidate);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Invalid role.");
        }
    }

    private UserDepartment parseDepartment(String rawDepartment, UserRole role) {
        boolean requiresDepartment = role == UserRole.ROLE_STUDENT || role == UserRole.ROLE_SUPERVISOR;
        if (!requiresDepartment) {
            return null;
        }
        if (!hasText(rawDepartment)) {
            throw new BadRequestException("Department is required for students and supervisors.");
        }
        return parseDepartmentFilter(rawDepartment);
    }

    private UserDepartment parseDepartmentFilter(String rawDepartment) {
        String normalized = clean(rawDepartment);
        if (!hasText(normalized)) {
            throw new BadRequestException("Invalid department.");
        }
        try {
            return UserDepartment.valueOf(normalized.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Invalid department.");
        }
    }

    private String normalizeEmail(String email) {
        return cleanRequired(email, "Email is required.").toLowerCase(Locale.ROOT);
    }

    private String normalizeUniversityId(String universityId) {
        return clean(universityId);
    }

    private String cleanRequired(String value, String message) {
        String cleaned = clean(value);
        if (!hasText(cleaned)) {
            throw new BadRequestException(message);
        }
        return cleaned;
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeFilterValue(String value) {
        String cleaned = clean(value);
        if (!hasText(cleaned)) {
            return null;
        }
        if ("all".equalsIgnoreCase(cleaned)) {
            return null;
        }
        return cleaned;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
