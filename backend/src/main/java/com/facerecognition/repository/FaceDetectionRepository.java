package com.facerecognition.repository;

import com.facerecognition.entity.FaceDetection;
import com.facerecognition.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FaceDetectionRepository extends JpaRepository<FaceDetection, Long> {
    
    List<FaceDetection> findByUser(User user);
    
    List<FaceDetection> findByUserOrderByDetectedAtDesc(User user);
    
    List<FaceDetection> findByCameraId(String cameraId);
    
    List<FaceDetection> findByCameraLocation(String cameraLocation);
    
    List<FaceDetection> findByStatus(FaceDetection.DetectionStatus status);
    
    List<FaceDetection> findByNotificationSent(boolean notificationSent);
    
    List<FaceDetection> findByDetectedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    List<FaceDetection> findByUserAndDetectedAtBetween(User user, LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT fd FROM FaceDetection fd WHERE fd.latitude BETWEEN :minLat AND :maxLat AND fd.longitude BETWEEN :minLng AND :maxLng")
    List<FaceDetection> findByLocationRange(@Param("minLat") Double minLat, @Param("maxLat") Double maxLat,
                                           @Param("minLng") Double minLng, @Param("maxLng") Double maxLng);
    
    @Query("SELECT fd FROM FaceDetection fd WHERE fd.confidenceScore >= :minConfidence")
    List<FaceDetection> findByMinConfidence(@Param("minConfidence") Double minConfidence);
    
    @Query("SELECT fd FROM FaceDetection fd WHERE fd.user.id = :userId ORDER BY fd.detectedAt DESC")
    Page<FaceDetection> findByUserIdOrderByDetectedAtDesc(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT COUNT(fd) FROM FaceDetection fd WHERE fd.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(fd) FROM FaceDetection fd WHERE fd.detectedAt >= :since")
    long countDetectionsSince(@Param("since") LocalDateTime since);
    
    @Query("SELECT fd FROM FaceDetection fd WHERE fd.notificationSent = false AND fd.status = 'DETECTED'")
    List<FaceDetection> findPendingNotifications();
    
    @Query("SELECT fd FROM FaceDetection fd ORDER BY fd.detectedAt DESC")
    Page<FaceDetection> findAllOrderByDetectedAtDesc(Pageable pageable);
}