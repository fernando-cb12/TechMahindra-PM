package com.mahindra.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.BoardColumnOption;

public interface BoardColumnOptionRepository extends JpaRepository<BoardColumnOption, Long> {
    List<BoardColumnOption> findByColumnIdAndDeletedAtIsNullOrderByPositionAscIdAsc(Long columnId);
}

