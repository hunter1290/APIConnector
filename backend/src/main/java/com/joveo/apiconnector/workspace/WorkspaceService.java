package com.joveo.apiconnector.workspace;

import com.joveo.apiconnector.api.ApiDetail;
import com.joveo.apiconnector.api.ApiDetailRepository;
import com.joveo.apiconnector.common.exception.ResourceNotFoundException;
import com.joveo.apiconnector.transformer.TransformerRepository;
import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.workspace.dto.WorkspaceRequest;
import com.joveo.apiconnector.workspace.dto.WorkspaceResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** CRUD for workspaces, always scoped to the authenticated user. */
@Service
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final ApiDetailRepository apiDetailRepository;
    private final TransformerRepository transformerRepository;

    public WorkspaceService(WorkspaceRepository workspaceRepository,
                            ApiDetailRepository apiDetailRepository,
                            TransformerRepository transformerRepository) {
        this.workspaceRepository = workspaceRepository;
        this.apiDetailRepository = apiDetailRepository;
        this.transformerRepository = transformerRepository;
    }

    @Transactional(readOnly = true)
    public List<WorkspaceResponse> list(User user) {
        return workspaceRepository.findByUserIdOrderByCreatedAtAsc(user.getId()).stream()
                .map(w -> WorkspaceResponse.from(w, apiDetailRepository.countByWorkspaceId(w.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkspaceResponse get(User user, Long id) {
        Workspace w = require(user, id);
        return WorkspaceResponse.from(w, apiDetailRepository.countByWorkspaceId(w.getId()));
    }

    @Transactional
    public WorkspaceResponse create(User user, WorkspaceRequest request) {
        Workspace w = Workspace.builder()
                .user(user)
                .name(request.name())
                .description(request.description())
                .build();
        workspaceRepository.save(w);
        return WorkspaceResponse.from(w, 0);
    }

    @Transactional
    public WorkspaceResponse update(User user, Long id, WorkspaceRequest request) {
        Workspace w = require(user, id);
        w.setName(request.name());
        w.setDescription(request.description());
        workspaceRepository.save(w);
        return WorkspaceResponse.from(w, apiDetailRepository.countByWorkspaceId(w.getId()));
    }

    /** Deletes a workspace and cascades to its APIs and their transformers. */
    @Transactional
    public void delete(User user, Long id) {
        Workspace w = require(user, id);
        List<ApiDetail> apis = apiDetailRepository.findByWorkspaceIdOrderByCreatedAtAsc(id);
        apis.forEach(api -> transformerRepository.deleteByApiDetailId(api.getId()));
        apiDetailRepository.deleteAll(apis);
        workspaceRepository.delete(w);
    }

    /** Loads a workspace owned by the user or throws 404. Used by other services too. */
    @Transactional(readOnly = true)
    public Workspace require(User user, Long id) {
        return workspaceRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", id));
    }
}
