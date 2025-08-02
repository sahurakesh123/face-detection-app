package com.facerecognition.repository;

import com.facerecognition.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    List<User> findByRole(User.UserRole role);
    
    List<User> findByEnabled(boolean enabled);
    
    @Query("SELECT u FROM User u WHERE u.faceEncoding IS NOT NULL")
    List<User> findAllWithFaceEncodings();
    
    @Query("SELECT u FROM User u WHERE u.faceEncoding IS NOT NULL AND u.enabled = true")
    List<User> findActiveUsersWithFaceEncodings();
    
    @Query("SELECT u FROM User u WHERE u.firstName LIKE %:name% OR u.lastName LIKE %:name%")
    List<User> findByNameContaining(@Param("name") String name);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.faceEncoding IS NOT NULL")
    long countUsersWithFaceEncodings();
}