package com.facerecognition.service;

import com.facerecognition.model.DetectionLog;
import com.facerecognition.model.Person;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class SmsService {
    
    @Value("${twilio.account.sid}")
    private String accountSid;
    
    @Value("${twilio.auth.token}")
    private String authToken;
    
    @Value("${twilio.phone.number}")
    private String fromPhoneNumber;
    
    @PostConstruct
    public void init() {
        if (accountSid != null && !accountSid.startsWith("your-")) {
            Twilio.init(accountSid, authToken);
            log.info("Twilio SMS service initialized");
        } else {
            log.warn("Twilio credentials not configured properly");
        }
    }
    
    @Async
    public void sendFaceDetectionSms(Person person, DetectionLog detectionLog) {
        if (person.getPhoneNumber() == null || person.getPhoneNumber().trim().isEmpty()) {
            log.warn("No phone number available for person: {}", person.getEmail());
            return;
        }
        
        try {
            String messageBody = buildSmsContent(person, detectionLog);
            
            Message message = Message.creator(
                new PhoneNumber(person.getPhoneNumber()),
                new PhoneNumber(fromPhoneNumber),
                messageBody
            ).create();
            
            log.info("SMS sent successfully to: {} (SID: {})", person.getPhoneNumber(), message.getSid());
            
        } catch (Exception e) {
            log.error("Failed to send SMS to: {}", person.getPhoneNumber(), e);
        }
    }
    
    private String buildSmsContent(Person person, DetectionLog detectionLog) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        
        StringBuilder sb = new StringBuilder();
        sb.append("🚨 FACE RECOGNITION ALERT\n\n");
        sb.append("Person: ").append(person.getFirstName()).append(" ").append(person.getLastName()).append("\n");
        sb.append("Time: ").append(detectionLog.getDetectionTime().format(formatter)).append("\n");
        
        if (detectionLog.getCameraId() != null) {
            sb.append("Camera: ").append(detectionLog.getCameraId()).append("\n");
        }
        
        if (detectionLog.getLatitude() != null && detectionLog.getLongitude() != null) {
            sb.append("Location: ").append(detectionLog.getLatitude())
              .append(", ").append(detectionLog.getLongitude()).append("\n");
            sb.append("Map: https://maps.google.com/?q=")
              .append(detectionLog.getLatitude()).append(",").append(detectionLog.getLongitude()).append("\n");
        }
        
        sb.append("\nConfidence: ").append(String.format("%.1f", detectionLog.getConfidenceScore() * 100)).append("%");
        
        return sb.toString();
    }
}