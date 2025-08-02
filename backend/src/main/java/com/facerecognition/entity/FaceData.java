package com.facerecognition.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "face_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceData {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(columnDefinition = "TEXT")
    private String faceEncoding;
    
    @Column(columnDefinition = "TEXT")
    private String faceImage;
    
    private Double confidence;
    
    private String cameraSource;
    
    private Double latitude;
    
    private Double longitude;
    
    private String location;
    
    private LocalDateTime capturedAt;
    
    private boolean isMatched = false;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matched_user_id")
    private User matchedUser;
    
    private LocalDateTime matchedAt;
    
    @PrePersist
    protected void onCreate() {
        capturedAt = LocalDateTime.now();
    }
}