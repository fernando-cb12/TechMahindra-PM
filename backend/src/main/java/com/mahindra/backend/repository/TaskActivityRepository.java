package com.mahindra.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.TaskActivity;

public interface TaskActivityRepository extends JpaRepository<TaskActivity, Long> {
    List<TaskActivity> findTop100ByBoardIdAndVisibilityOrderByCreatedAtDesc(Long boardId, String visibility);
    List<TaskActivity> findTop50ByTaskIdAndVisibilityOrderByCreatedAtDesc(Long taskId, String visibility);
}

