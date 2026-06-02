package com.mahindra.backend.entity;

import java.time.Instant;

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
@Table(name = "reward")
@Getter
@Setter
@NoArgsConstructor
public class Reward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    private String description;

    @Column(name = "points_required", nullable = false)
    private Integer pointsRequired;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false, length = 40)
    private String category = "perks";

    @Column(name = "icon_variant", nullable = false, length = 20)
    private String iconVariant = "crimson";

    @Column(length = 20)
    private String badge;

    @Column(length = 255)
    private String meta;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
