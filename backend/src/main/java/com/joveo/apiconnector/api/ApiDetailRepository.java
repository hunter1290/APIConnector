package com.joveo.apiconnector.api;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApiDetailRepository extends JpaRepository<ApiDetail, Long> {

    List<ApiDetail> findByUserIdOrderByCreatedAtAsc(Long userId);

    List<ApiDetail> findByWorkspaceIdOrderByCreatedAtAsc(Long workspaceId);

    Optional<ApiDetail> findByIdAndUserId(Long id, Long userId);

    long countByWorkspaceId(Long workspaceId);

    long countByUserId(Long userId);
}
