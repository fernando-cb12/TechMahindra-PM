package com.mahindra.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.TaskUpdate;

public interface TaskUpdateRepository extends JpaRepository<TaskUpdate, Long> {
    List<TaskUpdate> findByTaskBoardIdAndDeletedAtIsNullOrderByCreatedAtAsc(Long boardId);
}

