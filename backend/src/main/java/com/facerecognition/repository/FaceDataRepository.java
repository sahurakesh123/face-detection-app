package com.facerecognition.repository;

import com.facerecognition.entity.FaceData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FaceDataRepository extends JpaRepository<FaceData, Long> {
    
    List<FaceData> findByUserIdOrderByCapturedAtDesc(Long userId);
    
    List<FaceData> findByIsMatchedTrueOrderByMatchedAtDesc();
    
    @Query("SELECT f FROM FaceData f WHERE f.capturedAt >= ?1")
    List<FaceData> findRecentCaptures(LocalDateTime since);
    
    List<FaceData> findByCameraSource(String cameraSource);
    
    @Query("SELECT f FROM FaceData f WHERE f.latitude BETWEEN ?1 AND ?2 AND f.longitude BETWEEN ?3 AND ?4")
    List<FaceData> findByLocationRange(Double minLat, Double maxLat, Double minLng, Double maxLng);
}