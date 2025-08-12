package com.facerecognition.dto;

import lombok.Data;

@Data
public class PersonRegistrationRequest {
    private String name;
    private String email;
    private String base64Image;
}
