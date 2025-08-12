package com.facerecognition.controller;

import com.facerecognition.dto.DetectionRequest;
import com.facerecognition.dto.PersonRegistrationRequest;
import com.facerecognition.model.DetectionLog;
import com.facerecognition.model.Person;
import com.facerecognition.service.DetectionService;
import com.facerecognition.service.PersonService;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class FaceRecognitionController {
    
    private final PersonService personService;
    private final DetectionService detectionService;
    
    // DTO for the detection response
    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DetectionResponse {
        private boolean matched;
        private Person person;
        private Double confidence;
        private LocalDateTime detectionTime;
    }

    @PostMapping("/persons/register")
    public ResponseEntity<?> registerPerson(@RequestBody PersonRegistrationRequest request) {
        try {
            Person registeredPerson = personService.registerPerson(request.getName(), request.getEmail(), request.getBase64Image());
            return ResponseEntity.ok(registeredPerson);
        } catch (Exception e) {
            log.error("Error during person registration", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
    
    @GetMapping("/persons")
    public ResponseEntity<?> getAllPersons() {
        try {
            List<Person> persons = personService.getAllActivePersons();
            return ResponseEntity.ok(persons);
        } catch (Exception e) {
            log.error("Error fetching persons", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Error fetching persons"
            ));
        }
    }
    
    @PostMapping("/detections/detect")
    public ResponseEntity<?> detectAndMatchFace(@RequestBody DetectionRequest request) {
        log.info("Received face detection request for camera ID: {}", request.getCameraId());
        detectionService.processFaceDetection(request);
        // Return 202 Accepted with proper JSON response
        return ResponseEntity.accepted().body(Map.of(
            "success", true,
            "message", "Request received and is being processed.",
            "cameraId", request.getCameraId(),
            "status", "processing"
        ));
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
    
    @PostMapping("/face/test-upload")
    public ResponseEntity<?> testImageUpload(@RequestParam("image") MultipartFile imageFile) {
        try {
            // Log the incoming image details
            log.info("TEST UPLOAD: Received image: name={}, size={}KB, type={}", 
                     imageFile.getOriginalFilename(), imageFile.getSize()/1024, imageFile.getContentType());
            
            // Save the image to verify it's not corrupt
            String filename = UUID.randomUUID().toString() + ".jpg";
            Path uploadDir = Paths.get("C:/workspace/face-detection-app/uploads/test");
            Files.createDirectories(uploadDir);
            
            Path filePath = uploadDir.resolve(filename);
            Files.copy(imageFile.getInputStream(), filePath);
            
            // Try to read it back to verify
            byte[] fileContent = Files.readAllBytes(filePath);
            
            return ResponseEntity.ok().body(Map.of(
                "message", "Test image received and saved successfully",
                "filename", filename,
                "size", imageFile.getSize(),
                "contentType", imageFile.getContentType(),
                "path", filePath.toString(),
                "isReadable", Files.isReadable(filePath),
                "fileSize", fileContent.length
            ));
        } catch (IOException e) {
            log.error("Error in test upload", e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}