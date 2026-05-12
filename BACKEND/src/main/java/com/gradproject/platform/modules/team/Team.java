package com.gradproject.platform.modules.team;

import com.gradproject.platform.core.BaseEntity;
import com.gradproject.platform.modules.user.User;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "teams")
public class Team extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "max_size", nullable = false)
    private Integer maxSize = TeamRules.MAX_MEMBERS;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leader_id", nullable = false)
    private User leader;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id")
    private User supervisor;

    public Team() {}

    // --- GETTERS & SETTERS ---

    public UUID getId() { return id; }

    @JsonProperty("teamName") // Tells React this is 'teamName'
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getMaxSize() { return maxSize; }
    public void setMaxSize(Integer maxSize) { this.maxSize = TeamRules.normalizeRequestedMaxSize(maxSize); }

    // We keep this for JPA internal use
    public User getLeader() { return leader; }
    public void setLeader(User leader) { this.leader = leader; }

    public User getSupervisor() { return supervisor; }
    public void setSupervisor(User supervisor) { this.supervisor = supervisor; }

    // --- VIRTUAL GETTERS FOR FRONTEND ---

    @JsonProperty("teamLeader")
    public String getLeaderName() {
        return (leader != null) ? leader.getName() : "No Leader";
    }

    @JsonProperty("establishedOn")
    public java.time.Instant getEstablishedOn() {
        return super.getCreatedAt();
    }


}
