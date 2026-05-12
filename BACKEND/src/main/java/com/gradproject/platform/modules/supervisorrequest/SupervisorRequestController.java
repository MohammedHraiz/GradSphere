package com.gradproject.platform.modules.supervisorrequest;

import com.gradproject.platform.modules.supervisorrequest.dto.SupervisorRequestDTO;
import com.gradproject.platform.modules.supervisorrequest.dto.SupervisorRequestMessageDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/supervisor-requests")
public class SupervisorRequestController {

    private final SupervisorRequestService supervisorRequestService;

    public SupervisorRequestController(SupervisorRequestService supervisorRequestService) {
        this.supervisorRequestService = supervisorRequestService;
    }

    @PostMapping("/projects/{projectId}/request/{supervisorId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SupervisorRequestDTO> requestSupervisor(
            @PathVariable UUID projectId,
            @PathVariable UUID supervisorId,
            @RequestBody(required = false) SupervisorRequestMessageDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supervisorRequestService.requestSupervisor(projectId, supervisorId, request));
    }

    @GetMapping("/my/pending")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<List<SupervisorRequestDTO>> getMyPendingRequests() {
        return ResponseEntity.ok(supervisorRequestService.getMyPendingRequests());
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('DEAN_OFFICE') or hasRole('ADMIN')")
    public ResponseEntity<List<SupervisorRequestDTO>> getAllRequests() {
        return ResponseEntity.ok(supervisorRequestService.getAllRequests());
    }

    @PatchMapping("/{requestId}/accept")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<SupervisorRequestDTO> accept(@PathVariable UUID requestId) {
        return ResponseEntity.ok(supervisorRequestService.acceptRequest(requestId));
    }

    @PatchMapping("/{requestId}/reject")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<SupervisorRequestDTO> reject(
            @PathVariable UUID requestId,
            @RequestBody(required = false) SupervisorRequestMessageDTO request) {
        return ResponseEntity.ok(supervisorRequestService.rejectRequest(requestId, request));
    }

    @PatchMapping("/{requestId}/cancel")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SupervisorRequestDTO> cancel(@PathVariable UUID requestId) {
        return ResponseEntity.ok(supervisorRequestService.cancelRequest(requestId));
    }
}
