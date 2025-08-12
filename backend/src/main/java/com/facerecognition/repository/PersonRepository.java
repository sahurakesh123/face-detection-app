package com.facerecognition.repository;

import com.facerecognition.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonRepository extends JpaRepository<Person, Long> {
    
    Optional<Person> findByEmail(String email);
    
    List<Person> findByIsActiveTrue();
    
    @Query("SELECT p FROM Person p WHERE p.name LIKE %:name%")
    List<Person> findByNameContaining(String name);
    
    @Query("SELECT p FROM Person p WHERE p.phoneNumber = :phoneNumber")
    Optional<Person> findByPhoneNumber(String phoneNumber);
    
    boolean existsByEmail(String email);
}