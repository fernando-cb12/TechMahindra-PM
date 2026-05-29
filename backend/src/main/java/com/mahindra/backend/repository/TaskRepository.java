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
                   sum(case when t.status = 'done' then 1 else 0 end),
                   count(t)
            from Task t
            where t.board.workspace.id in :ids
            group by t.board.workspace.id
            """)
    List<Object[]> countDoneAndTotalByWorkspaceIds(@Param("ids") Collection<Long> ids);

    List<Task> findByBoardIdAndDeletedAtIsNullOrderByGroupPositionAscPositionAscIdAsc(Long boardId);

    List<Task> findByGroupIdAndDeletedAtIsNullOrderByPositionAscIdAsc(Long groupId);
}
