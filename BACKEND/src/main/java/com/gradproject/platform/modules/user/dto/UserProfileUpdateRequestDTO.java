package com.gradproject.platform.modules.user.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;

import java.util.LinkedHashMap;
import java.util.Map;

public class UserProfileUpdateRequestDTO {

    private String phoneNumber;
    private String specialty;
    private String officeHours;
    private final Map<String, Object> extraFields = new LinkedHashMap<>();

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public String getOfficeHours() {
        return officeHours;
    }

    public void setOfficeHours(String officeHours) {
        this.officeHours = officeHours;
    }

    public Map<String, Object> getExtraFields() {
        return extraFields;
    }

    @JsonAnySetter
    public void captureExtraField(String key, Object value) {
        extraFields.put(key, value);
    }
}
