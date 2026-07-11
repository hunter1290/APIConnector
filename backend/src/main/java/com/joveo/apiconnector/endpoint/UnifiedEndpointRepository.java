package com.joveo.apiconnector.endpoint;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UnifiedEndpointRepository extends JpaRepository<UnifiedEndpoint, Long> {

    List<UnifiedEndpoint> findByUserId(Long userId);

    Optional<UnifiedEndpoint> findByUrlPath(String urlPath);
}
