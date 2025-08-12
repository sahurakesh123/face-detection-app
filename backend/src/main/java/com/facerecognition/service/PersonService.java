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
    public Person registerPerson(String name, String email, String base64Image) {
        // Basic validation
        if (name == null || name.trim().isEmpty() || email == null || email.trim().isEmpty() || base64Image == null || base64Image.isEmpty()) {
            throw new IllegalArgumentException("Name, email, and image data are required.");
        }

        Person newPerson = new Person();
        newPerson.setName(name);
        newPerson.setEmail(email);
        newPerson.setActive(true);
        newPerson.setRegistrationDate(LocalDateTime.now());

        // Save person to get an ID
        Person savedPerson = personRepository.save(newPerson);

        // Save the face data
        FaceData faceData = new FaceData();
        faceData.setPerson(savedPerson);
        faceData.setBase64ImageData(base64Image);
        faceDataRepository.save(faceData);

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