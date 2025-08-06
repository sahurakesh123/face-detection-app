package com.facerecognition.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetectionLogDTO {
    private Long id;
    private String detectionImagePath;
    private Double latitude;
    private Double longitude;
    private String locationAddress;
    private String cameraId;
    private String cameraType;
    private Double confidenceScore;
    private LocalDateTime detectionTime;
    private Boolean notificationSent;
    private Boolean emailSent;
    private Boolean smsSent;
    // Note: We don't include the person reference to avoid circular references
}
