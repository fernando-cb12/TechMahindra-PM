package com.mahindra.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.mahindra.backend.entity.MetricDashboard;

public interface MetricDashboardRepository extends JpaRepository<MetricDashboard, Long> {
    List<MetricDashboard> findByUserIdAndDeletedAtIsNullOrderByUpdatedAtDescIdDesc(Long userId);
    List<MetricDashboard> findByUserIdAndDefaultDashboardTrueAndDeletedAtIsNull(Long userId);
    Optional<MetricDashboard> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    @Modifying
    @Query("""
            update MetricDashboard dashboard
            set dashboard.defaultDashboard = false
            where dashboard.user.id = :userId
              and dashboard.deletedAt is null
            """)
    void clearDefaultDashboards(Long userId);
}
