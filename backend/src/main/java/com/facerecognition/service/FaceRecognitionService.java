package com.facerecognition.service;

import com.facerecognition.entity.User;
import org.opencv.core.*;
import org.opencv.face.Face;
import org.opencv.face.LBPHFaceRecognizer;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.opencv.objdetect.CascadeClassifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FaceRecognitionService {
    
    @Value("${face.recognition.threshold:0.6}")
    private double recognitionThreshold;
    
    @Value("${face.recognition.cascade-path:/models/haarcascade_frontalface_default.xml}")
    private String cascadePath;
    
    private CascadeClassifier faceCascade;
    private LBPHFaceRecognizer faceRecognizer;
    private Map<Long, Mat> userFaceEncodings;
    
    public FaceRecognitionService() {
        this.userFaceEncodings = new HashMap<>();
        initializeFaceRecognition();
    }
    
    private void initializeFaceRecognition() {
        try {
            // Load face cascade classifier
            faceCascade = new CascadeClassifier();
            if (!faceCascade.load(cascadePath)) {
                System.err.println("Error loading face cascade classifier from: " + cascadePath);
            }
            
            // Initialize face recognizer
            faceRecognizer = LBPHFaceRecognizer.create();
            
        } catch (Exception e) {
            System.err.println("Error initializing face recognition: " + e.getMessage());
        }
    }
    
    public String extractFaceEncoding(MultipartFile imageFile) throws IOException {
        // Convert MultipartFile to Mat
        byte[] imageBytes = imageFile.getBytes();
        Mat image = Imgcodecs.imdecode(new MatOfByte(imageBytes), Imgcodecs.IMREAD_COLOR);
        
        if (image.empty()) {
            throw new IOException("Could not read image");
        }
        
        // Detect faces
        MatOfRect faces = new MatOfRect();
        faceCascade.detectMultiScale(image, faces);
        
        Rect[] facesArray = faces.toArray();
        if (facesArray.length == 0) {
            throw new IOException("No face detected in the image");
        }
        
        // Use the largest face (usually the main subject)
        Rect largestFace = getLargestFace(facesArray);
        Mat faceRegion = new Mat(image, largestFace);
        
        // Resize to standard size
        Mat resizedFace = new Mat();
        Imgproc.resize(faceRegion, resizedFace, new Size(100, 100));
        
        // Convert to grayscale
        Mat grayFace = new Mat();
        Imgproc.cvtColor(resizedFace, grayFace, Imgproc.COLOR_BGR2GRAY);
        
        // Extract face encoding (simplified - in production use more sophisticated encoding)
        return encodeFace(grayFace);
    }
    
    private Rect getLargestFace(Rect[] faces) {
        Rect largest = faces[0];
        for (Rect face : faces) {
            if (face.area() > largest.area()) {
                largest = face;
            }
        }
        return largest;
    }
    
    private String encodeFace(Mat faceImage) {
        // Convert Mat to byte array for storage
        MatOfByte matOfByte = new MatOfByte();
        Imgcodecs.imencode(".jpg", faceImage, matOfByte);
        byte[] bytes = matOfByte.toArray();
        return Base64.getEncoder().encodeToString(bytes);
    }
    
    public Optional<User> findMatchingUser(String faceEncoding, List<User> users) {
        if (users.isEmpty()) {
            return Optional.empty();
        }
        
        Mat inputFace = decodeFace(faceEncoding);
        User bestMatch = null;
        double bestScore = Double.MAX_VALUE;
        
        for (User user : users) {
            if (user.getFaceEncoding() != null) {
                Mat userFace = decodeFace(user.getFaceEncoding());
                double similarity = calculateSimilarity(inputFace, userFace);
                
                if (similarity < bestScore && similarity <= recognitionThreshold) {
                    bestScore = similarity;
                    bestMatch = user;
                }
            }
        }
        
        return Optional.ofNullable(bestMatch);
    }
    
    private Mat decodeFace(String faceEncoding) {
        byte[] bytes = Base64.getDecoder().decode(faceEncoding);
        MatOfByte matOfByte = new MatOfByte(bytes);
        return Imgcodecs.imdecode(matOfByte, Imgcodecs.IMREAD_GRAYSCALE);
    }
    
    private double calculateSimilarity(Mat face1, Mat face2) {
        // Simple similarity calculation using mean squared error
        // In production, use more sophisticated algorithms like LBPH, Eigenfaces, or deep learning
        Mat diff = new Mat();
        Core.absdiff(face1, face2, diff);
        
        Scalar meanDiff = Core.mean(diff);
        return meanDiff.val[0];
    }
    
    public boolean validateFaceImage(MultipartFile imageFile) {
        try {
            byte[] imageBytes = imageFile.getBytes();
            Mat image = Imgcodecs.imdecode(new MatOfByte(imageBytes), Imgcodecs.IMREAD_COLOR);
            
            if (image.empty()) {
                return false;
            }
            
            MatOfRect faces = new MatOfRect();
            faceCascade.detectMultiScale(image, faces);
            
            return faces.toArray().length > 0;
            
        } catch (Exception e) {
            return false;
        }
    }
    
    public String saveFaceImage(MultipartFile imageFile, String userId) throws IOException {
        String uploadDir = "uploads/faces/";
        Path uploadPath = Paths.get(uploadDir);
        
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        String fileName = userId + "_" + System.currentTimeMillis() + ".jpg";
        Path filePath = uploadPath.resolve(fileName);
        
        Files.copy(imageFile.getInputStream(), filePath);
        
        return filePath.toString();
    }
    
    public void trainFaceRecognizer(List<User> users) {
        if (users.isEmpty()) {
            return;
        }
        
        List<Mat> images = new ArrayList<>();
        MatOfInt labels = new MatOfInt();
        List<Integer> labelList = new ArrayList<>();
        
        for (User user : users) {
            if (user.getFaceEncoding() != null) {
                Mat faceImage = decodeFace(user.getFaceEncoding());
                images.add(faceImage);
                labelList.add(user.getId().intValue());
            }
        }
        
        if (!images.isEmpty()) {
            MatOfInt matOfInt = new MatOfInt();
            matOfInt.fromList(labelList);
            faceRecognizer.train(images, matOfInt);
        }
    }
    
    public double getRecognitionThreshold() {
        return recognitionThreshold;
    }
    
    public void setRecognitionThreshold(double threshold) {
        this.recognitionThreshold = threshold;
    }
}