package com.facerecognition.service;

import com.facerecognition.model.DetectionLog;
import com.facerecognition.model.Person;
import com.facerecognition.repository.DetectionLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DetectionService {
    
    private final FaceRecognitionService faceRecognitionService;
    private final DetectionLogRepository detectionLogRepository;
    private final EmailService emailService;
    private final SmsService smsService;
    
    @Transactional
    public DetectionLog processFaceDetection(MultipartFile imageFile, Double latitude, Double longitude, 
                                           String cameraId, String cameraType, String locationAddress) throws Exception {
        
        // Validate image
        if (!faceRecognitionService.validateImage(imageFile)) {
            throw new IllegalArgumentException("Invalid image format");
        }
        
        // Save detection image
        String imagePath = faceRecognitionService.saveImage(imageFile, "detection_" + System.currentTimeMillis());
        
        // Try to match face
        Person matchedPerson = faceRecognitionService.matchFace(imagePath, latitude, longitude);
        
        // Create detection log
        DetectionLog detectionLog = new DetectionLog();
        detectionLog.setPerson(matchedPerson);
        detectionLog.setDetectionImagePath(imagePath);
        detectionLog.setLatitude(latitude);
        detectionLog.setLongitude(longitude);
        detectionLog.setLocationAddress(locationAddress);
        detectionLog.setCameraId(cameraId);
        detectionLog.setCameraType(cameraType);
        detectionLog.setConfidenceScore(matchedPerson != null ? 0.8 : 0.0); // Simplified confidence
        
        DetectionLog savedLog = detectionLogRepository.save(detectionLog);
        
        // Send notifications if person is matched
        if (matchedPerson != null) {
            sendNotifications(matchedPerson, savedLog);
        }
        
        return savedLog;
    }
    
    @Async
    public void sendNotifications(Person person, DetectionLog detectionLog) {
        try {
            // Send email notification
            emailService.sendFaceDetectionNotification(person, detectionLog);
            
            // Send SMS notification if phone number is available
            if (person.getPhoneNumber() != null && !person.getPhoneNumber().trim().isEmpty()) {
                smsService.sendFaceDetectionSms(person, detectionLog);
            }
            
            // Update notification status
            updateNotificationStatus(detectionLog.getId(), true, true);
            
        } catch (Exception e) {
            log.error("Failed to send notifications for detection: {}", detectionLog.getId(), e);
        }
    }
    
    @Transactional
    public void updateNotificationStatus(Long detectionId, boolean emailSent, boolean smsSent) {
        detectionLogRepository.findById(detectionId).ifPresent(log -> {
            log.setEmailSent(emailSent);
            log.setSmsSent(smsSent);
            log.setNotificationSent(emailSent || smsSent);
            detectionLogRepository.save(log);
        });
    }
    
    public List<DetectionLog> getRecentDetections(int limit) {
        return detectionLogRepository.findAll()
            .stream()
            .sorted((a, b) -> b.getDetectionTime().compareTo(a.getDetectionTime()))
            .limit(limit)
            .toList();
    }
    
    public List<DetectionLog> getDetectionsByPerson(Person person) {
        return detectionLogRepository.findByPersonOrderByDetectionTimeDesc(person);
    }
    
    public List<DetectionLog> getDetectionsByCamera(String cameraId) {
        return detectionLogRepository.findByCameraIdOrderByDetectionTimeDesc(cameraId);
    }
}