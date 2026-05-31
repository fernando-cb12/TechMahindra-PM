package com.mahindra.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.TaskGroup;

public interface TaskGroupRepository extends JpaRepository<TaskGroup, Long> {
    List<TaskGroup> findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(Long boardId);

    Optional<TaskGroup> findByIdAndBoardIdAndDeletedAtIsNull(Long id, Long boardId);

    Optional<TaskGroup> findByIdAndBoardId(Long id, Long boardId);
}

