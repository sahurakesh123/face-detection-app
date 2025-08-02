package com.facerecognition.service;

import com.facerecognition.model.DetectionLog;
import com.facerecognition.model.Person;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    @Async
    public void sendFaceDetectionNotification(Person person, DetectionLog detectionLog) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setTo(person.getEmail());
            helper.setSubject("Face Recognition Alert - Person Detected");
            helper.setText(buildEmailContent(person, detectionLog), true);
            
            mailSender.send(message);
            log.info("Email notification sent to: {}", person.getEmail());
            
        } catch (MessagingException e) {
            log.error("Failed to send email notification to: {}", person.getEmail(), e);
        }
    }
    
    private String buildEmailContent(Person person, DetectionLog detectionLog) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #f44336; color: white; padding: 10px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .detail { margin: 10px 0; }
                    .label { font-weight: bold; color: #333; }
                    .map-link { color: #1976d2; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🚨 Face Recognition Alert</h2>
                    </div>
                    <div class="content">
                        <h3>Person Detected</h3>
                        
                        <div class="detail">
                            <span class="label">Name:</span> %s %s
                        </div>
                        
                        <div class="detail">
                            <span class="label">Email:</span> %s
                        </div>
                        
                        <div class="detail">
                            <span class="label">Phone:</span> %s
                        </div>
                        
                        <div class="detail">
                            <span class="label">Detection Time:</span> %s
                        </div>
                        
                        <div class="detail">
                            <span class="label">Camera ID:</span> %s
                        </div>
                        
                        <div class="detail">
                            <span class="label">Camera Type:</span> %s
                        </div>
                        
                        <div class="detail">
                            <span class="label">Confidence Score:</span> %.2f%%
                        </div>
                        
                        <div class="detail">
                            <span class="label">Location:</span><br>
                            Latitude: %s<br>
                            Longitude: %s<br>
                            %s
                        </div>
                        
                        <div class="detail">
                            <a href="https://maps.google.com/?q=%s,%s" class="map-link" target="_blank">
                                📍 View Location on Google Maps
                            </a>
                        </div>
                        
                        <hr>
                        <p><small>This is an automated message from the Face Recognition System.</small></p>
                    </div>
                </div>
            </body>
            </html>
            """,
            person.getFirstName(),
            person.getLastName(),
            person.getEmail(),
            person.getPhoneNumber() != null ? person.getPhoneNumber() : "N/A",
            detectionLog.getDetectionTime().format(formatter),
            detectionLog.getCameraId() != null ? detectionLog.getCameraId() : "Unknown",
            detectionLog.getCameraType() != null ? detectionLog.getCameraType() : "Unknown",
            detectionLog.getConfidenceScore() * 100,
            detectionLog.getLatitude() != null ? detectionLog.getLatitude().toString() : "N/A",
            detectionLog.getLongitude() != null ? detectionLog.getLongitude().toString() : "N/A",
            detectionLog.getLocationAddress() != null ? detectionLog.getLocationAddress() : "Address not available",
            detectionLog.getLatitude() != null ? detectionLog.getLatitude().toString() : "0",
            detectionLog.getLongitude() != null ? detectionLog.getLongitude().toString() : "0"
        );
    }
}