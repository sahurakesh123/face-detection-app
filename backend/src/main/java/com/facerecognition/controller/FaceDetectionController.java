package com.facerecognition.controller;

import com.facerecognition.entity.FaceDetection;
import com.facerecognition.entity.User;
import com.facerecognition.service.FaceRecognitionService;
import com.facerecognition.service.NotificationService;
import com.facerecognition.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/face-detection")
@CrossOrigin(origins = "*")
public class FaceDetectionController {
    
    @Autowired
    private FaceRecognitionService faceRecognitionService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @PostMapping("/detect")
    public ResponseEntity<?> detectFace(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "cameraId", required = false) String cameraId,
            @RequestParam(value = "cameraLocation", required = false) String cameraLocation,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude) {
        
        try {
            // Validate image
            if (!faceRecognitionService.validateFaceImage(image)) {
                return ResponseEntity.badRequest().body(Map.of("error", "No face detected in the image"));
            }
            
            // Extract face encoding
            String faceEncoding = faceRecognitionService.extractFaceEncoding(image);
            
            // Get all users with face encodings
            List<User> usersWithFaces = userService.getUsersWithFaceEncodings();
            
            // Find matching user
            Optional<User> matchedUser = faceRecognitionService.findMatchingUser(faceEncoding, usersWithFaces);
            
            Map<String, Object> response = new HashMap<>();
            
            if (matchedUser.isPresent()) {
                User user = matchedUser.get();
                
                // Save face image
                String faceImageUrl = faceRecognitionService.saveFaceImage(image, user.getId().toString());
                
                // Create face detection record
                FaceDetection detection = new FaceDetection(
                    user, cameraId, cameraLocation, latitude, longitude, 0.85 // confidence score
                );
                detection.setFaceImageUrl(faceImageUrl);
                
                // Save detection
                userService.saveFaceDetection(detection);
                
                // Send notification
                notificationService.sendFaceDetectionNotification(detection);
                
                // Send real-time notification via WebSocket
                Map<String, Object> wsMessage = new HashMap<>();
                wsMessage.put("type", "FACE_DETECTED");
                wsMessage.put("user", Map.of(
                    "id", user.getId(),
                    "firstName", user.getFirstName(),
                    "lastName", user.getLastName(),
                    "email", user.getEmail()
                ));
                wsMessage.put("detection", Map.of(
                    "id", detection.getId(),
                    "cameraLocation", cameraLocation,
                    "latitude", latitude,
                    "longitude", longitude,
                    "detectedAt", LocalDateTime.now()
                ));
                
                messagingTemplate.convertAndSend("/topic/face-detections", wsMessage);
                
                response.put("success", true);
                response.put("matched", true);
                response.put("user", Map.of(
                    "id", user.getId(),
                    "firstName", user.getFirstName(),
                    "lastName", user.getLastName(),
                    "email", user.getEmail()
                ));
                response.put("detection", Map.of(
                    "id", detection.getId(),
                    "confidenceScore", detection.getConfidenceScore(),
                    "detectedAt", detection.getDetectedAt()
                ));
                
            } else {
                response.put("success", true);
                response.put("matched", false);
                response.put("message", "No matching user found");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error processing image: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }
    
    @PostMapping("/register-face")
    public ResponseEntity<?> registerFace(
            @RequestParam("userId") Long userId,
            @RequestParam("image") MultipartFile image) {
        
        try {
            User user = userService.getUserById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Validate image
            if (!faceRecognitionService.validateFaceImage(image)) {
                return ResponseEntity.badRequest().body(Map.of("error", "No face detected in the image"));
            }
            
            // Extract face encoding
            String faceEncoding = faceRecognitionService.extractFaceEncoding(image);
            
            // Save face image
            String faceImageUrl = faceRecognitionService.saveFaceImage(image, userId.toString());
            
            // Update user with face encoding
            user.setFaceEncoding(faceEncoding);
            user.setFaceImageUrl(faceImageUrl);
            userService.saveUser(user);
            
            // Send confirmation email
            notificationService.sendFaceRegistrationConfirmation(user);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Face registered successfully",
                "faceImageUrl", faceImageUrl
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error registering face: " + e.getMessage()));
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<?> getDetectionStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", userService.getTotalUsers());
            stats.put("usersWithFaces", userService.getUsersWithFaceEncodings().size());
            stats.put("totalDetections", userService.getTotalDetections());
            stats.put("detectionsToday", userService.getDetectionsToday());
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error getting stats: " + e.getMessage()));
        }
    }
    
    @GetMapping("/recent-detections")
    public ResponseEntity<?> getRecentDetections(@RequestParam(defaultValue = "10") int limit) {
        try {
            List<FaceDetection> recentDetections = userService.getRecentDetections(limit);
            return ResponseEntity.ok(recentDetections);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error getting recent detections: " + e.getMessage()));
        }
    }
}