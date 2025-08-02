package com.facerecognition.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "detection_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetectionLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id")
    private Person person;
    
    @Column(name = "detection_image_path")
    private String detectionImagePath;
    
    @Column(name = "latitude")
    private Double latitude;
    
    @Column(name = "longitude")
    private Double longitude;
    
    @Column(name = "location_address")
    private String locationAddress;
    
    @Column(name = "camera_id")
    private String cameraId;
    
    @Column(name = "camera_type")
    private String cameraType;
    
    @Column(name = "confidence_score")
    private Double confidenceScore;
    
    @Column(name = "detection_time")
    private LocalDateTime detectionTime;
    
    @Column(name = "notification_sent")
    private Boolean notificationSent = false;
    
    @Column(name = "email_sent")
    private Boolean emailSent = false;
    
    @Column(name = "sms_sent")
    private Boolean smsSent = false;
    
    @PrePersist
    protected void onCreate() {
        detectionTime = LocalDateTime.now();
    }
}