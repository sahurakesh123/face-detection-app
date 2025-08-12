package com.facerecognition.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class DetectionRequest {
    @JsonProperty("base64Image")
    private String base64Image;
    private Double latitude;
    private Double longitude;
    private String cameraId;
    private String cameraType;
}
