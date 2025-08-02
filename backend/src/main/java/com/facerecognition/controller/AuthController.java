package com.facerecognition.controller;

import com.facerecognition.entity.User;
import com.facerecognition.service.UserService;
import com.facerecognition.util.JwtTokenUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtTokenUtil jwtTokenUtil;
    
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );
            
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String jwt = jwtTokenUtil.generateToken(userDetails);
            
            Optional<User> user = userService.getUserByUsername(loginRequest.getUsername());
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("type", "Bearer");
            response.put("user", user.orElse(null));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid username or password"));
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
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
            createdUser.setPassword(null); // Don't return password
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User registered successfully",
                "user", createdUser
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error registering user: " + e.getMessage()));
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String token) {
        try {
            if (token != null && token.startsWith("Bearer ")) {
                String jwt = token.substring(7);
                String username = jwtTokenUtil.getUserNameFromJwtToken(jwt);
                
                Optional<User> user = userService.getUserByUsername(username);
                if (user.isPresent()) {
                    user.get().setPassword(null); // Don't return password
                    return ResponseEntity.ok(user.get());
                }
            }
            
            return ResponseEntity.unauthorized().build();
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error getting current user: " + e.getMessage()));
        }
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader("Authorization") String token) {
        try {
            if (token != null && token.startsWith("Bearer ")) {
                String jwt = token.substring(7);
                
                if (jwtTokenUtil.validateJwtToken(jwt)) {
                    String username = jwtTokenUtil.getUserNameFromJwtToken(jwt);
                    Optional<User> user = userService.getUserByUsername(username);
                    
                    if (user.isPresent()) {
                        UserDetails userDetails = org.springframework.security.core.userdetails.User
                                .withUsername(user.get().getUsername())
                                .password(user.get().getPassword())
                                .authorities("ROLE_" + user.get().getRole().name())
                                .build();
                        
                        String newToken = jwtTokenUtil.generateToken(userDetails);
                        
                        Map<String, Object> response = new HashMap<>();
                        response.put("token", newToken);
                        response.put("type", "Bearer");
                        response.put("user", user.get());
                        
                        return ResponseEntity.ok(response);
                    }
                }
            }
            
            return ResponseEntity.unauthorized().build();
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error refreshing token: " + e.getMessage()));
        }
    }
    
    // Login request DTO
    public static class LoginRequest {
        private String username;
        private String password;
        
        public String getUsername() {
            return username;
        }
        
        public void setUsername(String username) {
            this.username = username;
        }
        
        public String getPassword() {
            return password;
        }
        
        public void setPassword(String password) {
            this.password = password;
        }
    }
}