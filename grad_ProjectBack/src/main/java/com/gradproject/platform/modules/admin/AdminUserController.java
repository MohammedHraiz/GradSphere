package com.gradproject.platform.modules.admin;

import com.gradproject.platform.modules.user.UserManagementService;
import com.gradproject.platform.modules.user.dto.AdminUserCreateRequestDTO;
import com.gradproject.platform.modules.user.dto.AdminUserUpdateRequestDTO;
import com.gradproject.platform.modules.user.dto.UserProfileResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserManagementService userManagementService;

    public AdminUserController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @PostMapping
    public ResponseEntity<UserProfileResponseDTO> createUser(@Valid @RequestBody AdminUserCreateRequestDTO request) {
        return ResponseEntity.ok(userManagementService.createUser(request));
    }

    @GetMapping
    public ResponseEntity<List<UserProfileResponseDTO>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String department
    ) {
        return ResponseEntity.ok(userManagementService.searchUsers(search, role, department));
    }

    @PatchMapping("/{userId}")
    public ResponseEntity<UserProfileResponseDTO> updateUser(
            @PathVariable UUID userId,
            @Valid @RequestBody AdminUserUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(userManagementService.updateUser(userId, request));
    }
}
