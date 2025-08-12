package com.facerecognition.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PersonDTO {
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private String address;
    private LocalDateTime dateOfBirth;
    private LocalDateTime registrationDate;
    private Boolean isActive;
    private List<FaceDataDTO> faceDataList;
    private List<DetectionLogDTO> detectionLogs;
}
