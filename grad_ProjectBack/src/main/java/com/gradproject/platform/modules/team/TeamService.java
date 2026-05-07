package com.gradproject.platform.modules.team;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.team.dto.MemberResponseDTO;
import com.gradproject.platform.modules.team.dto.TeamResponseDTO;
import com.gradproject.platform.modules.team.dto.TeamUpdateDTO;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TeamService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProjectRepository projectRepository;

    public TeamService(UserRepository userRepository, TeamRepository teamRepository, TeamMemberRepository teamMemberRepository, ProjectRepository projectRepository) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public Optional<TeamResponseDTO> getMyTeam(String email) {
        TeamMember currentMembership = getCurrentMembership(email);
        if (currentMembership == null || currentMembership.getTeam() == null) {
            return Optional.empty();
        }

        long membersCount = teamMemberRepository.countByTeamId(currentMembership.getTeam().getId());

        return Optional.of(new TeamResponseDTO(
                currentMembership.getTeam().getId(),
                currentMembership.getTeam().getName(),
                currentMembership.getTeam().getEstablishedOn(),
                membersCount,
                getTeamMembers(currentMembership.getTeam().getId())
        ));
    }

    @Transactional(readOnly = true)
    public Optional<List<MemberResponseDTO>> getMyTeamMembers(String email) {
        TeamMember currentMembership = getCurrentMembership(email);
        if (currentMembership == null || currentMembership.getTeam() == null) {
            return Optional.empty();
        }

        return Optional.of(getTeamMembers(currentMembership.getTeam().getId()));
    }

    @Transactional
    public TeamResponseDTO updateMyTeam(String email, TeamUpdateDTO request) {
        TeamMember currentMembership = getCurrentMembership(email);
        if (currentMembership == null || currentMembership.getTeam() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No team found for current user");
        }

        if (!"LEADER".equals(currentMembership.getMemberRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only team leaders can update team name");
        }

        Team team = currentMembership.getTeam();
        String newName = request.name() == null ? "" : request.name().trim();
        if (newName.isEmpty()) {
            throw new BadRequestException("Team name is required");
        }

        projectRepository.findByTeamId(team.getId())
                .ifPresent(project -> {
                    if (project.getStatus() == ProjectStatus.ARCHIVED) {
                        throw new BadRequestException("Project name cannot be changed after archive.");
                    }
                    project.setTitle(newName);
                    projectRepository.save(project);
                });
        team.setName(newName);

        Team savedTeam = teamRepository.save(team);
        long membersCount = teamMemberRepository.countByTeamId(savedTeam.getId());

        return new TeamResponseDTO(
                savedTeam.getId(),
                savedTeam.getName(),
                savedTeam.getEstablishedOn(),
                membersCount,
                getTeamMembers(savedTeam.getId())
        );
    }

    @Transactional
    public void leaveMyTeam(String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found!"));

        TeamMember currentMembership = teamMemberRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No team found for current user"));

        UUID teamId = currentMembership.getTeam().getId();
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));
        TeamMember managedMembership = teamMemberRepository.findByTeamIdAndUserId(team.getId(), currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No team found for current user"));

        long membersCount = teamMemberRepository.countByTeamId(team.getId());
        boolean hasLeaderRole = "LEADER".equals(managedMembership.getMemberRole());
        boolean ownsTeam = team.getLeader() != null && currentUser.getId().equals(team.getLeader().getId());
        boolean isLeader = hasLeaderRole || ownsTeam;

        if (isLeader) {
            if (membersCount > 1) {
                throw new BadRequestException("Team leader cannot leave or disband the team while other members are still in the team.");
            }
            projectRepository.findByTeamId(teamId)
                    .ifPresent(project -> {
                        if (project.getStatus() != ProjectStatus.ARCHIVED) {
                            throw new BadRequestException("Cannot disband a team with an active project. Archive or resolve the project first.");
                        }
                        project.setTeam(null);
                        projectRepository.save(project);
                    });
            projectRepository.flush();
            teamMemberRepository.deleteByTeamId(teamId);
            teamMemberRepository.flush();
            Team managedTeamForDelete = teamRepository.findById(teamId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));
            teamRepository.delete(managedTeamForDelete);
            teamRepository.flush();
        } else {
            teamMemberRepository.delete(managedMembership);
        }
    }

    @Transactional
    public List<MemberResponseDTO> removeMemberFromMyTeam(String email, UUID memberId) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found!"));

        Team leaderTeam = teamRepository.findByLeaderId(currentUser.getId());
        if (leaderTeam == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only team leader can remove members.");
        }

        if (currentUser.getId().equals(memberId)) {
            throw new BadRequestException("You cannot remove yourself.");
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(leaderTeam.getId(), memberId)
                .orElseThrow(() -> new BadRequestException("User is not a member of your team."));

        if ("LEADER".equals(member.getMemberRole()) || (leaderTeam.getLeader() != null && memberId.equals(leaderTeam.getLeader().getId()))) {
            throw new BadRequestException("Team leader cannot be removed.");
        }

        if (projectRepository.existsByStudentIdAndStatusNot(memberId, ProjectStatus.ARCHIVED)) {
            throw new BadRequestException("Cannot remove member because they are linked to an active project.");
        }

        teamMemberRepository.delete(member);
        teamMemberRepository.flush();
        return getTeamMembers(leaderTeam.getId());
    }

    private TeamMember getCurrentMembership(String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found!"));

        return teamMemberRepository.findByUserId(currentUser.getId()).orElse(null);
    }

    private List<MemberResponseDTO> getTeamMembers(UUID teamId) {
        return teamMemberRepository.findAllByTeamId(teamId)
                .stream()
                .map(teamMember -> new MemberResponseDTO(
                        teamMember.getUser().getId(),
                        teamMember.getUser().getName(),
                        teamMember.getUser().getUniversityId(),
                        teamMember.getMemberRole()
                ))
                .toList();
    }
}

