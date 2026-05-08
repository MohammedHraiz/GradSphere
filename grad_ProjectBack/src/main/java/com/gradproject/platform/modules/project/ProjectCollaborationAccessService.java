package com.gradproject.platform.modules.project;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ProjectCollaborationAccessService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TeamMemberRepository teamMemberRepository;

    public ProjectCollaborationAccessService(UserRepository userRepository,
                                             ProjectRepository projectRepository,
                                             TeamMemberRepository teamMemberRepository) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.teamMemberRepository = teamMemberRepository;
    }

    public User requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new BadRequestException("Authenticated user not found.");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return userRepository.findById(user.getId())
                    .orElseThrow(() -> new BadRequestException("Authenticated user not found."));
        }
        if (principal instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new BadRequestException("Authenticated user not found."));
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new BadRequestException("Authenticated user not found."));
    }

    public Project requireProjectViewAccess(UUID projectId) {
        User currentUser = requireCurrentUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BadRequestException("Project not found."));
        validateViewAccess(project, currentUser);
        return project;
    }

    public Project requireProjectManageAccess(UUID projectId) {
        User currentUser = requireCurrentUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BadRequestException("Project not found."));
        validateManageAccess(project, currentUser);
        return project;
    }

    public User requireAssignableProjectMember(Project project, UUID userId) {
        if (userId == null) {
            return null;
        }
        User assignee = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("Assigned user not found."));
        if (assignee.getRole() != UserRole.ROLE_STUDENT) {
            throw new BadRequestException("Tasks can only be assigned to project students.");
        }
        Team team = project.getTeam();
        boolean isLeader = team != null
                && team.getLeader() != null
                && assignee.getId().equals(team.getLeader().getId());
        boolean isTeamMember = team != null
                && teamMemberRepository.findByTeamIdAndUserId(team.getId(), assignee.getId()).isPresent();
        if (team == null || (!isLeader && !isTeamMember)) {
            throw new BadRequestException("Assigned user is not a member of this project team.");
        }
        return assignee;
    }

    public List<User> getProjectStudents(Project project) {
        if (project.getTeam() == null) {
            return List.of();
        }
        Map<UUID, User> users = new LinkedHashMap<>();
        if (project.getTeam().getLeader() != null && project.getTeam().getLeader().getRole() == UserRole.ROLE_STUDENT) {
            users.put(project.getTeam().getLeader().getId(), project.getTeam().getLeader());
        }
        teamMemberRepository.findAllByTeamId(project.getTeam().getId()).forEach(member -> {
            User memberUser = member.getUser();
            if (memberUser != null && memberUser.getRole() == UserRole.ROLE_STUDENT) {
                users.putIfAbsent(memberUser.getId(), memberUser);
            }
        });
        return new ArrayList<>(users.values());
    }

    public boolean canManageProject(Project project, User currentUser) {
        if (project == null || currentUser == null) {
            return false;
        }
        if (currentUser.getRole() == UserRole.ROLE_SUPERVISOR
                && project.getSupervisor() != null
                && currentUser.getId().equals(project.getSupervisor().getId())) {
            return true;
        }
        return currentUser.getRole() == UserRole.ROLE_STUDENT && isTeamLeader(project, currentUser);
    }

    public boolean isProjectStudent(Project project, User currentUser) {
        if (project == null || currentUser == null || currentUser.getRole() != UserRole.ROLE_STUDENT) {
            return false;
        }
        if (project.getTeam() == null) {
            return false;
        }
        if (project.getTeam().getLeader() != null && currentUser.getId().equals(project.getTeam().getLeader().getId())) {
            return true;
        }
        return teamMemberRepository.findByTeamIdAndUserId(project.getTeam().getId(), currentUser.getId()).isPresent();
    }

    private void validateViewAccess(Project project, User currentUser) {
        if (currentUser.getRole() == UserRole.ROLE_ADMIN || currentUser.getRole() == UserRole.ROLE_DEAN_OFFICE) {
            return;
        }
        if (currentUser.getRole() == UserRole.ROLE_SUPERVISOR
                && project.getSupervisor() != null
                && currentUser.getId().equals(project.getSupervisor().getId())) {
            return;
        }
        if (currentUser.getRole() == UserRole.ROLE_STUDENT
                && isProjectStudent(project, currentUser)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to access this project workflow.");
    }

    private void validateManageAccess(Project project, User currentUser) {
        if (canManageProject(project, currentUser)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the team leader or assigned supervisor can manage project workflow.");
    }

    private boolean isTeamLeader(Project project, User currentUser) {
        if (project.getTeam() == null) {
            return false;
        }
        Team team = project.getTeam();
        if (team.getLeader() != null && currentUser.getId().equals(team.getLeader().getId())) {
            return true;
        }
        return teamMemberRepository.findByTeamIdAndUserId(team.getId(), currentUser.getId())
                .map(TeamMember::getMemberRole)
                .map("LEADER"::equalsIgnoreCase)
                .orElse(false);
    }
}
