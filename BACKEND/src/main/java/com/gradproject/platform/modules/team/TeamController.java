package com.gradproject.platform.modules.team;

import com.gradproject.platform.modules.team.dto.CreateTeamRequest;
import com.gradproject.platform.modules.team.dto.TeamResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/student/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @PostMapping
    public ResponseEntity<TeamResponseDTO> createTeam(@Valid @RequestBody CreateTeamRequest request, Principal principal) {
        return ResponseEntity.ok(teamService.createTeam(principal.getName(), request));
    }

    @GetMapping("/my")
    public ResponseEntity<TeamResponseDTO> getMyTeam(Principal principal) {
        return teamService.getMyTeam(principal.getName())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
