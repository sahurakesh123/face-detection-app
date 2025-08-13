package com.facerecognition.service;

import com.facerecognition.model.FaceData;
import com.facerecognition.model.Person;
import com.facerecognition.repository.FaceDataRepository;
import com.facerecognition.repository.PersonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PersonService {
    
    private final PersonRepository personRepository;
    private final FaceDataRepository faceDataRepository;
    private final FaceRecognitionService faceRecognitionService;
    
    @Transactional
    public Person registerPerson(String name, String email, String phoneNumber, String address, String base64Image) {
        log.info("Registering new person: {}, {}", name, email);
        // Basic validation
        if (name == null || name.trim().isEmpty() || email == null || email.trim().isEmpty() || base64Image == null || base64Image.isEmpty()) {
            throw new IllegalArgumentException("Name, email, and image data are required.");
        }

        Person newPerson = new Person();
        newPerson.setName(name);
        newPerson.setEmail(email);
        newPerson.setPhoneNumber(phoneNumber);
        newPerson.setAddress(address);
        newPerson.setActive(true);
        newPerson.setRegistrationDate(LocalDateTime.now());

        // Save person to get an ID
        Person savedPerson = personRepository.save(newPerson);
        log.debug("Person saved with ID: {}", savedPerson.getId());

        try {
            // Save the image and extract face encoding
            String imagePath = faceRecognitionService.saveImageFromBase64(base64Image, "person_" + savedPerson.getId());
            log.debug("Face image saved to: {}", imagePath);
            
            // Extract face encoding
            String faceEncoding = faceRecognitionService.extractFaceEncoding(imagePath);
            if (faceEncoding == null) {
                log.warn("Could not extract face encoding from image for person ID: {}", savedPerson.getId());
                throw new IllegalArgumentException("Could not detect a face in the provided image. Please try again with a clearer face image.");
            }
            
            log.debug("Face encoding extracted successfully, length: {}", faceEncoding.length());

            // Save the face data with encoding
            FaceData faceData = new FaceData();
            faceData.setPerson(savedPerson);
            faceData.setBase64ImageData(base64Image);
            faceData.setFaceEncoding(faceEncoding);
            faceData.setIsActive(true); // Fix: Use setIsActive instead of setActive
            faceDataRepository.save(faceData);
            log.info("Face data saved successfully for person ID: {}", savedPerson.getId());
            
        } catch (Exception e) {
            log.error("Error processing face image during registration", e);
            throw new RuntimeException("Error processing face image: " + e.getMessage(), e);
        }

        return savedPerson;
    }
    
    public List<Person> getAllActivePersons() {
        return personRepository.findByIsActiveTrue();
    }
    
    public Optional<Person> getPersonById(Long id) {
        return personRepository.findById(id);
    }
    
    public Optional<Person> getPersonByEmail(String email) {
        return personRepository.findByEmail(email);
    }
    
    public List<Person> searchPersonsByName(String name) {
        return personRepository.findByNameContaining(name);
    }
    
    @Transactional
    public Person updatePerson(Long id, Person updatedPerson) {
        return personRepository.findById(id)
            .map(person -> {
                person.setName(updatedPerson.getName());
                person.setPhoneNumber(updatedPerson.getPhoneNumber());
                person.setAddress(updatedPerson.getAddress());
                person.setDateOfBirth(updatedPerson.getDateOfBirth());
                return personRepository.save(person);
            })
            .orElseThrow(() -> new IllegalArgumentException("Person not found with id: " + id));
    }
    
    @Transactional
    public void deactivatePerson(Long id) {
        personRepository.findById(id)
            .ifPresentOrElse(
                person -> {
                    person.setActive(false);
                    personRepository.save(person);
                },
                () -> {
                    throw new IllegalArgumentException("Person not found with id: " + id);
                }
            );
    }
    
    public List<FaceData> getPersonFaceData(Long personId) {
        return faceDataRepository.findActiveByPersonId(personId);
    }
}