package com.mahindra.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.BoardMember;

public interface BoardMemberRepository extends JpaRepository<BoardMember, Long> {
    boolean existsByBoardIdAndUserIdAndDeletedAtIsNull(Long boardId, Long userId);
    Optional<BoardMember> findByBoardIdAndUserId(Long boardId, Long userId);
    List<BoardMember> findByBoardWorkspaceIdAndUserIdAndDeletedAtIsNull(Long workspaceId, Long userId);
}

