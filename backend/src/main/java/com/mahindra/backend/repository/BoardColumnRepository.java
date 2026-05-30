package com.mahindra.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.BoardColumn;

public interface BoardColumnRepository extends JpaRepository<BoardColumn, Long> {
    List<BoardColumn> findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(Long boardId);
    Optional<BoardColumn> findByBoardIdAndKeyAndDeletedAtIsNull(Long boardId, String key);
}

