package com.facerecognition.model;

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
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;
    
    @Column(name = "image_path", nullable = false)
    private String imagePath;
    
    @Lob
    @Column(name = "face_encoding", columnDefinition = "LONGTEXT")
    private String faceEncoding;
    
    @Column(name = "confidence_score")
    private Double confidenceScore;
    
    @Column(name = "created_date")
    private LocalDateTime createdDate;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
    }
}