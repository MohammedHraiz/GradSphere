package com.gradproject.platform.modules.team.dto;

import com.gradproject.platform.modules.team.TeamRules;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TeamResponseDTO(
        UUID id,
        String name,
        String projectDomain,
        Instant establishedOn,
        Long membersCount,
        Integer maxMembers,
        Long totalTasks,
        Long completedTasks,
        Integer completionRate,
        List<MemberResponseDTO> members
) {
    public TeamResponseDTO(UUID id, String name, String projectDomain, Instant establishedOn, Long membersCount, List<MemberResponseDTO> members) {
        this(id, name, projectDomain, establishedOn, membersCount, TeamRules.MAX_MEMBERS, 0L, 0L, 0, members);
    }
}
