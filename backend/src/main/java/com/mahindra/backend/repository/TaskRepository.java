package com.mahindra.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mahindra.backend.entity.Task;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("""
            select t.project.id,
                   sum(case when t.status = 'done' then 1 else 0 end),
                   count(t)
            from Task t
            where t.project.id in :ids
            group by t.project.id
            """)
    List<Object[]> countDoneAndTotalByProjectIds(@Param("ids") Collection<Long> ids);
}
