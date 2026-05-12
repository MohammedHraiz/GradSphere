package com.gradproject.platform.modules.team;

import com.gradproject.platform.exception.BadRequestException;

public final class TeamRules {

    public static final int MAX_MEMBERS = 5;
    public static final String TEAM_FULL_MESSAGE = "Team is already full. Maximum team size is 5 members.";

    private TeamRules() {
    }

    public static int normalizeRequestedMaxSize(Integer requestedMaxSize) {
        if (requestedMaxSize != null && requestedMaxSize > MAX_MEMBERS) {
            throw new BadRequestException("Team maximum size is 5 members.");
        }
        return MAX_MEMBERS;
    }
}
