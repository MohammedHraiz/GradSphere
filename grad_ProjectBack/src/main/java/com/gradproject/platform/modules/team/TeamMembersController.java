package com.gradproject.platform.modules.team;

import com.gradproject.platform.modules.team.dto.MemberResponseDTO;
import com.gradproject.platform.modules.team.dto.TeamResponseDTO;
import com.gradproject.platform.modules.team.dto.TeamUpdateDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teams")
public class TeamMembersController {

    private final TeamService teamService;

    public TeamMembersController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping("/my")
    public ResponseEntity<TeamResponseDTO> getMyTeam(Principal principal) {
        return teamService.getMyTeam(principal.getName())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/my/members")
    public ResponseEntity<List<MemberResponseDTO>> getMyTeamMembers(Principal principal) {
        return teamService.getMyTeamMembers(principal.getName())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/my")
    public ResponseEntity<TeamResponseDTO> updateMyTeam(@Valid @RequestBody TeamUpdateDTO request, Principal principal) {
        return ResponseEntity.ok(teamService.updateMyTeam(principal.getName(), request));
    }

    @DeleteMapping("/my/leave")
    public ResponseEntity<Void> leaveMyTeam(Principal principal) {
        teamService.leaveMyTeam(principal.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/my/members/{memberId}")
    public ResponseEntity<List<MemberResponseDTO>> removeMemberFromMyTeam(@PathVariable UUID memberId, Principal principal) {
        return ResponseEntity.ok(teamService.removeMemberFromMyTeam(principal.getName(), memberId));
    }
}

