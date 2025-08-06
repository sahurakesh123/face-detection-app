package com.facerecognition.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceDataDTO {
    private Long id;
    private String imagePath;
    private Double confidenceScore;
    private LocalDateTime createdDate;
    private Boolean isActive;
    // Note: We don't include the person reference to avoid circular references
}
