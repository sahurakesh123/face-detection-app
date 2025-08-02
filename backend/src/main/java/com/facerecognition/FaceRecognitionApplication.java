package com.facerecognition;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class FaceRecognitionApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(FaceRecognitionApplication.class, args);
    }
}