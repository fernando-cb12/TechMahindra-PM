package com.mahindra.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.TaskCustomValue;
import com.mahindra.backend.entity.TaskCustomValueId;

public interface TaskCustomValueRepository extends JpaRepository<TaskCustomValue, TaskCustomValueId> {
    List<TaskCustomValue> findByTaskBoardIdAndTaskDeletedAtIsNull(Long boardId);
}

