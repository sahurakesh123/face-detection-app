package com.facerecognition.dto;

import lombok.Data;

@Data
public class FaceCaptureDto {
    
    private String faceImage; // Base64 encoded image
    private String faceEncoding; // Face encoding data
    private Double confidence;
    private String cameraSource; // "browser", "laptop", "atm", "cctv"
    private Double latitude;
    private Double longitude;
    private String location; // Human readable location
}