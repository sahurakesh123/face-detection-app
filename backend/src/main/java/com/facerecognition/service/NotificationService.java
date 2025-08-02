package com.facerecognition.service;

import com.facerecognition.entity.FaceData;
import com.facerecognition.entity.Notification;
import com.facerecognition.entity.User;
import com.facerecognition.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    
    private final JavaMailSender emailSender;
    private final NotificationRepository notificationRepository;
    
    @Async
    public void sendMatchNotification(FaceData faceData, User matchedUser) {
        try {
            // Create notification record
            Notification notification = new Notification();
            notification.setUser(matchedUser);
            notification.setFaceData(faceData);
            notification.setType(Notification.NotificationType.EMAIL);
            notification.setRecipient(matchedUser.getEmail());
            
            // Create email message
            String subject = "Face Recognition Alert - Match Found";
            String message = createEmailMessage(faceData, matchedUser);
            
            notification.setMessage(message);
            
            // Send email
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setTo(matchedUser.getEmail());
            mailMessage.setSubject(subject);
            mailMessage.setText(message);
            
            emailSender.send(mailMessage);
            
            // Update notification status
            notification.setSent(true);
            notification.setSentAt(java.time.LocalDateTime.now());
            
            notificationRepository.save(notification);
            
            log.info("Email notification sent to {} for face match", matchedUser.getEmail());
            
        } catch (Exception e) {
            log.error("Error sending email notification: {}", e.getMessage());
            
            // Save failed notification
            Notification notification = new Notification();
            notification.setUser(matchedUser);
            notification.setFaceData(faceData);
            notification.setType(Notification.NotificationType.EMAIL);
            notification.setRecipient(matchedUser.getEmail());
            notification.setErrorMessage(e.getMessage());
            notificationRepository.save(notification);
        }
    }
    
    private String createEmailMessage(FaceData faceData, User matchedUser) {
        StringBuilder message = new StringBuilder();
        message.append("Hello ").append(matchedUser.getFirstName()).append(" ").append(matchedUser.getLastName()).append(",\n\n");
        message.append("A face match has been detected for your registered face.\n\n");
        message.append("Match Details:\n");
        message.append("- Detection Time: ").append(faceData.getCapturedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n");
        message.append("- Camera Source: ").append(faceData.getCameraSource()).append("\n");
        message.append("- Confidence Level: ").append(String.format("%.2f%%", faceData.getConfidence() * 100)).append("\n");
        
        if (faceData.getLatitude() != null && faceData.getLongitude() != null) {
            message.append("- Location: ").append(faceData.getLocation()).append("\n");
            message.append("- Coordinates: ").append(faceData.getLatitude()).append(", ").append(faceData.getLongitude()).append("\n");
            message.append("- Google Maps Link: https://maps.google.com/?q=").append(faceData.getLatitude()).append(",").append(faceData.getLongitude()).append("\n");
        }
        
        message.append("\nIf this was not you, please contact support immediately.\n\n");
        message.append("Best regards,\nFace Recognition System");
        
        return message.toString();
    }
    
    public void sendSmsNotification(FaceData faceData, User matchedUser) {
        // SMS implementation would go here
        // This would integrate with services like Twilio, AWS SNS, etc.
        log.info("SMS notification would be sent to {} for face match", matchedUser.getPhoneNumber());
    }
    
    public void retryFailedNotifications() {
        var failedNotifications = notificationRepository.findBySentFalse();
        
        for (Notification notification : failedNotifications) {
            try {
                if (notification.getType() == Notification.NotificationType.EMAIL) {
                    SimpleMailMessage mailMessage = new SimpleMailMessage();
                    mailMessage.setTo(notification.getRecipient());
                    mailMessage.setSubject("Face Recognition Alert - Match Found");
                    mailMessage.setText(notification.getMessage());
                    
                    emailSender.send(mailMessage);
                    
                    notification.setSent(true);
                    notification.setSentAt(java.time.LocalDateTime.now());
                    notification.setErrorMessage(null);
                    
                    notificationRepository.save(notification);
                    
                    log.info("Retry successful for notification ID: {}", notification.getId());
                }
            } catch (Exception e) {
                log.error("Retry failed for notification ID {}: {}", notification.getId(), e.getMessage());
                notification.setErrorMessage(e.getMessage());
                notificationRepository.save(notification);
            }
        }
    }
}