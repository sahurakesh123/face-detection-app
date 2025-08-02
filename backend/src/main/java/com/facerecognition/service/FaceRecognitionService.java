package com.facerecognition.service;

import com.facerecognition.model.FaceData;
import com.facerecognition.model.Person;
import com.facerecognition.repository.FaceDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nu.pattern.OpenCV;
import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.opencv.objdetect.CascadeClassifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FaceRecognitionService {

    private final FaceDataRepository faceDataRepository;
    
    @Value("${face.recognition.threshold:0.6}")
    private double recognitionThreshold;
    
    @Value("${face.images.upload.path:uploads/faces/}")
    private String uploadPath;
    
    private CascadeClassifier faceDetector;
    
    @PostConstruct
    public void init() {
        try {
            OpenCV.loadShared();
            
            // Initialize face detector
            String classifierPath = getClass().getClassLoader()
                .getResource("haarcascade_frontalface_alt.xml").getPath();
            faceDetector = new CascadeClassifier(classifierPath);
            
            // Create upload directory if it doesn't exist
            Files.createDirectories(Paths.get(uploadPath));
            
            log.info("Face recognition service initialized successfully");
        } catch (Exception e) {
            log.error("Failed to initialize face recognition service", e);
        }
    }
    
    public String saveImage(MultipartFile file, String personId) throws IOException {
        String fileName = "person_" + personId + "_" + System.currentTimeMillis() + ".jpg";
        Path filePath = Paths.get(uploadPath, fileName);
        Files.write(filePath, file.getBytes());
        return filePath.toString();
    }
    
    public List<Rect> detectFaces(String imagePath) {
        Mat image = Imgcodecs.imread(imagePath);
        if (image.empty()) {
            log.error("Could not load image: {}", imagePath);
            return new ArrayList<>();
        }
        
        Mat grayImage = new Mat();
        Imgproc.cvtColor(image, grayImage, Imgproc.COLOR_BGR2GRAY);
        
        MatOfRect faceDetections = new MatOfRect();
        faceDetector.detectMultiScale(grayImage, faceDetections);
        
        return List.of(faceDetections.toArray());
    }
    
    public String extractFaceEncoding(String imagePath) {
        List<Rect> faces = detectFaces(imagePath);
        if (faces.isEmpty()) {
            return null;
        }
        
        // Get the first detected face
        Rect faceRect = faces.get(0);
        
        Mat image = Imgcodecs.imread(imagePath);
        Mat faceROI = new Mat(image, faceRect);
        
        // Resize face to standard size
        Mat resizedFace = new Mat();
        Imgproc.resize(faceROI, resizedFace, new Size(128, 128));
        
        // Convert to encoding string (simplified - in production use deep learning models)
        return matToString(resizedFace);
    }
    
    public Person matchFace(String capturedImagePath, Double latitude, Double longitude) {
        String capturedEncoding = extractFaceEncoding(capturedImagePath);
        if (capturedEncoding == null) {
            return null;
        }
        
        List<FaceData> allFaceData = faceDataRepository.findByIsActiveTrue();
        
        double bestMatch = 0.0;
        Person matchedPerson = null;
        
        for (FaceData faceData : allFaceData) {
            double similarity = calculateSimilarity(capturedEncoding, faceData.getFaceEncoding());
            if (similarity > recognitionThreshold && similarity > bestMatch) {
                bestMatch = similarity;
                matchedPerson = faceData.getPerson();
            }
        }
        
        return matchedPerson;
    }
    
    private double calculateSimilarity(String encoding1, String encoding2) {
        // Simplified similarity calculation
        // In production, use proper face recognition algorithms
        if (encoding1 == null || encoding2 == null) {
            return 0.0;
        }
        
        // Simple string comparison for demonstration
        // Replace with actual face encoding comparison
        return encoding1.equals(encoding2) ? 1.0 : 0.3;
    }
    
    private String matToString(Mat mat) {
        // Convert Mat to string representation
        // In production, use proper face encoding algorithms
        byte[] data = new byte[(int) (mat.total() * mat.elemSize())];
        mat.get(0, 0, data);
        return java.util.Base64.getEncoder().encodeToString(data);
    }
    
    public boolean validateImage(MultipartFile file) {
        if (file.isEmpty()) {
            return false;
        }
        
        String contentType = file.getContentType();
        return contentType != null && (
            contentType.equals("image/jpeg") || 
            contentType.equals("image/png") || 
            contentType.equals("image/jpg")
        );
    }
}