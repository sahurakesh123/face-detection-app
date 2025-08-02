package com.facerecognition.repository;

import com.facerecognition.model.FaceData;
import com.facerecognition.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaceDataRepository extends JpaRepository<FaceData, Long> {
    
    List<FaceData> findByPersonAndIsActiveTrue(Person person);
    
    List<FaceData> findByIsActiveTrue();
    
    @Query("SELECT fd FROM FaceData fd WHERE fd.person.id = :personId AND fd.isActive = true")
    List<FaceData> findActiveByPersonId(Long personId);
    
    @Query("SELECT fd FROM FaceData fd WHERE fd.confidenceScore >= :threshold AND fd.isActive = true")
    List<FaceData> findByMinConfidenceScore(Double threshold);
}