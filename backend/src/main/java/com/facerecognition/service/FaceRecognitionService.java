package com.facerecognition.service;

import com.facerecognition.dto.FaceCaptureDto;
import com.facerecognition.entity.FaceData;
import com.facerecognition.entity.User;
import com.facerecognition.repository.FaceDataRepository;
import com.facerecognition.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bytedeco.javacv.Frame;
import org.bytedeco.javacv.Java2DFrameConverter;
import org.bytedeco.javacv.OpenCVFrameConverter;
import org.bytedeco.opencv.opencv_core.Mat;
import org.bytedeco.opencv.opencv_core.Rect;
import org.bytedeco.opencv.opencv_core.RectVector;
import org.bytedeco.opencv.opencv_objdetect.CascadeClassifier;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import static org.bytedeco.opencv.global.opencv_core.*;
import static org.bytedeco.opencv.global.opencv_imgproc.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class FaceRecognitionService {
    
    private final FaceDataRepository faceDataRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
    private CascadeClassifier faceCascade;
    
    public void initializeFaceCascade() {
        try {
            faceCascade = new CascadeClassifier();
            // Load the face detection model
            faceCascade.load("haarcascade_frontalface_alt.xml");
        } catch (Exception e) {
            log.error("Error loading face cascade: {}", e.getMessage());
        }
    }
    
    public FaceData captureAndMatchFace(FaceCaptureDto captureDto, User currentUser) {
        try {
            // Decode base64 image
            byte[] imageBytes = Base64.getDecoder().decode(captureDto.getFaceImage());
            
            // Convert to OpenCV Mat
            Mat image = imdecode(new Mat(imageBytes), IMREAD_COLOR);
            
            // Detect faces
            RectVector faces = detectFaces(image);
            
            if (faces.size() > 0) {
                // Get the first detected face
                Rect faceRect = faces.get(0);
                
                // Extract face region
                Mat faceRegion = new Mat(image, faceRect);
                
                // Generate face encoding (simplified - in real implementation use proper face recognition library)
                String faceEncoding = generateFaceEncoding(faceRegion);
                
                // Save face data
                FaceData faceData = new FaceData();
                faceData.setUser(currentUser);
                faceData.setFaceImage(captureDto.getFaceImage());
                faceData.setFaceEncoding(faceEncoding);
                faceData.setConfidence(captureDto.getConfidence());
                faceData.setCameraSource(captureDto.getCameraSource());
                faceData.setLatitude(captureDto.getLatitude());
                faceData.setLongitude(captureDto.getLongitude());
                faceData.setLocation(captureDto.getLocation());
                faceData.setCapturedAt(LocalDateTime.now());
                
                // Try to match with existing faces
                Optional<User> matchedUser = findMatchingUser(faceEncoding);
                
                if (matchedUser.isPresent()) {
                    faceData.setMatched(true);
                    faceData.setMatchedUser(matchedUser.get());
                    faceData.setMatchedAt(LocalDateTime.now());
                    
                    // Send notification
                    notificationService.sendMatchNotification(faceData, matchedUser.get());
                }
                
                return faceDataRepository.save(faceData);
            }
            
            throw new RuntimeException("No face detected in the image");
            
        } catch (Exception e) {
            log.error("Error in face capture and matching: {}", e.getMessage());
            throw new RuntimeException("Face processing failed", e);
        }
    }
    
    private RectVector detectFaces(Mat image) {
        RectVector faces = new RectVector();
        Mat grayImage = new Mat();
        
        // Convert to grayscale
        cvtColor(image, grayImage, COLOR_BGR2GRAY);
        
        // Equalize histogram
        equalizeHist(grayImage, grayImage);
        
        // Detect faces
        faceCascade.detectMultiScale(grayImage, faces);
        
        return faces;
    }
    
    private String generateFaceEncoding(Mat faceRegion) {
        // This is a simplified implementation
        // In a real application, you would use a proper face recognition library
        // like dlib, face_recognition, or a deep learning model
        
        Mat resized = new Mat();
        resize(faceRegion, resized, new org.bytedeco.opencv.opencv_core.Size(128, 128));
        
        // Convert to grayscale
        Mat gray = new Mat();
        cvtColor(resized, gray, COLOR_BGR2GRAY);
        
        // Simple encoding based on pixel values (this is not a real face encoding)
        StringBuilder encoding = new StringBuilder();
        for (int i = 0; i < gray.rows(); i += 8) {
            for (int j = 0; j < gray.cols(); j += 8) {
                double[] pixel = gray.getDoubleBuffer().get(i * gray.cols() + j);
                encoding.append(pixel[0] > 128 ? "1" : "0");
            }
        }
        
        return encoding.toString();
    }
    
    private Optional<User> findMatchingUser(String faceEncoding) {
        // Get all users with face data
        List<User> users = userRepository.findAll();
        
        for (User user : users) {
            List<FaceData> userFaces = faceDataRepository.findByUserIdOrderByCapturedAtDesc(user.getId());
            
            for (FaceData userFace : userFaces) {
                if (userFace.getFaceEncoding() != null) {
                    double similarity = calculateSimilarity(faceEncoding, userFace.getFaceEncoding());
                    
                    if (similarity > 0.8) { // 80% similarity threshold
                        return Optional.of(user);
                    }
                }
            }
        }
        
        return Optional.empty();
    }
    
    private double calculateSimilarity(String encoding1, String encoding2) {
        if (encoding1.length() != encoding2.length()) {
            return 0.0;
        }
        
        int matches = 0;
        for (int i = 0; i < encoding1.length(); i++) {
            if (encoding1.charAt(i) == encoding2.charAt(i)) {
                matches++;
            }
        }
        
        return (double) matches / encoding1.length();
    }
    
    public List<FaceData> getRecentMatches() {
        return faceDataRepository.findByIsMatchedTrueOrderByMatchedAtDesc();
    }
    
    public List<FaceData> getUserFaceData(Long userId) {
        return faceDataRepository.findByUserIdOrderByCapturedAtDesc(userId);
    }
}