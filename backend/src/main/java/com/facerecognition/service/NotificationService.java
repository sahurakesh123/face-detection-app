package com.facerecognition.service;

import com.facerecognition.entity.FaceDetection;
import com.facerecognition.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
public class NotificationService {
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Autowired
    private TemplateEngine templateEngine;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    @Value("${app.notification.subject:Face Detection Alert}")
    private String defaultSubject;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    @Async
    public void sendFaceDetectionNotification(FaceDetection detection) {
        try {
            User user = detection.getUser();
            
            // Create email context
            Context context = new Context();
            context.setVariable("user", user);
            context.setVariable("detection", detection);
            context.setVariable("detectionTime", detection.getDetectedAt().format(DATE_FORMATTER));
            context.setVariable("location", getLocationString(detection));
            context.setVariable("confidenceScore", String.format("%.2f%%", detection.getConfidenceScore() * 100));
            
            // Process email template
            String emailContent = templateEngine.process("face-detection-notification", context);
            
            // Send email
            sendHtmlEmail(user.getEmail(), defaultSubject, emailContent);
            
            // Update detection status
            detection.setNotificationSent(true);
            detection.setNotificationSentAt(java.time.LocalDateTime.now());
            
        } catch (Exception e) {
            System.err.println("Error sending notification: " + e.getMessage());
        }
    }
    
    @Async
    public void sendRegistrationConfirmation(User user) {
        try {
            Context context = new Context();
            context.setVariable("user", user);
            context.setVariable("registrationTime", user.getCreatedAt().format(DATE_FORMATTER));
            
            String emailContent = templateEngine.process("registration-confirmation", context);
            
            sendHtmlEmail(user.getEmail(), "Registration Confirmation", emailContent);
            
        } catch (Exception e) {
            System.err.println("Error sending registration confirmation: " + e.getMessage());
        }
    }
    
    @Async
    public void sendFaceRegistrationConfirmation(User user) {
        try {
            Context context = new Context();
            context.setVariable("user", user);
            context.setVariable("registrationTime", user.getUpdatedAt().format(DATE_FORMATTER));
            
            String emailContent = templateEngine.process("face-registration-confirmation", context);
            
            sendHtmlEmail(user.getEmail(), "Face Registration Confirmation", emailContent);
            
        } catch (Exception e) {
            System.err.println("Error sending face registration confirmation: " + e.getMessage());
        }
    }
    
    @Async
    public void sendSimpleNotification(String toEmail, String subject, String message) {
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(fromEmail);
            mailMessage.setTo(toEmail);
            mailMessage.setSubject(subject);
            mailMessage.setText(message);
            
            mailSender.send(mailMessage);
            
        } catch (Exception e) {
            System.err.println("Error sending simple notification: " + e.getMessage());
        }
    }
    
    private void sendHtmlEmail(String toEmail, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        
        mailSender.send(message);
    }
    
    private String getLocationString(FaceDetection detection) {
        StringBuilder location = new StringBuilder();
        
        if (detection.getCameraLocation() != null && !detection.getCameraLocation().isEmpty()) {
            location.append(detection.getCameraLocation());
        }
        
        if (detection.getLatitude() != null && detection.getLongitude() != null) {
            if (location.length() > 0) {
                location.append(" (");
            }
            location.append(String.format("%.6f, %.6f", detection.getLatitude(), detection.getLongitude()));
            if (location.charAt(0) != '(') {
                location.append(")");
            }
        }
        
        return location.length() > 0 ? location.toString() : "Unknown Location";
    }
    
    public void sendBulkNotification(String subject, String message, String... emails) {
        for (String email : emails) {
            sendSimpleNotification(email, subject, message);
        }
    }
    
    public void sendSystemAlert(String message) {
        // Send system alerts to admin email
        sendSimpleNotification(fromEmail, "System Alert", message);
    }
}