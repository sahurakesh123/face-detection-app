package com.facerecognition.service;

import com.facerecognition.model.FaceData;
import com.facerecognition.model.Person;
import com.facerecognition.repository.FaceDataRepository;
import jakarta.annotation.PostConstruct;
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

import java.awt.*;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Iterator;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.commons.text.similarity.JaroWinklerSimilarity;

import net.coobird.thumbnailator.Thumbnails;

@Service
@RequiredArgsConstructor
@Slf4j
public class FaceRecognitionService {

    private final FaceDataRepository faceDataRepository;
    
    @Value("${face.recognition.threshold:0.6}")
    private double recognitionThreshold;

    @Value("${face.images.upload.path:uploads/faces/}")
    private String uploadPath;

    @Value("${face.detection.scale.factor:1.1}")
    private double scaleFactor;

    @Value("${face.detection.min.neighbors:3}")
    private int minNeighbors;

    @Value("${face.detection.min.size.width:30}")
    private int minSizeWidth;

    @Value("${face.detection.min.size.height:30}")
    private int minSizeHeight;

    @Value("${face.detection.aggressive.scale.factor:1.05}")
    private double aggressiveScaleFactor;

    @Value("${face.detection.aggressive.min.neighbors:2}")
    private int aggressiveMinNeighbors;

    @Value("${face.detection.aggressive.min.size.width:20}")
    private int aggressiveMinSizeWidth;

    @Value("${face.detection.aggressive.min.size.height:20}")
    private int aggressiveMinSizeHeight;

    @Value("${face.detection.debug.enabled:true}")
    private boolean debugEnabled;
    
    private CascadeClassifier faceDetector;
    
    @PostConstruct
    public void init() {
        try {
            OpenCV.loadShared();
            log.info("OpenCV loaded successfully");

            // Initialize face detector with proper path handling
            initializeFaceDetector();

            // Create upload directory if it doesn't exist
            Files.createDirectories(Paths.get(uploadPath));

            log.info("Face recognition service initialized successfully");
        } catch (Exception e) {
            log.error("Failed to initialize face recognition service", e);
            throw new RuntimeException("Face recognition service initialization failed", e);
        }
    }

    private void initializeFaceDetector() throws IOException {
        // Extract cascade file from resources to temporary location
        InputStream cascadeStream = getClass().getClassLoader()
            .getResourceAsStream("haarcascade_frontalface_alt.xml");

        if (cascadeStream == null) {
            throw new RuntimeException("Haar cascade file not found in resources");
        }

        // Create temporary file
        Path tempCascadeFile = Files.createTempFile("haarcascade_frontalface", ".xml");
        Files.copy(cascadeStream, tempCascadeFile, StandardCopyOption.REPLACE_EXISTING);
        cascadeStream.close();

        // Initialize cascade classifier
        String cascadePath = tempCascadeFile.toAbsolutePath().toString();
        log.info("Loading cascade classifier from: {}", cascadePath);

        faceDetector = new CascadeClassifier(cascadePath);

        // Validate that the classifier loaded successfully
        if (faceDetector.empty()) {
            throw new RuntimeException("Failed to load cascade classifier from: " + cascadePath);
        }

        log.info("Face detector initialized successfully");

        // Mark temp file for deletion on exit
        tempCascadeFile.toFile().deleteOnExit();
    }
    
    public String saveImageFromBase64(String base64Image, String personId) throws IOException {
        log.info("--- Starting Image Conversion Process from Base64 for person ID: {} ---", personId);

        if (base64Image == null || base64Image.isEmpty()) {
            throw new IOException("Input Base64 image string is empty.");
        }

        // The Base64 string may have a prefix like "data:image/jpeg;base64,". We need to remove it.
        String pureBase64 = base64Image.contains(",") ? base64Image.substring(base64Image.indexOf(",") + 1) : base64Image;
        byte[] imageBytes = Base64.getDecoder().decode(pureBase64);

        if (imageBytes.length == 0) {
            throw new IOException("Decoded byte array is empty.");
        }

        String fileName = "person_" + personId + "_" + System.currentTimeMillis() + "_converted.jpg";
        Path filePath = Paths.get(uploadPath, fileName);
        Files.createDirectories(filePath.getParent());

        try (InputStream inputStream = new ByteArrayInputStream(imageBytes)) {
            Thumbnails.of(inputStream)
                .scale(1.0)
                .outputFormat("jpg")
                .toFile(filePath.toFile());

            long fileSize = Files.size(filePath);
            if (fileSize == 0) {
                log.error("Thumbnailator created a zero-byte file from Base64 data.");
                throw new IOException("Failed to save image; output file is empty.");
            }

            log.info("Successfully saved image from Base64 data. Path: {}, Size: {} bytes", filePath, fileSize);
            return filePath.toString();

        } catch (Exception e) {
            log.error("--- EXCEPTION during Thumbnailator Base64 Conversion ---", e);
            throw new IOException("Critical error during Base64 image processing: " + e.getMessage(), e);
        }
    }
    
