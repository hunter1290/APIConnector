package com.joveo.apiconnector.workspace;

import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.workspace.dto.WorkspaceRequest;
import com.joveo.apiconnector.workspace.dto.WorkspaceResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** CRUD endpoints for the authenticated user's workspaces. */
@RestController
@RequestMapping("/api/workspaces")
@Tag(name = "Workspaces")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @GetMapping
    public List<WorkspaceResponse> list(@AuthenticationPrincipal User user) {
        return workspaceService.list(user);
    }

    @GetMapping("/{id}")
    public WorkspaceResponse get(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return workspaceService.get(user, id);
    }

    @PostMapping
    public ResponseEntity<WorkspaceResponse> create(@AuthenticationPrincipal User user,
                                                    @Valid @RequestBody WorkspaceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workspaceService.create(user, request));
    }

    @PutMapping("/{id}")
    public WorkspaceResponse update(@AuthenticationPrincipal User user,
                                    @PathVariable Long id,
                                    @Valid @RequestBody WorkspaceRequest request) {
        return workspaceService.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        workspaceService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
