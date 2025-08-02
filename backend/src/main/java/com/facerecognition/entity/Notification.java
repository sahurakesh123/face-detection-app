package com.facerecognition.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "face_data_id")
    private FaceData faceData;
    
    @Enumerated(EnumType.STRING)
    private NotificationType type;
    
    private String recipient;
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    private boolean sent = false;
    
    private LocalDateTime sentAt;
    
    private String errorMessage;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum NotificationType {
        EMAIL, SMS
    }
}