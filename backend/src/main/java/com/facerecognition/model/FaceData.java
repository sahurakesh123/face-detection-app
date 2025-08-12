package com.facerecognition.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
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
    @JsonBackReference("person-facedata")
    private Person person;
    
    @Column(name = "image_path", nullable = true)
    private String imagePath;
    
    @Lob
    @Column(name = "base64_image_data", columnDefinition = "LONGTEXT")
    private String base64ImageData;
    
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