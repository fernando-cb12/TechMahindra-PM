package com.mahindra.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.Reward;

public interface RewardRepository extends JpaRepository<Reward, Long> {
    List<Reward> findByActiveTrueOrderByPointsRequiredAscIdAsc();
}
