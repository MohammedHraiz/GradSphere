package com.gradproject.platform.modules.user;

import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.user.dto.SupervisorSummaryDTO;
import com.gradproject.platform.modules.user.dto.UserProfileResponseDTO;
import com.gradproject.platform.modules.user.dto.UserProfileUpdateRequestDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserManagementService userManagementService;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProjectRepository projectRepository;

    public UserController(UserManagementService userManagementService, UserRepository userRepository, TeamMemberRepository teamMemberRepository, ProjectRepository projectRepository) {
        this.userManagementService = userManagementService;
        this.userRepository = userRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponseDTO> getCurrentUser(Principal principal) {
        return ResponseEntity.ok(userManagementService.getCurrentUserProfile(principal.getName()));
    }

    @PatchMapping("/me/profile")
    public ResponseEntity<UserProfileResponseDTO> updateCurrentUserProfile(
            Principal principal,
            @Valid @RequestBody UserProfileUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(userManagementService.updateCurrentUserProfile(principal.getName(), request));
    }

    @PostMapping(value = "/me/profile-photo", consumes = "multipart/form-data")
    public ResponseEntity<UserProfileResponseDTO> uploadCurrentUserProfilePhoto(
            Principal principal,
            @RequestParam("photo") MultipartFile photo
    ) {
        return ResponseEntity.ok(userManagementService.uploadCurrentUserProfilePhoto(principal.getName(), photo));
    }

    @GetMapping("/supervisors")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SupervisorSummaryDTO>> getSupervisors() {
        return ResponseEntity.ok(userRepository.findByRoleOrderByNameAsc(UserRole.ROLE_SUPERVISOR)
                .stream()
                .map(supervisor -> new SupervisorSummaryDTO(
                        supervisor.getId(),
                        supervisor.getName(),
                        supervisor.getEmail(),
                        null,
                        projectRepository.countBySupervisorId(supervisor.getId())
                ))
                .toList());
    }
}

