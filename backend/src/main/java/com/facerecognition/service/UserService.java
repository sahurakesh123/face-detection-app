package com.facerecognition.service;

import com.facerecognition.entity.FaceDetection;
import com.facerecognition.entity.User;
import com.facerecognition.repository.FaceDetectionRepository;
import com.facerecognition.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private FaceDetectionRepository faceDetectionRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private NotificationService notificationService;
    
    public User createUser(User user) {
        // Encode password
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Save user
        User savedUser = userRepository.save(user);
        
        // Send registration confirmation
        notificationService.sendRegistrationConfirmation(savedUser);
        
        return savedUser;
    }
    
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }
    
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public List<User> getUsersWithFaceEncodings() {
        return userRepository.findActiveUsersWithFaceEncodings();
    }
    
    public User saveUser(User user) {
        return userRepository.save(user);
    }
    
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
    
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }
    
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
    
    public List<User> searchUsersByName(String name) {
        return userRepository.findByNameContaining(name);
    }
    
    public List<User> getUsersByRole(User.UserRole role) {
        return userRepository.findByRole(role);
    }
    
    public List<User> getActiveUsers() {
        return userRepository.findByEnabled(true);
    }
    
    public long getTotalUsers() {
        return userRepository.count();
    }
    
    public long getUsersWithFaceEncodingsCount() {
        return userRepository.countUsersWithFaceEncodings();
    }
    
    // Face Detection Methods
    public FaceDetection saveFaceDetection(FaceDetection detection) {
        return faceDetectionRepository.save(detection);
    }
    
    public List<FaceDetection> getDetectionsByUser(User user) {
        return faceDetectionRepository.findByUserOrderByDetectedAtDesc(user);
    }
    
    public List<FaceDetection> getDetectionsByUser(Long userId) {
        Optional<User> user = getUserById(userId);
        return user.map(faceDetectionRepository::findByUserOrderByDetectedAtDesc)
                  .orElse(List.of());
    }
    
    public List<FaceDetection> getRecentDetections(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return faceDetectionRepository.findAllOrderByDetectedAtDesc(pageable).getContent();
    }
    
    public List<FaceDetection> getDetectionsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return faceDetectionRepository.findByDetectedAtBetween(startDate, endDate);
    }
    
    public List<FaceDetection> getDetectionsByLocation(Double minLat, Double maxLat, 
                                                      Double minLng, Double maxLng) {
        return faceDetectionRepository.findByLocationRange(minLat, maxLat, minLng, maxLng);
    }
    
    public List<FaceDetection> getDetectionsByCamera(String cameraId) {
        return faceDetectionRepository.findByCameraId(cameraId);
    }
    
    public List<FaceDetection> getDetectionsByStatus(FaceDetection.DetectionStatus status) {
        return faceDetectionRepository.findByStatus(status);
    }
    
    public long getTotalDetections() {
        return faceDetectionRepository.count();
    }
    
    public long getDetectionsToday() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        return faceDetectionRepository.findByDetectedAtBetween(startOfDay, endOfDay).size();
    }
    
    public long getDetectionsByUserCount(Long userId) {
        return faceDetectionRepository.countByUserId(userId);
    }
    
    public Page<FaceDetection> getDetectionsByUserPaginated(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return faceDetectionRepository.findByUserIdOrderByDetectedAtDesc(userId, pageable);
    }
    
    public List<FaceDetection> getPendingNotifications() {
        return faceDetectionRepository.findPendingNotifications();
    }
    
    public List<FaceDetection> getDetectionsByMinConfidence(Double minConfidence) {
        return faceDetectionRepository.findByMinConfidence(minConfidence);
    }
    
    // User Statistics
    public Map<String, Object> getUserStats(Long userId) {
        Map<String, Object> stats = new HashMap<>();
        
        Optional<User> user = getUserById(userId);
        if (user.isPresent()) {
            stats.put("user", user.get());
            stats.put("totalDetections", getDetectionsByUserCount(userId));
            stats.put("recentDetections", getDetectionsByUser(userId).subList(0, 
                Math.min(5, getDetectionsByUser(userId).size())));
            stats.put("hasFaceRegistered", user.get().getFaceEncoding() != null);
        }
        
        return stats;
    }
    
    public Map<String, Object> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", getTotalUsers());
        stats.put("usersWithFaces", getUsersWithFaceEncodingsCount());
        stats.put("totalDetections", getTotalDetections());
        stats.put("detectionsToday", getDetectionsToday());
        stats.put("pendingNotifications", getPendingNotifications().size());
        
        return stats;
    }
}