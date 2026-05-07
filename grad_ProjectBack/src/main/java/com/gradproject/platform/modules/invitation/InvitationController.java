package com.gradproject.platform.modules.invitation;

import com.gradproject.platform.modules.invitation.dto.InvitationActionResponseDTO;
import com.gradproject.platform.modules.invitation.dto.InvitationResponseDTO;
import com.gradproject.platform.modules.invitation.dto.SentInvitationResponseDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/invitations")
public class InvitationController {

    private final InvitationService invitationService;

    public InvitationController(InvitationService invitationService) {
        this.invitationService = invitationService;
    }

    @PostMapping("/send/{receiverId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Invitation> sendInvitation(@PathVariable UUID receiverId) {
        Invitation invitation = invitationService.sendInvitation(receiverId);
        return ResponseEntity.status(HttpStatus.CREATED).body(invitation);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<InvitationResponseDTO>> getMyPendingInvitations() {
        return ResponseEntity.ok(invitationService.getPendingInvitationsForCurrentUser());
    }

    @GetMapping("/sent/pending")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<SentInvitationResponseDTO>> getMyTeamPendingSentInvitations() {
        return ResponseEntity.ok(invitationService.getPendingSentInvitationsForCurrentTeam());
    }

    @PatchMapping("/{invitationId}/cancel")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<InvitationActionResponseDTO> cancelInvitation(@PathVariable UUID invitationId) {
        return ResponseEntity.ok(invitationService.cancelInvitation(invitationId));
    }

    @PostMapping("/{invitationId}/accept")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<InvitationActionResponseDTO> acceptInvitation(@PathVariable UUID invitationId) {
        return ResponseEntity.ok(invitationService.acceptInvitation(invitationId));
    }

    @PostMapping("/{invitationId}/reject")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<InvitationActionResponseDTO> rejectInvitation(@PathVariable UUID invitationId) {
        return ResponseEntity.ok(invitationService.rejectInvitation(invitationId));
    }
}

