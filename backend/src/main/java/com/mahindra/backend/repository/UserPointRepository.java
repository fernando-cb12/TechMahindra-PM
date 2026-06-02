package com.mahindra.backend.repository;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mahindra.backend.entity.UserPoint;

public interface UserPointRepository extends JpaRepository<UserPoint, Long> {

    boolean existsByUserIdAndTaskIdAndReason(Long userId, Long taskId, String reason);

    @Query("select coalesce(sum(p.finalPoints), 0) from UserPoint p where p.user.id = :userId")
    int sumCareerPoints(@Param("userId") Long userId);

    @Query("select count(distinct p.task.id) from UserPoint p where p.user.id = :userId and p.reason = 'task_completed'")
    long countCompletedTasks(@Param("userId") Long userId);

    @Query("""
            select count(distinct p.task.id)
            from UserPoint p
            where p.user.id = :userId
              and p.reason = 'task_completed'
              and p.earnedAt >= :since
            """)
    long countCompletedTasksSince(@Param("userId") Long userId, @Param("since") Instant since);
}
