package com.joveo.apiconnector.usage;

import com.joveo.apiconnector.api.ApiDetail;
import com.joveo.apiconnector.api.ApiDetailRepository;
import com.joveo.apiconnector.common.exception.ResourceNotFoundException;
import com.joveo.apiconnector.usage.dto.AccountUsageResponse;
import com.joveo.apiconnector.usage.dto.RecordUsageRequest;
import com.joveo.apiconnector.usage.dto.WorkspaceUsageResponse;
import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.user.UserPlan;
import com.joveo.apiconnector.workspace.Workspace;
import com.joveo.apiconnector.workspace.WorkspaceRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records AI-token consumption events and aggregates them into per-account /
 * per-workspace usage. Aggregation is reused by the admin monitoring API.
 */
@Service
public class UsageService {

    private final TokenUsageRepository tokenUsageRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ApiDetailRepository apiDetailRepository;

    public UsageService(TokenUsageRepository tokenUsageRepository,
                        WorkspaceRepository workspaceRepository,
                        ApiDetailRepository apiDetailRepository) {
        this.tokenUsageRepository = tokenUsageRepository;
        this.workspaceRepository = workspaceRepository;
        this.apiDetailRepository = apiDetailRepository;
    }

    /** Records a consumption event for the caller, validating any referenced ownership. */
    @Transactional
    public AccountUsageResponse record(User caller, RecordUsageRequest request) {
        Workspace workspace = null;
        if (request.workspaceId() != null) {
            workspace = workspaceRepository.findByIdAndUserId(request.workspaceId(), caller.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Workspace", request.workspaceId()));
        }
        ApiDetail apiDetail = null;
        if (request.apiDetailId() != null) {
            apiDetail = apiDetailRepository.findByIdAndUserId(request.apiDetailId(), caller.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("ApiDetail", request.apiDetailId()));
        }

        TokenUsage usage = TokenUsage.builder()
                .user(caller)
                .workspace(workspace)
                .apiDetail(apiDetail)
                .tokens(request.tokens())
                .source(request.source() != null ? request.source() : UsageSource.AI_INSIGHT)
                .description(request.description())
                .build();
        tokenUsageRepository.save(usage);

        return accountUsage(caller);
    }

    /** Full AI-token position for an account, including a per-workspace breakdown. */
    @Transactional(readOnly = true)
    public AccountUsageResponse accountUsage(User account) {
        long allotment = UserPlan.freeTokensFor(account.getPlan());
        long used = tokenUsageRepository.sumTokensByUserId(account.getId());

        List<WorkspaceUsageResponse> workspaces =
                workspaceRepository.findByUserIdOrderByCreatedAtAsc(account.getId()).stream()
                        .map(w -> new WorkspaceUsageResponse(
                                w.getId(),
                                w.getName(),
                                apiDetailRepository.countByWorkspaceId(w.getId()),
                                tokenUsageRepository.sumTokensByWorkspaceId(w.getId())))
                        .toList();

        return new AccountUsageResponse(
                account.getId(),
                account.getEmail(),
                account.getFullName(),
                account.getPlan() != null ? account.getPlan().name() : null,
                allotment,
                used,
                Math.max(0, allotment - used),
                workspaces);
    }

    /** Tokens consumed by an account across all workspaces (admin summaries). */
    @Transactional(readOnly = true)
    public long tokensUsedByAccount(Long userId) {
        return tokenUsageRepository.sumTokensByUserId(userId);
    }

    /** Tokens consumed within a single workspace (admin summaries). */
    @Transactional(readOnly = true)
    public long tokensUsedByWorkspace(Long workspaceId) {
        return tokenUsageRepository.sumTokensByWorkspaceId(workspaceId);
    }

    /** Platform-wide total tokens consumed. */
    @Transactional(readOnly = true)
    public long totalTokensUsed() {
        return tokenUsageRepository.sumAllTokens();
    }
}
