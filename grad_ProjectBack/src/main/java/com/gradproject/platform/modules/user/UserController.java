package com.gradproject.platform.modules.user;

import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.user.dto.SupervisorSummaryDTO;
import com.gradproject.platform.modules.user.dto.UserResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProjectRepository projectRepository;

    public UserController(UserRepository userRepository, TeamMemberRepository teamMemberRepository, ProjectRepository projectRepository) {
        this.userRepository = userRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser(Principal principal) {
        User currentUser = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean hasTeam = teamMemberRepository.findByUserId(currentUser.getId()).isPresent();

        UserResponseDTO response = new UserResponseDTO(
                currentUser.getId(),
                currentUser.getName(),
                currentUser.getEmail(),
                currentUser.getRole() != null ? currentUser.getRole().name() : null,
                hasTeam
        );

        return ResponseEntity.ok(response);
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

