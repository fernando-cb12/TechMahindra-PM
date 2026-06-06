package com.mahindra.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mahindra.backend.entity.Task;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("""
            select t.board.workspace.id,
                   sum(case when t.completedAt is not null then 1 else 0 end),
                   count(t)
            from Task t
            where t.board.workspace.id in :ids
            group by t.board.workspace.id
            """)
    List<Object[]> countDoneAndTotalByWorkspaceIds(@Param("ids") Collection<Long> ids);

    List<Task> findByBoardIdAndDeletedAtIsNullOrderByGroupPositionAscPositionAscIdAsc(Long boardId);

    List<Task> findByGroupIdAndDeletedAtIsNullOrderByPositionAscIdAsc(Long groupId);

    List<Task> findByGroupIdOrderByPositionAscIdAsc(Long groupId);

    @Query("""
            select t
            from Task t
            join fetch t.board b
            join fetch b.workspace w
            left join fetch t.group g
            left join fetch t.statusOption so
            left join fetch t.priorityOption po
            where t.deletedAt is null
              and b.deletedAt is null
              and b.archivedAt is null
              and w.deletedAt is null
              and (exists (
                  select 1
                  from t.assignees a
                  where a.id = :userId
              ) or t.assignedTo.id = :userId)
              and (:admin = true or exists (
                  select 1
                  from BoardMember bm
                  where bm.board = b
                    and bm.user.id = :userId
                    and bm.deletedAt is null
              ))
            order by
              case when t.dueDate is null then 1 else 0 end,
              t.dueDate asc,
              t.updatedAt desc,
              t.id asc
            """)
    List<Task> findMyAssignedTasks(@Param("userId") Long userId, @Param("admin") boolean admin);
}
