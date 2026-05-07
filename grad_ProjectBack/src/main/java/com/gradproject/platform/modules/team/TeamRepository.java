package com.gradproject.platform.modules.team;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

// JpaRepository gives us save(), findAll(), findById(), etc. automatically!
public interface TeamRepository extends JpaRepository<Team, UUID> {

    // We can even write custom queries just by naming the method correctly!
    Team findByLeaderId(UUID leaderId);
}