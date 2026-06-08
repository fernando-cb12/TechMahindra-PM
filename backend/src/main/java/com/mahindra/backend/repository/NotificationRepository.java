package com.mahindra.backend.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mahindra.backend.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop30ByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    long countByRecipientIdAndReadAtIsNull(Long recipientId);

    @Modifying
    @Query("""
            update Notification n
            set n.readAt = :readAt,
                n.updatedAt = :readAt
            where n.recipient.id = :recipientId
              and n.readAt is null
            """)
    int markAllRead(@Param("recipientId") Long recipientId, @Param("readAt") Instant readAt);
}
