package com.gradproject.platform.modules.team;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.team.dto.CreateTeamRequest;
import com.gradproject.platform.modules.team.dto.MemberResponseDTO;
import com.gradproject.platform.modules.team.dto.TeamResponseDTO;
import com.gradproject.platform.modules.team.dto.TeamUpdateDTO;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.task.TaskRepository;
import com.gradproject.platform.modules.task.TaskStatus;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TeamService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public TeamService(UserRepository userRepository, TeamRepository teamRepository, TeamMemberRepository teamMemberRepository, ProjectRepository projectRepository, TaskRepository taskRepository) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional
    public TeamResponseDTO createTeam(String email, CreateTeamRequest request) {
        User leader = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found!"));

        if (teamMemberRepository.existsByUserId(leader.getId())) {
            throw new BadRequestException("You already belong to a team");
        }

        String teamName = request == null || request.name() == null ? "" : request.name().trim();
        if (!StringUtils.hasText(teamName)) {
            throw new BadRequestException("Team name is required");
        }
        if (teamName.length() < 3) {
            throw new BadRequestException("Team name must be at least 3 characters.");
        }
        String projectDomain = request == null || request.projectDomain() == null ? "" : request.projectDomain().trim();
        if (!StringUtils.hasText(projectDomain)) {
            throw new BadRequestException("Project category is required");
        }

        Team team = new Team();
        team.setName(teamName);
        team.setProjectDomain(projectDomain);
        team.setMaxSize(TeamRules.normalizeRequestedMaxSize(request != null ? request.maxSize() : null));
        team.setLeader(leader);

        Team savedTeam = teamRepository.save(team);

        TeamMember leaderMember = TeamMember.builder()
                .team(savedTeam)
                .user(leader)
                .memberRole("LEADER")
                .membershipStatus("ACTIVE")
                .joinedAt(Instant.now())
                .build();
        teamMemberRepository.save(leaderMember);

        return buildTeamResponse(savedTeam);
    }

    @Transactional(readOnly = true)
    public Optional<TeamResponseDTO> getMyTeam(String email) {
        TeamMember currentMembership = getCurrentMembership(email);
        if (currentMembership == null || currentMembership.getTeam() == null) {
            return Optional.empty();
        }

        return Optional.of(buildTeamResponse(currentMembership.getTeam()));
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
        Project project = projectRepository.findByTeamId(team.getId()).orElse(null);
        boolean hasChanges = false;

        if (request != null && request.name() != null) {
            String newName = request.name().trim();
            if (!StringUtils.hasText(newName)) {
                throw new BadRequestException("Team name is required");
            }
            if (newName.length() < 3) {
                throw new BadRequestException("Team name must be at least 3 characters.");
            }
            if (project != null && project.getStatus() == ProjectStatus.ARCHIVED) {
                throw new BadRequestException("Project name cannot be changed after archive.");
            }

            team.setName(newName);
            if (project != null) {
                project.setTitle(newName);
            }
            hasChanges = true;
        }

        if (request != null && request.projectDomain() != null) {
            String newProjectDomain = request.projectDomain().trim();
            if (!StringUtils.hasText(newProjectDomain)) {
                throw new BadRequestException("Project category is required");
            }
            if (project != null && project.getStatus() == ProjectStatus.ARCHIVED) {
                throw new BadRequestException("Project category cannot be changed after archive.");
            }

            team.setProjectDomain(newProjectDomain);
            if (project != null) {
                project.setProjectDomain(newProjectDomain);
            }
            hasChanges = true;
        }

        if (!hasChanges) {
            throw new BadRequestException("At least one team field must be provided.");
        }

        if (project != null) {
            projectRepository.save(project);
        }

        Team savedTeam = teamRepository.save(team);
        return buildTeamResponse(savedTeam);
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
                        teamMember.getUser().getEmail(),
                        teamMember.getUser().getUniversityId(),
                        teamMember.getUser().getDepartment() != null ? teamMember.getUser().getDepartment().name() : null,
                        teamMember.getUser().getProfilePhotoUrl(),
                        teamMember.getMemberRole()
                ))
                .toList();
    }

    private TeamResponseDTO buildTeamResponse(Team team) {
        long membersCount = teamMemberRepository.countByTeamId(team.getId());
        TeamTaskStats taskStats = calculateTaskStats(team.getId());

        return new TeamResponseDTO(
                team.getId(),
                team.getName(),
                team.getProjectDomain(),
                team.getEstablishedOn(),
                membersCount,
                TeamRules.MAX_MEMBERS,
                taskStats.totalTasks(),
                taskStats.completedTasks(),
                taskStats.completionRate(),
                getTeamMembers(team.getId())
        );
    }

    private TeamTaskStats calculateTaskStats(UUID teamId) {
        Optional<Project> project = projectRepository.findByTeamId(teamId);
        if (project.isEmpty() || project.get().getId() == null) {
            return new TeamTaskStats(0L, 0L, 0);
        }

        UUID projectId = project.get().getId();
        long totalTasks = taskRepository.countByProjectId(projectId);
        long completedTasks = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.COMPLETED);
        int completionRate = totalTasks == 0 ? 0 : (int) ((completedTasks * 100) / totalTasks);

        return new TeamTaskStats(totalTasks, completedTasks, completionRate);
    }

    private record TeamTaskStats(long totalTasks, long completedTasks, int completionRate) {
    }
}

