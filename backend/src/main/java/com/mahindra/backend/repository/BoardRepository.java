package com.mahindra.backend.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mahindra.backend.entity.Board;

public interface BoardRepository extends JpaRepository<Board, Long> {

    List<Board> findByWorkspaceIdAndDeletedAtIsNullOrderByPositionAscCreatedAtAsc(Long workspaceId);

    @Query("""
            select distinct b from Board b
            left join fetch b.workspace w
            where b.id = :boardId
              and w.id = :workspaceId
              and b.deletedAt is null
              and w.deletedAt is null
            """)
    Optional<Board> findActiveByWorkspaceIdAndId(@Param("workspaceId") Long workspaceId, @Param("boardId") Long boardId);

    @Query("""
            select distinct b from Board b
            left join fetch b.workspace w
            where b.id = :boardId
              and w.id = :workspaceId
              and w.deletedAt is null
            """)
    Optional<Board> findAnyByWorkspaceIdAndId(@Param("workspaceId") Long workspaceId, @Param("boardId") Long boardId);

    Optional<Board> findFirstByWorkspaceIdAndCreatedByIdAndNameAndDescriptionAndColorAndDeletedAtIsNullAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
            Long workspaceId,
            Long createdBy,
            String name,
            String description,
            String color,
            Instant createdAfter);

    default List<Board> findByWorkspaceIdOrderByCreatedAtAsc(Long workspaceId) {
        return findByWorkspaceIdAndDeletedAtIsNullOrderByPositionAscCreatedAtAsc(workspaceId);
    }
}
