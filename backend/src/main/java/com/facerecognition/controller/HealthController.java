package com.facerecognition.controller;

import com.facerecognition.service.FaceRecognitionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
@RequiredArgsConstructor
@Slf4j
public class HealthController {
    
    private final FaceRecognitionService faceRecognitionService;
    
    @GetMapping("/face-recognition")
    public ResponseEntity<Map<String, Object>> checkFaceRecognitionHealth() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            boolean isInitialized = faceRecognitionService.isInitialized();
            String status = faceRecognitionService.getInitializationStatus();
            
            health.put("initialized", isInitialized);
            health.put("status", status);
            health.put("timestamp", System.currentTimeMillis());
            
            if (isInitialized) {
                health.put("message", "Face recognition service is healthy");
                return ResponseEntity.ok(health);
            } else {
                health.put("message", "Face recognition service is not properly initialized");
                return ResponseEntity.status(503).body(health);
            }
        } catch (Exception e) {
            log.error("Error checking face recognition health", e);
            health.put("initialized", false);
            health.put("status", "Error: " + e.getMessage());
            health.put("message", "Face recognition service health check failed");
            health.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.status(503).body(health);
        }
    }
    
    @GetMapping("/system")
    public ResponseEntity<Map<String, Object>> checkSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        
        // Check face recognition service
        boolean faceRecognitionHealthy = faceRecognitionService.isInitialized();
        
        health.put("faceRecognition", Map.of(
            "healthy", faceRecognitionHealthy,
            "status", faceRecognitionService.getInitializationStatus()
        ));
        
        // Overall system health
        boolean overallHealthy = faceRecognitionHealthy;
        health.put("overall", overallHealthy ? "healthy" : "unhealthy");
        health.put("timestamp", System.currentTimeMillis());
        
        return overallHealthy ? 
            ResponseEntity.ok(health) : 
            ResponseEntity.status(503).body(health);
    }
}
