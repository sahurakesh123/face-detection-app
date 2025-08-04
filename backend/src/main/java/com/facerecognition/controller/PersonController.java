package com.facerecognition.controller;

import com.facerecognition.model.Person;
import com.facerecognition.service.PersonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/persons")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class PersonController {
    
    private final PersonService personService;
    
    @PostMapping("/register")
    public ResponseEntity<?> registerPerson(
            @RequestParam("firstName") String firstName,
            @RequestParam("lastName") String lastName,
            @RequestParam("email") String email,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam("faceImage") MultipartFile faceImage) {
        
        try {
            Person person = new Person();
            person.setFirstName(firstName);
            person.setLastName(lastName);
            person.setEmail(email);
            person.setPhoneNumber(phoneNumber);
            person.setAddress(address);
            
            Person registeredPerson = personService.registerPerson(person, faceImage);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Person registered successfully",
                "person", registeredPerson
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error registering person", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Internal server error"
            ));
        }
    }
    
    @GetMapping
    public ResponseEntity<List<Person>> getAllPersons() {
        List<Person> persons = personService.getAllActivePersons();
        return ResponseEntity.ok(persons);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getPersonById(@PathVariable Long id) {
        return personService.getPersonById(id)
            .map(person -> ResponseEntity.ok(person))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Person>> searchPersons(@RequestParam String name) {
        List<Person> persons = personService.searchPersonsByName(name);
        return ResponseEntity.ok(persons);
    }
    
    @GetMapping("/email/{email}")
    public ResponseEntity<?> getPersonByEmail(@PathVariable String email) {
        return personService.getPersonByEmail(email)
            .map(person -> ResponseEntity.ok(person))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePerson(@PathVariable Long id, @Valid @RequestBody Person person) {
        try {
            Person updatedPerson = personService.updatePerson(id, person);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Person updated successfully",
                "person", updatedPerson
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivatePerson(@PathVariable Long id) {
        try {
            personService.deactivatePerson(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Person deactivated successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/{id}/face-data")
    public ResponseEntity<?> getPersonFaceData(@PathVariable Long id) {
        return ResponseEntity.ok(personService.getPersonFaceData(id));
    }
}