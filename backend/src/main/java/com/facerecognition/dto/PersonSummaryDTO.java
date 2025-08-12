package com.facerecognition.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PersonSummaryDTO {
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private LocalDateTime registrationDate;
    private Boolean isActive;
    // Simplified version without collections to avoid circular references
}
