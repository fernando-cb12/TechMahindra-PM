package com.mahindra.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.BoardView;

public interface BoardViewRepository extends JpaRepository<BoardView, Long> {
    List<BoardView> findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(Long boardId);
}

