package com.mahindra.backend.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "rank_config")
@Getter
@Setter
@NoArgsConstructor
public class RankConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rank_level", nullable = false, unique = true)
    private Integer rankLevel;

    @Column(name = "rank_name", nullable = false, length = 50)
    private String rankName;

    @Column(name = "min_points", nullable = false)
    private Integer minPoints;

    @Column(name = "max_points", nullable = false)
    private Integer maxPoints;

    @Column(name = "benefit_description")
    private String benefitDescription;

    @Column(name = "point_multiplier", nullable = false)
    private BigDecimal pointMultiplier = BigDecimal.ONE;
}
