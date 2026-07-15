package com.joveo.apiconnector.api;

import com.joveo.apiconnector.api.dto.ApiDetailRequest;
import com.joveo.apiconnector.api.dto.ApiDetailResponse;
import com.joveo.apiconnector.user.User;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** CRUD endpoints for the authenticated user's third-party APIs. */
@RestController
@RequestMapping("/api/apis")
@Tag(name = "Third-party APIs")
public class ApiDetailController {

    private final ApiDetailService apiDetailService;

    public ApiDetailController(ApiDetailService apiDetailService) {
        this.apiDetailService = apiDetailService;
    }

    /** List APIs; optionally filter by {@code workspaceId}. */
    @GetMapping
    public List<ApiDetailResponse> list(@AuthenticationPrincipal User user,
                                        @RequestParam(required = false) Long workspaceId) {
        return apiDetailService.list(user, workspaceId);
    }

    @GetMapping("/{id}")
    public ApiDetailResponse get(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return apiDetailService.get(user, id);
    }

    @PostMapping
    public ResponseEntity<ApiDetailResponse> create(@AuthenticationPrincipal User user,
                                                    @Valid @RequestBody ApiDetailRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(apiDetailService.create(user, request));
    }

    @PutMapping("/{id}")
    public ApiDetailResponse update(@AuthenticationPrincipal User user,
                                    @PathVariable Long id,
                                    @Valid @RequestBody ApiDetailRequest request) {
        return apiDetailService.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        apiDetailService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
