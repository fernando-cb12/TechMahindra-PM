package com.mahindra.backend.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mahindra.backend.entity.RewardPointsLedger;

public interface RewardPointsLedgerRepository extends JpaRepository<RewardPointsLedger, Long> {

    boolean existsByUserIdAndTaskIdAndReason(Long userId, Long taskId, String reason);

    @Query("select coalesce(sum(l.pointsDelta), 0) from RewardPointsLedger l where l.user.id = :userId")
    int balance(@Param("userId") Long userId);

    @Query("""
            select coalesce(sum(l.pointsDelta), 0)
            from RewardPointsLedger l
            where l.user.id = :userId
              and l.pointsDelta > 0
              and l.createdAt >= :since
            """)
    int earnedSince(@Param("userId") Long userId, @Param("since") Instant since);

    @Query("""
            select coalesce(sum(abs(l.pointsDelta)), 0)
            from RewardPointsLedger l
            where l.user.id = :userId
              and l.pointsDelta < 0
            """)
    int redeemedTotal(@Param("userId") Long userId);

    List<RewardPointsLedger> findTop3ByUserIdOrderByCreatedAtDesc(Long userId);
    List<RewardPointsLedger> findTop100ByUserIdOrderByCreatedAtDesc(Long userId);
}
