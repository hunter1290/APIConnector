package com.joveo.apiconnector.planrequest;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlanUpgradeRequestRepository extends JpaRepository<PlanUpgradeRequest, Long> {

    Optional<PlanUpgradeRequest> findByUserIdAndStatus(Long userId, PlanRequestStatus status);

    List<PlanUpgradeRequest> findByStatusOrderByRequestedAtAsc(PlanRequestStatus status);

    Optional<PlanUpgradeRequest> findTopByUserIdOrderByRequestedAtDesc(Long userId);
}
