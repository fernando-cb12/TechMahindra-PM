package com.mahindra.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mahindra.backend.entity.Milestone;

public interface MilestoneRepository extends JpaRepository<Milestone, Long> {

    @Query("""
            select m.project.id,
                   sum(case when m.status = 'completed' then 1 else 0 end),
                   count(m)
            from Milestone m
            where m.project.id in :ids
            group by m.project.id
            """)
    List<Object[]> countCompletedAndTotalByProjectIds(@Param("ids") Collection<Long> ids);
}
