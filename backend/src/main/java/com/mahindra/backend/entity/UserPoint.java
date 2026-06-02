package com.mahindra.backend.entity;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_points")
@Getter
@Setter
@NoArgsConstructor
public class UserPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(name = "base_points", nullable = false)
    private Integer basePoints;

    @Column(nullable = false)
    private BigDecimal multiplier = BigDecimal.ONE;

    @Column(name = "final_points", nullable = false)
    private Integer finalPoints;

    @Column(nullable = false, length = 50)
    private String reason;

    @Column(name = "earned_at", nullable = false)
    private Instant earnedAt = Instant.now();
}
