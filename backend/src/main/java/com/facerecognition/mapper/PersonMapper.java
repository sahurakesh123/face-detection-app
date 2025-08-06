package com.facerecognition.mapper;

import com.facerecognition.dto.DetectionLogDTO;
import com.facerecognition.dto.FaceDataDTO;
import com.facerecognition.dto.PersonDTO;
import com.facerecognition.dto.PersonSummaryDTO;
import com.facerecognition.model.DetectionLog;
import com.facerecognition.model.FaceData;
import com.facerecognition.model.Person;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PersonMapper {

    public PersonSummaryDTO toPersonSummaryDTO(Person person) {
        if (person == null) {
            return null;
        }
        
        PersonSummaryDTO dto = new PersonSummaryDTO();
        dto.setId(person.getId());
        dto.setFirstName(person.getFirstName());
        dto.setLastName(person.getLastName());
        dto.setEmail(person.getEmail());
        dto.setPhoneNumber(person.getPhoneNumber());
        dto.setRegistrationDate(person.getRegistrationDate());
        dto.setIsActive(person.getIsActive());
        
        return dto;
    }

    public PersonDTO toPersonDTO(Person person) {
        if (person == null) {
            return null;
        }
        
        PersonDTO dto = new PersonDTO();
        dto.setId(person.getId());
        dto.setFirstName(person.getFirstName());
        dto.setLastName(person.getLastName());
        dto.setEmail(person.getEmail());
        dto.setPhoneNumber(person.getPhoneNumber());
        dto.setAddress(person.getAddress());
        dto.setDateOfBirth(person.getDateOfBirth());
        dto.setRegistrationDate(person.getRegistrationDate());
        dto.setIsActive(person.getIsActive());
        
        // Convert collections without circular references
        if (person.getFaceDataList() != null) {
            dto.setFaceDataList(person.getFaceDataList().stream()
                .map(this::toFaceDataDTO)
                .collect(Collectors.toList()));
        }
        
        if (person.getDetectionLogs() != null) {
            dto.setDetectionLogs(person.getDetectionLogs().stream()
                .map(this::toDetectionLogDTO)
                .collect(Collectors.toList()));
        }
        
        return dto;
    }

    public FaceDataDTO toFaceDataDTO(FaceData faceData) {
        if (faceData == null) {
            return null;
        }
        
        FaceDataDTO dto = new FaceDataDTO();
        dto.setId(faceData.getId());
        dto.setImagePath(faceData.getImagePath());
        dto.setConfidenceScore(faceData.getConfidenceScore());
        dto.setCreatedDate(faceData.getCreatedDate());
        dto.setIsActive(faceData.getIsActive());
        
        return dto;
    }

    public DetectionLogDTO toDetectionLogDTO(DetectionLog detectionLog) {
        if (detectionLog == null) {
            return null;
        }
        
        DetectionLogDTO dto = new DetectionLogDTO();
        dto.setId(detectionLog.getId());
        dto.setDetectionImagePath(detectionLog.getDetectionImagePath());
        dto.setLatitude(detectionLog.getLatitude());
        dto.setLongitude(detectionLog.getLongitude());
        dto.setLocationAddress(detectionLog.getLocationAddress());
        dto.setCameraId(detectionLog.getCameraId());
        dto.setCameraType(detectionLog.getCameraType());
        dto.setConfidenceScore(detectionLog.getConfidenceScore());
        dto.setDetectionTime(detectionLog.getDetectionTime());
        dto.setNotificationSent(detectionLog.getNotificationSent());
        dto.setEmailSent(detectionLog.getEmailSent());
        dto.setSmsSent(detectionLog.getSmsSent());
        
        return dto;
    }

    public List<PersonSummaryDTO> toPersonSummaryDTOList(List<Person> persons) {
        if (persons == null) {
            return null;
        }
        
        return persons.stream()
            .map(this::toPersonSummaryDTO)
            .collect(Collectors.toList());
    }
}
