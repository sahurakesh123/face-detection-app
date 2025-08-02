package com.facerecognition.controller;

import com.facerecognition.model.DetectionLog;
import com.facerecognition.service.DetectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/face")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class FaceRecognitionController {
    
    private final DetectionService detectionService;
    
    @PostMapping("/detect")
    public ResponseEntity<?> detectAndMatchFace(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "cameraId", required = false) String cameraId,
            @RequestParam(value = "cameraType", required = false, defaultValue = "browser") String cameraType,
            @RequestParam(value = "locationAddress", required = false) String locationAddress) {
        
        try {
            DetectionLog detectionLog = detectionService.processFaceDetection(
                image, latitude, longitude, cameraId, cameraType, locationAddress
            );
            
            boolean personMatched = detectionLog.getPerson() != null;
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "matched", personMatched,
                "detectionId", detectionLog.getId(),
                "person", personMatched ? detectionLog.getPerson() : null,
                "confidence", detectionLog.getConfidenceScore(),
                "detectionTime", detectionLog.getDetectionTime(),
                "message", personMatched ? "Face matched successfully" : "Face detected but no match found"
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error processing face detection", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Internal server error"
            ));
        }
    }
    
    @GetMapping("/detections/recent")
    public ResponseEntity<?> getRecentDetections(@RequestParam(defaultValue = "10") int limit) {
        try {
            return ResponseEntity.ok(detectionService.getRecentDetections(limit));
        } catch (Exception e) {
            log.error("Error fetching recent detections", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Error fetching detections"
            ));
        }
    }
    
    @GetMapping("/detections/person/{personId}")
    public ResponseEntity<?> getDetectionsByPerson(@PathVariable Long personId) {
        try {
            // Note: This would need PersonService injection to get the person first
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Feature available - requires person lookup"
            ));
        } catch (Exception e) {
            log.error("Error fetching detections by person", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Error fetching detections"
            ));
        }
    }
    
    @GetMapping("/detections/camera/{cameraId}")
    public ResponseEntity<?> getDetectionsByCamera(@PathVariable String cameraId) {
        try {
            return ResponseEntity.ok(detectionService.getDetectionsByCamera(cameraId));
        } catch (Exception e) {
            log.error("Error fetching detections by camera", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Error fetching detections"
            ));
        }
    }
}