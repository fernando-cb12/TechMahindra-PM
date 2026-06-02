package com.mahindra.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.Badge;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    List<Badge> findByActiveTrueOrderByIdAsc();
}
