package com.facerecognition.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "face_detections")
public class FaceDetection {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(name = "camera_id")
    private String cameraId;
    
    @Column(name = "camera_location")
    private String cameraLocation;
    
    @Column(name = "latitude")
    private Double latitude;
    
    @Column(name = "longitude")
    private Double longitude;
    
    @Column(name = "confidence_score")
    private Double confidenceScore;
    
    @Column(name = "face_image_url")
    private String faceImageUrl;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "detection_status")
    private DetectionStatus status = DetectionStatus.DETECTED;
    
    @Column(name = "notification_sent")
    private boolean notificationSent = false;
    
    @Column(name = "notification_sent_at")
    private LocalDateTime notificationSentAt;
    
    @CreationTimestamp
    @Column(name = "detected_at", updatable = false)
    private LocalDateTime detectedAt;
    
    @Column(name = "additional_notes", columnDefinition = "TEXT")
    private String additionalNotes;
    
    public enum DetectionStatus {
        DETECTED, VERIFIED, FALSE_POSITIVE, UNKNOWN
    }
    
    // Constructors
    public FaceDetection() {}
    
    public FaceDetection(User user, String cameraId, String cameraLocation, 
                        Double latitude, Double longitude, Double confidenceScore) {
        this.user = user;
        this.cameraId = cameraId;
        this.cameraLocation = cameraLocation;
        this.latitude = latitude;
        this.longitude = longitude;
        this.confidenceScore = confidenceScore;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public String getCameraId() {
        return cameraId;
    }
    
    public void setCameraId(String cameraId) {
        this.cameraId = cameraId;
    }
    
    public String getCameraLocation() {
        return cameraLocation;
    }
    
    public void setCameraLocation(String cameraLocation) {
        this.cameraLocation = cameraLocation;
    }
    
    public Double getLatitude() {
        return latitude;
    }
    
    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }
    
    public Double getLongitude() {
        return longitude;
    }
    
    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
    
    public Double getConfidenceScore() {
        return confidenceScore;
    }
    
    public void setConfidenceScore(Double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }
    
    public String getFaceImageUrl() {
        return faceImageUrl;
    }
    
    public void setFaceImageUrl(String faceImageUrl) {
        this.faceImageUrl = faceImageUrl;
    }
    
    public DetectionStatus getStatus() {
        return status;
    }
    
    public void setStatus(DetectionStatus status) {
        this.status = status;
    }
    
    public boolean isNotificationSent() {
        return notificationSent;
    }
    
    public void setNotificationSent(boolean notificationSent) {
        this.notificationSent = notificationSent;
    }
    
    public LocalDateTime getNotificationSentAt() {
        return notificationSentAt;
    }
    
    public void setNotificationSentAt(LocalDateTime notificationSentAt) {
        this.notificationSentAt = notificationSentAt;
    }
    
    public LocalDateTime getDetectedAt() {
        return detectedAt;
    }
    
    public void setDetectedAt(LocalDateTime detectedAt) {
        this.detectedAt = detectedAt;
    }
    
    public String getAdditionalNotes() {
        return additionalNotes;
    }
    
    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }
    
    @Override
    public String toString() {
        return "FaceDetection{" +
                "id=" + id +
                ", cameraId='" + cameraId + '\'' +
                ", cameraLocation='" + cameraLocation + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", confidenceScore=" + confidenceScore +
                ", status=" + status +
                ", detectedAt=" + detectedAt +
                '}';
    }
}