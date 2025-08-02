package com.facerecognition.controller;

import com.facerecognition.entity.User;
import com.facerecognition.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody User user) {
        try {
            // Check if username already exists
            if (userService.existsByUsername(user.getUsername())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
            }
            
            // Check if email already exists
            if (userService.existsByEmail(user.getEmail())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
            }
            
            // Create user
            User createdUser = userService.createUser(user);
            
            // Remove password from response
            createdUser.setPassword(null);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User registered successfully",
                "user", createdUser
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error registering user: " + e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            return userService.getUserById(id)
                    .map(user -> {
                        user.setPassword(null); // Don't return password
                        return ResponseEntity.ok(user);
                    })
                    .orElse(ResponseEntity.notFound().build());
                    
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error getting user: " + e.getMessage()));
        }
    }
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            List<User> users = userService.getAllUsers();
            users.forEach(user -> user.setPassword(null)); // Don't return passwords
            
            return ResponseEntity.ok(users);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error getting users: " + e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User user) {
        try {
            return userService.getUserById(id)
                    .map(existingUser -> {
                        // Update fields
                        if (user.getFirstName() != null) {
                            existingUser.setFirstName(user.getFirstName());
                        }
                        if (user.getLastName() != null) {
                            existingUser.setLastName(user.getLastName());
                        }
                        if (user.getEmail() != null) {
                            existingUser.setEmail(user.getEmail());
                        }
                        if (user.getPhoneNumber() != null) {
                            existingUser.setPhoneNumber(user.getPhoneNumber());
                        }
                        if (user.getPassword() != null) {
                            existingUser.setPassword(user.getPassword());
                        }
                        
                        User updatedUser = userService.saveUser(existingUser);
                        updatedUser.setPassword(null);
                        
                        return ResponseEntity.ok(Map.of(
                            "success", true,
                            "message", "User updated successfully",
                            "user", updatedUser
                        ));
                    })
                    .orElse(ResponseEntity.notFound().build());
                    
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error updating user: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            if (!userService.getUserById(id).isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            userService.deleteUser(id);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User deleted successfully"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error deleting user: " + e.getMessage()));
        }
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> searchUsers(@RequestParam String name) {
        try {
            List<User> users = userService.searchUsersByName(name);
            users.forEach(user -> user.setPassword(null));
            
            return ResponseEntity.ok(users);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error searching users: " + e.getMessage()));
        }
    }
    
    @GetMapping("/{id}/stats")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<?> getUserStats(@PathVariable Long id) {
        try {
            Map<String, Object> stats = userService.getUserStats(id);
            
            if (stats.containsKey("user")) {
                User user = (User) stats.get("user");
                user.setPassword(null);
                stats.put("user", user);
            }
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error getting user stats: " + e.getMessage()));
        }
    }
    
    @GetMapping("/{id}/detections")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<?> getUserDetections(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<com.facerecognition.entity.FaceDetection> detections = 
                userService.getDetectionsByUserPaginated(id, page, size);
            
            return ResponseEntity.ok(detections);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error getting user detections: " + e.getMessage()));
        }
    }
    
    @GetMapping("/stats/system")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getSystemStats() {
        try {
            Map<String, Object> stats = userService.getSystemStats();
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error getting system stats: " + e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> enableUser(@PathVariable Long id) {
        try {
            return userService.getUserById(id)
                    .map(user -> {
                        user.setEnabled(true);
                        User updatedUser = userService.saveUser(user);
                        updatedUser.setPassword(null);
                        
                        return ResponseEntity.ok(Map.of(
                            "success", true,
                            "message", "User enabled successfully",
                            "user", updatedUser
                        ));
                    })
                    .orElse(ResponseEntity.notFound().build());
                    
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error enabling user: " + e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> disableUser(@PathVariable Long id) {
        try {
            return userService.getUserById(id)
                    .map(user -> {
                        user.setEnabled(false);
                        User updatedUser = userService.saveUser(user);
                        updatedUser.setPassword(null);
                        
                        return ResponseEntity.ok(Map.of(
                            "success", true,
                            "message", "User disabled successfully",
                            "user", updatedUser
                        ));
                    })
                    .orElse(ResponseEntity.notFound().build());
                    
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error disabling user: " + e.getMessage()));
        }
    }
}