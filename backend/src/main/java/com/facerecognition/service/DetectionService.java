package com.facerecognition.service;

import com.facerecognition.dto.DetectionRequest;
import com.facerecognition.model.DetectionLog;
import com.facerecognition.model.Person;
import com.facerecognition.repository.DetectionLogRepository;
import com.facerecognition.service.EmailService;
import com.facerecognition.service.FaceRecognitionService;
import com.facerecognition.service.GeocodingService;
import com.facerecognition.service.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DetectionService {

    private final FaceRecognitionService faceRecognitionService;
    private final DetectionLogRepository detectionLogRepository;
    private final EmailService emailService;
    private final SmsService smsService;
    private final SimpMessagingTemplate messagingTemplate;
    private final GeocodingService geocodingService;

    @Async
    @Transactional
    public void processFaceDetection(DetectionRequest request) {
        log.info("Starting asynchronous face detection process for camera: {}", request.getCameraId());
        try {
            // Check if face recognition service is properly initialized
            if (!faceRecognitionService.isInitialized()) {
                String status = faceRecognitionService.getInitializationStatus();
                log.error("Face recognition service not initialized: {}", status);
                throw new IllegalStateException("Face recognition service is not properly initialized: " + status);
            }

            // Save detection image from Base64 string
            String imagePath = faceRecognitionService.saveImageFromBase64(request.getBase64Image(), "detection_" + System.currentTimeMillis());
            log.info("Detection image saved to: {}", imagePath);

            // Try to match face - location data should not be part of matching logic
            Person matchedPerson = faceRecognitionService.matchFace(imagePath);
            double confidence = 0.0;
            if (matchedPerson != null) {
                // If a person is matched, we need to get the confidence score.
                // This requires a small refactor of matchFace to return a match result object.
                // For now, we'll re-calculate for simplicity, but this is inefficient.
                String capturedEncoding = faceRecognitionService.extractFaceEncoding(imagePath);
                confidence = faceRecognitionService.getBestMatchConfidence(capturedEncoding);
            }

            String locationAddress = geocodingService.getAddressFromCoordinates(request.getLatitude(), request.getLongitude());

            // Create detection log
            DetectionLog detectionLog = new DetectionLog();
            detectionLog.setPerson(matchedPerson);
            detectionLog.setDetectionImagePath(imagePath);
            detectionLog.setLatitude(request.getLatitude());
            detectionLog.setLongitude(request.getLongitude());
            detectionLog.setLocationAddress(locationAddress);
            detectionLog.setCameraId(request.getCameraId());
            detectionLog.setCameraType(request.getCameraType());
            detectionLog.setConfidenceScore(confidence);

            DetectionLog savedLog = detectionLogRepository.save(detectionLog);
            log.info("Detection log saved with ID: {}", savedLog.getId());

            // Send notifications if person is matched
            if (matchedPerson != null) {
                sendNotifications(matchedPerson, savedLog);
            }

            // Send the result back to the client via WebSocket
            // The topic includes the camera ID to ensure the message goes to the correct client
            String destination = "/topic/detection-results/" + request.getCameraId();
            messagingTemplate.convertAndSend(destination, savedLog);
            log.info("Sent detection result to WebSocket destination: {}", destination);

        } catch (Exception e) {
            log.error("Error during asynchronous face detection process", e);
            // Optionally, send an error message back via WebSocket
            String errorDestination = "/topic/detection-error/" + request.getCameraId();
            messagingTemplate.convertAndSend(errorDestination, "Error processing image: " + e.getMessage());
        }
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