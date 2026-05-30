package com.mahindra.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.TaskGroup;

public interface TaskGroupRepository extends JpaRepository<TaskGroup, Long> {
    List<TaskGroup> findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(Long boardId);
}

