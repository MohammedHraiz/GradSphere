package com.gradproject.platform.modules.invitation.dto;

import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.user.User;

public class InviteEligibility {

    private final boolean eligible;
    private final String reason;
    private final User receiver;
    private final Team team;

    private InviteEligibility(boolean eligible, String reason, User receiver, Team team) {
        this.eligible = eligible;
        this.reason = reason;
        this.receiver = receiver;
        this.team = team;
    }

    public static InviteEligibility eligible(User receiver, Team team) {
        return new InviteEligibility(true, null, receiver, team);
    }

    public static InviteEligibility ineligible(String reason, User receiver, Team team) {
        return new InviteEligibility(false, reason, receiver, team);
    }

    public boolean isEligible() {
        return eligible;
    }

    public String getReason() {
        return reason;
    }

    public User getReceiver() {
        return receiver;
    }

    public Team getTeam() {
        return team;
    }
}
