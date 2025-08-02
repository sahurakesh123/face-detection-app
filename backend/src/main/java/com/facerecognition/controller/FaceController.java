package com.facerecognition.controller;

import com.facerecognition.dto.ApiResponse;
import com.facerecognition.dto.FaceCaptureDto;
import com.facerecognition.entity.FaceData;
import com.facerecognition.entity.User;
import com.facerecognition.service.FaceRecognitionService;
import com.facerecognition.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/faces")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FaceController {
    
    private final FaceRecognitionService faceRecognitionService;
    private final UserService userService;
    
    @PostMapping("/capture")
    public ResponseEntity<ApiResponse<FaceData>> captureAndMatchFace(@RequestBody FaceCaptureDto captureDto) {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            User currentUser = userService.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            FaceData faceData = faceRecognitionService.captureAndMatchFace(captureDto, currentUser);
            
            String message = faceData.isMatched() ? 
                "Face captured and matched successfully" : 
                "Face captured successfully, no match found";
            
            return ResponseEntity.ok(ApiResponse.success(message, faceData));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/matches")
    public ResponseEntity<ApiResponse<List<FaceData>>> getRecentMatches() {
        try {
            List<FaceData> matches = faceRecognitionService.getRecentMatches();
            return ResponseEntity.ok(ApiResponse.success("Recent matches retrieved", matches));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<FaceData>>> getUserFaceData(@PathVariable Long userId) {
        try {
            List<FaceData> faceData = faceRecognitionService.getUserFaceData(userId);
            return ResponseEntity.ok(ApiResponse.success("User face data retrieved", faceData));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/my-faces")
    public ResponseEntity<ApiResponse<List<FaceData>>> getMyFaceData() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            User currentUser = userService.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            List<FaceData> faceData = faceRecognitionService.getUserFaceData(currentUser.getId());
            return ResponseEntity.ok(ApiResponse.success("Your face data retrieved", faceData));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}