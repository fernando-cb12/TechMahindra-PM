package com.mahindra.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.Board;

public interface BoardRepository extends JpaRepository<Board, Long> {

    List<Board> findByWorkspaceIdOrderByCreatedAtAsc(Long workspaceId);
}
