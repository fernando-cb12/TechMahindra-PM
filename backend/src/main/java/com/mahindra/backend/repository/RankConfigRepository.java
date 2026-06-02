package com.mahindra.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.RankConfig;

public interface RankConfigRepository extends JpaRepository<RankConfig, Long> {
    List<RankConfig> findAllByOrderByRankLevelAsc();
}
