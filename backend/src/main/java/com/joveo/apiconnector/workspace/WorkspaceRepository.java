package com.joveo.apiconnector.workspace;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {

    List<Workspace> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<Workspace> findByIdAndUserId(Long id, Long userId);
}
