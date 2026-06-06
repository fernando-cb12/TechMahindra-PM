package com.mahindra.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.MetricPresetOverride;

public interface MetricPresetOverrideRepository extends JpaRepository<MetricPresetOverride, Long> {
    List<MetricPresetOverride> findByUserIdOrderByPresetIdAsc(Long userId);
    Optional<MetricPresetOverride> findByUserIdAndPresetId(Long userId, String presetId);
    void deleteByUserIdAndPresetId(Long userId, String presetId);
}
