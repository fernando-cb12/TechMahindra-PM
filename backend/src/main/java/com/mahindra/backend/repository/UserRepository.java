package com.mahindra.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    java.util.List<User> findByNameContainingIgnoreCase(String name);

    java.util.List<User> findByStatus(com.mahindra.backend.entity.UserStatus status);
}
