package com.facerecognition.repository;

import com.facerecognition.model.DetectionLog;
import com.facerecognition.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DetectionLogRepository extends JpaRepository<DetectionLog, Long> {
    
    List<DetectionLog> findByPerson(Person person);
    
    List<DetectionLog> findByPersonOrderByDetectionTimeDesc(Person person);
    
    @Query("SELECT dl FROM DetectionLog dl WHERE dl.detectionTime BETWEEN :startTime AND :endTime")
    List<DetectionLog> findByDetectionTimeBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    @Query("SELECT dl FROM DetectionLog dl WHERE dl.notificationSent = false")
    List<DetectionLog> findPendingNotifications();
    
    @Query("SELECT dl FROM DetectionLog dl WHERE dl.cameraId = :cameraId ORDER BY dl.detectionTime DESC")
    List<DetectionLog> findByCameraIdOrderByDetectionTimeDesc(String cameraId);
}