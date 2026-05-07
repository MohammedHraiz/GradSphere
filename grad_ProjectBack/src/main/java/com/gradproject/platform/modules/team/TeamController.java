package com.gradproject.platform.modules.team;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.team.dto.CreateTeamRequest;
import com.gradproject.platform.modules.team.dto.TeamResponseDTO;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.security.Principal;

@RestController
@RequestMapping("/api/v1/student/teams")
public class TeamController {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamService teamService;

    public TeamController(TeamRepository teamRepository, UserRepository userRepository, TeamMemberRepository teamMemberRepository, TeamService teamService) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.teamService = teamService;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<TeamResponseDTO> createTeam(@Valid @RequestBody CreateTeamRequest request, Principal principal) {
        String email = principal.getName();
        User leader = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        if (teamMemberRepository.existsByUserId(leader.getId())) {
            throw new BadRequestException("You already belong to a team");
        }

        Team team = new Team();
        team.setName(request.name());
        team.setMaxSize(request.maxSize());
        team.setLeader(leader);

        team = teamRepository.save(team);

        TeamMember leaderMember = TeamMember.builder()
                .team(team)
                .user(leader)
                .memberRole("LEADER")
                .membershipStatus("ACTIVE")
                .joinedAt(Instant.now())
                .build();
        teamMemberRepository.save(leaderMember);

        return teamService.getMyTeam(email)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new BadRequestException("Team was created but could not be loaded"));
    }

    @GetMapping("/my")
    public ResponseEntity<TeamResponseDTO> getMyTeam(Principal principal) {
        return teamService.getMyTeam(principal.getName())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
