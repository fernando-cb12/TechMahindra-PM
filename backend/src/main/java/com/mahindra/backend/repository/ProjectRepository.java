package com.mahindra.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mahindra.backend.entity.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    @EntityGraph(attributePaths = { "workspace", "members", "members.user" })
    @Query("select distinct p from Project p")
    List<Project> findAllWithMembers();

    @Query("select distinct p.id from Project p join p.members m where m.user.id = :userId")
    List<Long> findProjectIdsByMemberUserId(@Param("userId") Long userId);

    @EntityGraph(attributePaths = { "workspace", "members", "members.user" })
    @Query("select distinct p from Project p where p.id in :ids")
    List<Project> findAllWithMembersByIds(@Param("ids") Collection<Long> ids);
}