    public List<Rect> detectFaces(String imagePath) {
        // Validate face detector is initialized
        if (faceDetector == null || faceDetector.empty()) {
            log.error("Face detector is not properly initialized");
            return new ArrayList<>();
        }

        Mat image = Imgcodecs.imread(imagePath);
        if (image.empty()) {
            log.error("Could not load image: {}", imagePath);
            return new ArrayList<>();
        }

        log.info("Processing image: {} (size: {}x{})", imagePath, image.width(), image.height());

        Mat grayImage = new Mat();
        Imgproc.cvtColor(image, grayImage, Imgproc.COLOR_BGR2GRAY);

        // Apply histogram equalization to improve contrast
        Mat equalizedImage = new Mat();
        Imgproc.equalizeHist(grayImage, equalizedImage);

        MatOfRect faceDetections = new MatOfRect();
        try {
            // Use configurable parameters for face detection
            faceDetector.detectMultiScale(
                equalizedImage,
                faceDetections,
                scaleFactor,        // configurable scaleFactor
                minNeighbors,       // configurable minNeighbors
                0,                  // flags
                new Size(minSizeWidth, minSizeHeight),  // configurable minSize
                new Size()          // maxSize (no limit)
            );

            Rect[] faces = faceDetections.toArray();
            log.info("Detected {} faces in image: {}", faces.length, imagePath);

            // Log details about detected faces
            for (int i = 0; i < faces.length; i++) {
                Rect face = faces[i];
                log.debug("Face {}: x={}, y={}, width={}, height={}",
                         i + 1, face.x, face.y, face.width, face.height);
            }

        } catch (Exception e) {
            log.error("Error during face detection for image: {}", imagePath, e);
            return new ArrayList<>();
        }

        List<Rect> detectedFaces = List.of(faceDetections.toArray());

        // If no faces detected with standard parameters, try more aggressive detection
        if (detectedFaces.isEmpty()) {
            log.info("No faces detected with standard parameters, trying more aggressive detection...");
            detectedFaces = detectFacesAggressive(equalizedImage, imagePath);
        }

        return detectedFaces;
    }

    private List<Rect> detectFacesAggressive(Mat grayImage, String imagePath) {
        MatOfRect faceDetections = new MatOfRect();

        try {
            // More aggressive configurable parameters
            faceDetector.detectMultiScale(
                grayImage,
                faceDetections,
                aggressiveScaleFactor,       // configurable aggressive scaleFactor
                aggressiveMinNeighbors,      // configurable aggressive minNeighbors
                0,                           // flags
                new Size(aggressiveMinSizeWidth, aggressiveMinSizeHeight),  // configurable aggressive minSize
                new Size()                   // maxSize (no limit)
            );

            Rect[] faces = faceDetections.toArray();
            log.info("Aggressive detection found {} faces in image: {}", faces.length, imagePath);

            if (faces.length > 0) {
                for (int i = 0; i < faces.length; i++) {
                    Rect face = faces[i];
                    log.debug("Aggressive Face {}: x={}, y={}, width={}, height={}",
                             i + 1, face.x, face.y, face.width, face.height);
                }
            }

        } catch (Exception e) {
            log.error("Error during aggressive face detection for image: {}", imagePath, e);
            return new ArrayList<>();
        }

        return List.of(faceDetections.toArray());
    }
    
    public String extractFaceEncoding(String imagePath) {
        Mat image = loadImage(imagePath);
        if (image.empty()) {
            log.error("Cannot load image from path: {}", imagePath);
            return null;
        }
        log.info("Processing image: {} (size: {}x{})", imagePath, image.width(), image.height());

        MatOfRect faces = new MatOfRect();
        // --- Performance Optimization ---
        // Set a minimum face size. This is a crucial optimization.
        // It prevents the detector from searching for tiny, irrelevant faces.
        // A value of 20-30% of the image height is a good starting point.
        int absoluteFaceSize = (int) (image.height() * 0.2);
        Size minFaceSize = new Size(absoluteFaceSize, absoluteFaceSize);
        
        log.info("Starting face detection with min face size: {}", minFaceSize);
        long startTime = System.currentTimeMillis();

        faceDetector.detectMultiScale(image, faces, 1.1, 3, 0, minFaceSize, new Size());

        long duration = System.currentTimeMillis() - startTime;
        log.info("Face detection completed in {} ms. Found {} faces.", duration, faces.toArray().length);

        if (faces.empty()) {
            log.warn("No faces detected in the image.");
            return null;
        }

        // Get the largest detected face (most likely to be the main subject)
        Rect faceRect = getLargestFace(List.of(faces.toArray()));
        log.info("Extracting face encoding from largest detected face at: x={}, y={}, width={}, height={}",
                 faceRect.x, faceRect.y, faceRect.width, faceRect.height);

        Mat faceROI = new Mat(image, faceRect);

        // Resize face to standard size
        Mat resizedFace = new Mat();
        Imgproc.resize(faceROI, resizedFace, new Size(128, 128));

        // Convert to encoding string (simplified - in production use deep learning models)
        return matToString(resizedFace);
    }

