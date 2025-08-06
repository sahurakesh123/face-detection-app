package com.facerecognition.service;

import com.facerecognition.model.FaceData;
import com.facerecognition.model.Person;
import com.facerecognition.repository.FaceDataRepository;
import com.facerecognition.repository.PersonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
    public Person registerPerson(Person person, MultipartFile faceImage) throws Exception {
        // Check if face recognition service is properly initialized
        if (!faceRecognitionService.isInitialized()) {
            String status = faceRecognitionService.getInitializationStatus();
            log.error("Face recognition service not initialized: {}", status);
            throw new IllegalStateException("Face recognition service is not properly initialized: " + status);
        }

        // Check if email already exists
        if (personRepository.existsByEmail(person.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Validate face image
        if (!faceRecognitionService.validateImage(faceImage)) {
            throw new IllegalArgumentException("Invalid image format");
        }

        // Save person
        Person savedPerson = personRepository.save(person);

        try {
            // Save face image and extract encoding
            String imagePath = faceRecognitionService.saveImage(faceImage, savedPerson.getId().toString());
            log.info("Face image saved to: {}", imagePath);

            String faceEncoding = faceRecognitionService.extractFaceEncoding(imagePath);

            if (faceEncoding == null) {
                // Save debug image for troubleshooting if debug is enabled
                log.info("Face detection failed for person: {}", person.getEmail());
                faceRecognitionService.saveDebugImage(imagePath);

               // throw new IllegalArgumentException("No face detected in the image. Please ensure the image contains a clear, front-facing face. " +
                 //   "Tips: 1) Use good lighting, 2) Face should be clearly visible and front-facing, 3) Avoid shadows or reflections, " +
               //     "4) Image should be at least 200x200 pixels with the face taking up a significant portion, 5) Try a different angle or image.");
            }

            // Save face data
            FaceData faceData = new FaceData();
            faceData.setPerson(savedPerson);
            faceData.setImagePath(imagePath);
            faceData.setFaceEncoding(faceEncoding);
            faceData.setConfidenceScore(1.0);

            faceDataRepository.save(faceData);

            log.info("Person registered successfully: {}", savedPerson.getEmail());
            return savedPerson;
        } catch (Exception e) {
            // If face processing fails, we should clean up the saved person
            log.error("Failed to process face data for person: {}", savedPerson.getEmail(), e);
            personRepository.delete(savedPerson);
            throw e;
        }
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
                person.setFirstName(updatedPerson.getFirstName());
                person.setLastName(updatedPerson.getLastName());
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
                    person.setIsActive(false);
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