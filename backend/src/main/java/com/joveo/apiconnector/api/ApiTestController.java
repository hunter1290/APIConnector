package com.joveo.apiconnector.api;

import com.joveo.apiconnector.api.dto.ApiTestRequest;
import com.joveo.apiconnector.api.dto.ApiTestResponse;
import com.joveo.apiconnector.user.User;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Live, synchronous upstream test calls — validate a connection before or after saving it. */
@RestController
@RequestMapping("/api/apis")
@Tag(name = "API testing")
public class ApiTestController {

    private final ApiTestService apiTestService;

    public ApiTestController(ApiTestService apiTestService) {
        this.apiTestService = apiTestService;
    }

    /** Ad-hoc test of a not-yet-saved upstream configuration. */
    @PostMapping("/test")
    public ApiTestResponse test(@AuthenticationPrincipal User user, @Valid @RequestBody ApiTestRequest request) {
        return apiTestService.test(user, request);
    }

    /** Tests an already-saved API using its persisted config (credentials never leave the server). */
    @PostMapping("/{id}/test")
    public ApiTestResponse testSaved(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return apiTestService.testSaved(user, id);
    }
}