    private boolean validateImageForFaceDetection(String imagePath) {
        try {
            Mat image = Imgcodecs.imread(imagePath);
            if (image.empty()) {
                log.error("Image is empty or could not be loaded: {}", imagePath);
                return false;
            }

            // Check minimum image dimensions
            if (image.width() < 50 || image.height() < 50) {
                log.error("Image too small for face detection: {}x{} (minimum 50x50)",
                         image.width(), image.height());
                return false;
            }

            // Check if image is too large (might cause memory issues)
            if (image.width() > 4000 || image.height() > 4000) {
                log.warn("Image very large: {}x{}, this might affect performance",
                        image.width(), image.height());
            }

            log.debug("Image validation passed: {}x{}", image.width(), image.height());
            return true;

        } catch (Exception e) {
            log.error("Error validating image: {}", imagePath, e);
            return false;
        }
    }

    private Rect getLargestFace(List<Rect> faces) {
        return faces.stream()
                .max((face1, face2) -> Double.compare(face1.area(), face2.area()))
                .orElse(faces.get(0));
    }
    
    public Person matchFace(String capturedImagePath) {
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
    
    public double getBestMatchConfidence(String capturedEncoding) {
        if (capturedEncoding == null) return 0.0;
        List<FaceData> allFaceData = faceDataRepository.findByIsActiveTrue();
        double bestMatch = 0.0;
        for (FaceData faceData : allFaceData) {
            double similarity = calculateSimilarity(capturedEncoding, faceData.getFaceEncoding());
            if (similarity > bestMatch) {
                bestMatch = similarity;
            }
        }
        return bestMatch;
    }
    
    private double calculateSimilarity(String encoding1, String encoding2) {
        if (encoding1 == null || encoding2 == null) {
            return 0.0;
        }
        // Use Jaro-Winkler similarity for a more nuanced comparison
        JaroWinklerSimilarity jwSimilarity = new JaroWinklerSimilarity();
        return jwSimilarity.apply(encoding1, encoding2);
    }
    
    private String matToString(Mat mat) {
        // Convert Mat to string representation
        // In production, use proper face encoding algorithms
        byte[] data = new byte[(int) (mat.total() * mat.elemSize())];
        mat.get(0, 0, data);
        return java.util.Base64.getEncoder().encodeToString(data);
    }
    
    public void registerFaces(Person person, List<String> base64Images) throws IOException {
        List<FaceData> registeredFaces = new ArrayList<>();
        for (String base64Image : base64Images) {
            String imagePath = saveImageFromBase64(base64Image, String.valueOf(person.getId()));
            
            String faceEncoding = extractFaceEncoding(imagePath);
            if (faceEncoding == null) {
                log.warn("No face detected in one of the provided images for person {}. Skipping this image.", person.getEmail());
                continue; // Skip this image and continue with the next
            }

            FaceData faceData = new FaceData();
            faceData.setPerson(person);
            faceData.setImagePath(imagePath);
            faceData.setFaceEncoding(faceEncoding);
            faceData.setConfidenceScore(1.0); // Initial registration has max confidence
            registeredFaces.add(faceData);
        }

        if (registeredFaces.isEmpty()) {
            throw new IllegalArgumentException("No faces could be detected in any of the provided images.");
        }

        faceDataRepository.saveAll(registeredFaces);
        log.info("Successfully registered {} new face images for person {}", registeredFaces.size(), person.getEmail());
    }

    public Mat loadImage(String imagePath) {
        return Imgcodecs.imread(imagePath);
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

    /**
     * Check if the face recognition service is properly initialized
     */
    public boolean isInitialized() {
        return faceDetector != null && !faceDetector.empty();
    }

    /**
     * Get initialization status for debugging
     */
    public String getInitializationStatus() {
        if (faceDetector == null) {
            return "Face detector is null";
        } else if (faceDetector.empty()) {
            return "Face detector is empty (cascade not loaded)";
        } else {
            return "Face detector is properly initialized";
        }
    }

    /**
     * Debug method to save processed image for troubleshooting
     */
    public void saveDebugImage(String originalImagePath) {
        if (!debugEnabled) {
            log.debug("Debug image saving is disabled");
            return;
        }

        try {
            Mat image = Imgcodecs.imread(originalImagePath);
            if (image.empty()) {
                log.error("Cannot load image for debug: {}", originalImagePath);
                return;
            }

            Mat grayImage = new Mat();
            Imgproc.cvtColor(image, grayImage, Imgproc.COLOR_BGR2GRAY);

            Mat equalizedImage = new Mat();
            Imgproc.equalizeHist(grayImage, equalizedImage);

            // Save processed image for debugging
            String debugPath = originalImagePath.replace(".jpg", "_debug_processed.jpg");
            boolean saved = Imgcodecs.imwrite(debugPath, equalizedImage);

            if (saved) {
                log.info("Debug processed image saved to: {}", debugPath);
            } else {
                log.error("Failed to save debug image to: {}", debugPath);
            }

        } catch (Exception e) {
            log.error("Error saving debug image for: {}", originalImagePath, e);
        }
    }
}