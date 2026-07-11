package com.joveo.apiconnector.api;

import com.joveo.apiconnector.api.dto.ApiDetailRequest;
import com.joveo.apiconnector.api.dto.ApiDetailResponse;
import com.joveo.apiconnector.common.SlugUtil;
import com.joveo.apiconnector.common.exception.ResourceNotFoundException;
import com.joveo.apiconnector.transformer.TransformerRepository;
import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.workspace.Workspace;
import com.joveo.apiconnector.workspace.WorkspaceService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** CRUD for third-party APIs, scoped to the authenticated user and their workspaces. */
@Service
public class ApiDetailService {

    private final ApiDetailRepository apiDetailRepository;
    private final TransformerRepository transformerRepository;
    private final WorkspaceService workspaceService;

    public ApiDetailService(ApiDetailRepository apiDetailRepository,
                            TransformerRepository transformerRepository,
                            WorkspaceService workspaceService) {
        this.apiDetailRepository = apiDetailRepository;
        this.transformerRepository = transformerRepository;
        this.workspaceService = workspaceService;
    }

    @Transactional(readOnly = true)
    public List<ApiDetailResponse> list(User user, Long workspaceId) {
        List<ApiDetail> apis;
        if (workspaceId != null) {
            workspaceService.require(user, workspaceId); // ownership check
            apis = apiDetailRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspaceId);
        } else {
            apis = apiDetailRepository.findByUserIdOrderByCreatedAtAsc(user.getId());
        }
        return apis.stream().map(ApiDetailResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ApiDetailResponse get(User user, Long id) {
        return ApiDetailResponse.from(require(user, id));
    }

    @Transactional
    public ApiDetailResponse create(User user, ApiDetailRequest request) {
        Workspace workspace = workspaceService.require(user, request.workspaceId());
        ApiDetail api = ApiDetail.builder()
                .user(user)
                .workspace(workspace)
                .name(request.name())
                .description(request.description())
                .baseUrl(request.baseUrl())
                .httpMethod(request.httpMethod())
                .requestFormat(request.requestFormat())
                .authType(request.authType())
                .authConfig(request.authConfig())
                .headers(request.headers())
                .responseMode(request.responseMode())
                .status(request.status() != null ? request.status() : ConnectionStatus.DRAFT)
                .uniformPath(uniformPath(workspace, request.name()))
                .build();
        apiDetailRepository.save(api);
        return ApiDetailResponse.from(api);
    }

    @Transactional
    public ApiDetailResponse update(User user, Long id, ApiDetailRequest request) {
        ApiDetail api = require(user, id);
        Workspace workspace = workspaceService.require(user, request.workspaceId());
        api.setWorkspace(workspace);
        api.setName(request.name());
        api.setDescription(request.description());
        api.setBaseUrl(request.baseUrl());
        api.setHttpMethod(request.httpMethod());
        api.setRequestFormat(request.requestFormat());
        api.setAuthType(request.authType());
        if (request.authConfig() != null) {
            api.setAuthConfig(request.authConfig());
        }
        api.setHeaders(request.headers());
        api.setResponseMode(request.responseMode());
        if (request.status() != null) {
            api.setStatus(request.status());
        }
        api.setUniformPath(uniformPath(workspace, request.name()));
        apiDetailRepository.save(api);
        return ApiDetailResponse.from(api);
    }

    @Transactional
    public void delete(User user, Long id) {
        ApiDetail api = require(user, id);
        transformerRepository.deleteByApiDetailId(api.getId());
        apiDetailRepository.delete(api);
    }

    private ApiDetail require(User user, Long id) {
        return apiDetailRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ApiDetail", id));
    }

    private String uniformPath(Workspace workspace, String apiName) {
        return "/v1/" + SlugUtil.slugify(workspace.getName()) + "/" + SlugUtil.slugify(apiName);
    }
}
