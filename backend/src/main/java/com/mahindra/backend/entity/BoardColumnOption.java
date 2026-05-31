package com.mahindra.backend.entity;

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
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "board_column_options", uniqueConstraints = @UniqueConstraint(columnNames = { "column_id", "key" }))
@Getter
@Setter
@NoArgsConstructor
public class BoardColumnOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", nullable = false)
    private BoardColumn column;

    @Column(name = "key", nullable = false, length = 100)
    private String key;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false, length = 20)
    private String color;

    @Column(name = "workflow_meaning", nullable = false, length = 20)
    private String workflowMeaning = "none";

    @Column(nullable = false)
    private Integer position = 0;

    @Column(nullable = false)
    private Boolean archived = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deleted_by")
    private User deletedBy;

    @Column(name = "purge_after")
    private Instant purgeAfter;
}

