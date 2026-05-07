package com.gradproject.platform.modules.user;

import java.util.UUID;

public class StudentDTO {

    private UUID id;
    private String name;
    private String firstName;
    private String lastName;
    private String email;
    private String universityId;
    private boolean hasTeam;
    private boolean eligible;
    private String reason;

    public StudentDTO(UUID id, String name, String firstName, String lastName, String email, String universityId) {
        this.id = id;
        this.name = name;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.universityId = universityId;
        this.hasTeam = false;
        this.eligible = true;
        this.reason = null;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getUniversityId() { return universityId; }
    public boolean isHasTeam() { return hasTeam; }
    public boolean isEligible() { return eligible; }
    public String getStudentId() { return universityId; }
    public String getReason() { return reason; }

    public void setHasTeam(boolean hasTeam) { this.hasTeam = hasTeam; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }
    public void setReason(String reason) { this.reason = reason; }

}


