package com.joveo.apiconnector.usage;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TokenUsageRepository extends JpaRepository<TokenUsage, Long> {

    /** Total AI tokens consumed by an account across all its workspaces. */
    @Query("select coalesce(sum(t.tokens), 0) from TokenUsage t where t.user.id = :userId")
    long sumTokensByUserId(@Param("userId") Long userId);

    /** Total AI tokens consumed within a single workspace. */
    @Query("select coalesce(sum(t.tokens), 0) from TokenUsage t where t.workspace.id = :workspaceId")
    long sumTokensByWorkspaceId(@Param("workspaceId") Long workspaceId);

    /** Platform-wide total AI tokens consumed. */
    @Query("select coalesce(sum(t.tokens), 0) from TokenUsage t")
    long sumAllTokens();
}
