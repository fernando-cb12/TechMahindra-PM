package com.mahindra.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.UserReward;

public interface UserRewardRepository extends JpaRepository<UserReward, Long> {
}
