package com.mahindra.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahindra.backend.entity.Workspace;

public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
}
