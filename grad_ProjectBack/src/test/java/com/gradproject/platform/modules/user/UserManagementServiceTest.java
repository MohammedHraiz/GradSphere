package com.gradproject.platform.modules.user;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.project.storage.FileStorageService;
import com.gradproject.platform.modules.user.dto.AdminUserCreateRequestDTO;
import com.gradproject.platform.modules.user.dto.AdminUserUpdateRequestDTO;
import com.gradproject.platform.modules.user.dto.UserProfileUpdateRequestDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserManagementServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TeamMemberRepository teamMemberRepository;

    @Mock
    private FileStorageService fileStorageService;

    private final PasswordEncoder passwordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
    private UserManagementService service;
    private User admin;
    private User student;
    private User supervisor;

    @BeforeEach
    void setUp() {
        service = new UserManagementService(userRepository, teamMemberRepository, passwordEncoder, fileStorageService);
        admin = user(UUID.randomUUID(), "admin@example.com", UserRole.ROLE_ADMIN);
        student = user(UUID.randomUUID(), "student@example.com", UserRole.ROLE_STUDENT);
        supervisor = user(UUID.randomUUID(), "supervisor@example.com", UserRole.ROLE_SUPERVISOR);
        lenient().when(teamMemberRepository.findByUserId(any())).thenReturn(Optional.empty());
        SecurityContextHolder.clearContext();
    }

    @Test
    void adminCanCreateStudent() {
        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.existsByEmailIgnoreCase("sara@example.com")).thenReturn(false);
        when(userRepository.existsByUniversityIdIgnoreCase("320190112")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.createUser(createRequest("Sara Ahmed", "sara@example.com", "320190112", "ROLE_STUDENT", "SOFTWARE_ENGINEERING"));

        assertThat(response.name()).isEqualTo("Sara Ahmed");
        assertThat(response.role()).isEqualTo("ROLE_STUDENT");
        assertThat(response.department()).isEqualTo("SOFTWARE_ENGINEERING");
        assertThat(response.universityId()).isEqualTo("320190112");
    }

    @Test
    void adminCanCreateSupervisor() {
        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.existsByEmailIgnoreCase("dr.sara@example.com")).thenReturn(false);
        when(userRepository.existsByUniversityIdIgnoreCase("FAC-2026")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.createUser(createRequest("Dr. Sara", "dr.sara@example.com", "FAC-2026", "ROLE_SUPERVISOR", "COMPUTER_SCIENCE"));

        assertThat(response.role()).isEqualTo("ROLE_SUPERVISOR");
        assertThat(response.department()).isEqualTo("COMPUTER_SCIENCE");
    }

    @Test
    void adminCanCreateDeanWithoutDepartment() {
        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.existsByEmailIgnoreCase("dean@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.createUser(createRequest("Dean User", "dean@example.com", null, "ROLE_DEAN_OFFICE", null));

        assertThat(response.role()).isEqualTo("ROLE_DEAN_OFFICE");
        assertThat(response.department()).isNull();
        assertThat(response.universityId()).isNull();
    }

    @Test
    void departmentRequiredForStudentAndSupervisor() {
        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> service.createUser(createRequest("Sara Ahmed", "sara@example.com", "320190112", "ROLE_STUDENT", null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Department is required for students and supervisors.");
    }

    @Test
    void duplicateEmailBlockedOnCreate() {
        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.existsByEmailIgnoreCase("sara@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.createUser(createRequest("Sara Ahmed", "sara@example.com", "320190112", "ROLE_STUDENT", "SOFTWARE_ENGINEERING")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email already exists.");
    }

    @Test
    void duplicateUniversityIdBlockedOnCreate() {
        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.existsByEmailIgnoreCase("sara@example.com")).thenReturn(false);
        when(userRepository.existsByUniversityIdIgnoreCase("320190112")).thenReturn(true);

        assertThatThrownBy(() -> service.createUser(createRequest("Sara Ahmed", "sara@example.com", "320190112", "ROLE_STUDENT", "SOFTWARE_ENGINEERING")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("University ID already exists.");
    }

    @Test
    void nonAdminCannotCreateUser() {
        authenticate(student);
        when(userRepository.findByEmailIgnoreCase(student.getEmail())).thenReturn(Optional.of(student));

        assertThatThrownBy(() -> service.createUser(createRequest("Sara Ahmed", "sara@example.com", "320190112", "ROLE_STUDENT", "SOFTWARE_ENGINEERING")))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Only admin can edit this field.");
    }

    @Test
    void adminCanEditUserBasicFields() {
        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(userRepository.existsByEmailIgnoreCaseAndIdNot("updated@example.com", student.getId())).thenReturn(false);
        when(userRepository.existsByUniversityIdIgnoreCaseAndIdNot("NEW-100", student.getId())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserUpdateRequestDTO request = new AdminUserUpdateRequestDTO();
        request.setName("Updated Student");
        request.setEmail("updated@example.com");
        request.setUniversityId("NEW-100");
        request.setRole("ROLE_SUPERVISOR");
        request.setDepartment("ANIMATION");
        request.setPhoneNumber("0790000000");
        request.setSpecialty("UI/UX Designer");
        request.setOfficeHours("Sun 10-12");

        var response = service.updateUser(student.getId(), request);

        assertThat(response.name()).isEqualTo("Updated Student");
        assertThat(response.role()).isEqualTo("ROLE_SUPERVISOR");
        assertThat(response.department()).isEqualTo("ANIMATION");
        assertThat(response.phoneNumber()).isEqualTo("0790000000");
        assertThat(response.officeHours()).isEqualTo("Sun 10-12");
    }

    @Test
    void duplicateEmailBlockedOnEdit() {
        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(userRepository.existsByEmailIgnoreCaseAndIdNot("duplicate@example.com", student.getId())).thenReturn(true);

        AdminUserUpdateRequestDTO request = new AdminUserUpdateRequestDTO();
        request.setName("Updated Student");
        request.setEmail("duplicate@example.com");
        request.setUniversityId("NEW-100");
        request.setRole("ROLE_STUDENT");
        request.setDepartment("ANIMATION");

        assertThatThrownBy(() -> service.updateUser(student.getId(), request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email already exists.");
    }

    @Test
    void duplicateUniversityIdBlockedOnEdit() {
        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(userRepository.existsByEmailIgnoreCaseAndIdNot("updated@example.com", student.getId())).thenReturn(false);
        when(userRepository.existsByUniversityIdIgnoreCaseAndIdNot("NEW-100", student.getId())).thenReturn(true);

        AdminUserUpdateRequestDTO request = new AdminUserUpdateRequestDTO();
        request.setName("Updated Student");
        request.setEmail("updated@example.com");
        request.setUniversityId("NEW-100");
        request.setRole("ROLE_STUDENT");
        request.setDepartment("ANIMATION");

        assertThatThrownBy(() -> service.updateUser(student.getId(), request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("University ID already exists.");
    }

    @Test
    void changingRoleToAdminClearsDepartment() {
        student.setDepartment(UserDepartment.SOFTWARE_ENGINEERING);

        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(userRepository.existsByEmailIgnoreCaseAndIdNot("updated@example.com", student.getId())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserUpdateRequestDTO request = new AdminUserUpdateRequestDTO();
        request.setName("Adminized User");
        request.setEmail("updated@example.com");
        request.setUniversityId(null);
        request.setRole("ROLE_ADMIN");
        request.setDepartment(null);

        var response = service.updateUser(student.getId(), request);

        assertThat(response.role()).isEqualTo("ROLE_ADMIN");
        assertThat(response.department()).isNull();
    }

    @Test
    void nonAdminCannotEditAdminFields() {
        authenticate(student);
        when(userRepository.findByEmailIgnoreCase(student.getEmail())).thenReturn(Optional.of(student));

        AdminUserUpdateRequestDTO request = new AdminUserUpdateRequestDTO();
        request.setName("Updated Student");
        request.setEmail("updated@example.com");
        request.setUniversityId("NEW-100");
        request.setRole("ROLE_STUDENT");
        request.setDepartment("ANIMATION");

        assertThatThrownBy(() -> service.updateUser(student.getId(), request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Only admin can edit this field.");
    }

    @Test
    void adminCanListUsers() {
        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.searchUsers(null, null, null)).thenReturn(java.util.List.of(student, supervisor, admin));

        var result = service.searchUsers(null, null, null);

        assertThat(result).hasSize(3);
        assertThat(result).extracting("email").contains("student@example.com", "supervisor@example.com", "admin@example.com");
    }

    @Test
    void adminCanListUsersWithNullDepartment() {
        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        student.setDepartment(null);
        supervisor.setDepartment(null);
        when(userRepository.searchUsers(null, null, null)).thenReturn(java.util.List.of(student, supervisor));

        var result = service.searchUsers("  ", "ALL", "ALL");

        assertThat(result).hasSize(2);
        assertThat(result).allSatisfy(user -> assertThat(user.department()).isNull());
    }

    @Test
    void searchFiltersAllowBlankValues() {
        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.searchUsers(null, null, null)).thenReturn(java.util.List.of(student));

        var result = service.searchUsers("   ", " ", " ");

        assertThat(result).hasSize(1);
    }

    @Test
    void invalidRoleFilterIsRejected() {
        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> service.searchUsers(null, "INVALID_ROLE", null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid role.");
    }

    @Test
    void invalidDepartmentFilterIsRejected() {
        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> service.searchUsers(null, null, "NOT_A_DEPARTMENT"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid department.");
    }

    @Test
    void nonAdminCannotListUsers() {
        authenticate(student);
        when(userRepository.findByEmailIgnoreCase(student.getEmail())).thenReturn(Optional.of(student));

        assertThatThrownBy(() -> service.searchUsers(null, null, null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Only admin can edit this field.");
    }

    @Test
    void userListReturnsSafeDtos() {
        authenticate(admin);
        when(userRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.searchUsers(null, null, null)).thenReturn(java.util.List.of(student));

        var result = service.searchUsers(null, null, null);

        assertThat(result).singleElement().satisfies(user -> {
            assertThat(user.name()).isEqualTo(student.getName());
            assertThat(user.email()).isEqualTo(student.getEmail());
            assertThat(user.role()).isEqualTo("ROLE_STUDENT");
        });
    }

    @Test
    void userCanEditPhoneNumberAndSpecialty() {
        when(userRepository.findByEmailIgnoreCase(student.getEmail())).thenReturn(Optional.of(student));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileUpdateRequestDTO request = new UserProfileUpdateRequestDTO();
        request.setPhoneNumber("0791234567");
        request.setSpecialty("Frontend Developer");

        var response = service.updateCurrentUserProfile(student.getEmail(), request);

        assertThat(response.phoneNumber()).isEqualTo("0791234567");
        assertThat(response.specialty()).isEqualTo("Frontend Developer");
    }

    @Test
    void supervisorCanEditOfficeHours() {
        when(userRepository.findByEmailIgnoreCase(supervisor.getEmail())).thenReturn(Optional.of(supervisor));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileUpdateRequestDTO request = new UserProfileUpdateRequestDTO();
        request.setOfficeHours("Mon 9-11");

        var response = service.updateCurrentUserProfile(supervisor.getEmail(), request);

        assertThat(response.officeHours()).isEqualTo("Mon 9-11");
    }

    @Test
    void studentCannotEditOfficeHours() {
        when(userRepository.findByEmailIgnoreCase(student.getEmail())).thenReturn(Optional.of(student));

        UserProfileUpdateRequestDTO request = new UserProfileUpdateRequestDTO();
        request.setOfficeHours("Mon 9-11");

        assertThatThrownBy(() -> service.updateCurrentUserProfile(student.getEmail(), request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Office hours are only available for supervisors.");
    }

    @Test
    void userCannotEditRestrictedFieldsThroughProfileEndpoint() {
        UserProfileUpdateRequestDTO request = new UserProfileUpdateRequestDTO();
        request.captureExtraField("name", "Changed Name");

        assertThatThrownBy(() -> service.updateCurrentUserProfile(student.getEmail(), request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("You cannot edit this field.");
    }

    @Test
    void authenticatedUserCanUploadValidProfilePhoto() {
        when(userRepository.findByEmailIgnoreCase(student.getEmail())).thenReturn(Optional.of(student));
        when(fileStorageService.storeProfilePhoto(any())).thenReturn("/files/profile-photos/profile_123.jpg");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MockMultipartFile file = new MockMultipartFile("photo", "avatar.jpg", "image/jpeg", new byte[]{1, 2, 3});

        var response = service.uploadCurrentUserProfilePhoto(student.getEmail(), file);

        assertThat(response.profilePhotoUrl()).isEqualTo("/files/profile-photos/profile_123.jpg");
    }

    @Test
    void invalidProfilePhotoTypeIsRejected() {
        when(userRepository.findByEmailIgnoreCase(student.getEmail())).thenReturn(Optional.of(student));
        when(fileStorageService.storeProfilePhoto(any())).thenThrow(new com.gradproject.platform.exception.FileStorageException("Profile photo must be JPG, PNG, or WebP."));

        MockMultipartFile file = new MockMultipartFile("photo", "avatar.gif", "image/gif", new byte[]{1, 2, 3});

        assertThatThrownBy(() -> service.uploadCurrentUserProfilePhoto(student.getEmail(), file))
                .isInstanceOf(com.gradproject.platform.exception.FileStorageException.class)
                .hasMessage("Profile photo must be JPG, PNG, or WebP.");
    }

    @Test
    void oversizedProfilePhotoIsRejected() {
        when(userRepository.findByEmailIgnoreCase(student.getEmail())).thenReturn(Optional.of(student));
        when(fileStorageService.storeProfilePhoto(any())).thenThrow(new com.gradproject.platform.exception.FileStorageException("Profile photo is too large."));

        MockMultipartFile file = new MockMultipartFile("photo", "avatar.jpg", "image/jpeg", new byte[]{1, 2, 3});

        assertThatThrownBy(() -> service.uploadCurrentUserProfilePhoto(student.getEmail(), file))
                .isInstanceOf(com.gradproject.platform.exception.FileStorageException.class)
                .hasMessage("Profile photo is too large.");
    }

    private static AdminUserCreateRequestDTO createRequest(String name, String email, String universityId, String role, String department) {
        AdminUserCreateRequestDTO request = new AdminUserCreateRequestDTO();
        request.setName(name);
        request.setEmail(email);
        request.setUniversityId(universityId);
        request.setRole(role);
        request.setDepartment(department);
        return request;
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

    private static void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, user.getAuthorities())
        );
    }
}
