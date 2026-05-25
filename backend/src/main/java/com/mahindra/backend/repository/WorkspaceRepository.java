package com.mahindra.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mahindra.backend.entity.Workspace;

public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {

    @EntityGraph(attributePaths = { "members", "members.user" })
    @Query("select distinct w from Workspace w")
    List<Workspace> findAllWithMembers();

    @Query("select distinct w.id from Workspace w join w.members m where m.user.id = :userId")
    List<Long> findWorkspaceIdsByMemberUserId(@Param("userId") Long userId);

    @EntityGraph(attributePaths = { "members", "members.user" })
    @Query("select distinct w from Workspace w where w.id in :ids")
    List<Workspace> findAllWithMembersByIds(@Param("ids") Collection<Long> ids);
}
