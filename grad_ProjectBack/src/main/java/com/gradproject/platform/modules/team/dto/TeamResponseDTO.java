package com.gradproject.platform.modules.team.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TeamResponseDTO(
        UUID id,
        String name,
        Instant establishedOn,
        Long membersCount,
        List<MemberResponseDTO> members
) {
}

