package com.joveo.apiconnector.transformer;

import com.joveo.apiconnector.transformer.dto.TransformerRequest;
import com.joveo.apiconnector.transformer.dto.TransformerResponse;
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
import org.springframework.web.bind.annotation.RestController;

/** CRUD endpoints for transformer objects (normalize upstream data → uniform form). */
@RestController
@RequestMapping("/api/transformers")
@Tag(name = "Transformers")
public class TransformerController {

    private final TransformerService transformerService;

    public TransformerController(TransformerService transformerService) {
        this.transformerService = transformerService;
    }

    @GetMapping
    public List<TransformerResponse> list(@AuthenticationPrincipal User user) {
        return transformerService.list(user);
    }

    @GetMapping("/{id}")
    public TransformerResponse get(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return transformerService.get(user, id);
    }

    @PostMapping
    public ResponseEntity<TransformerResponse> create(@AuthenticationPrincipal User user,
                                                      @Valid @RequestBody TransformerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transformerService.create(user, request));
    }

    @PutMapping("/{id}")
    public TransformerResponse update(@AuthenticationPrincipal User user,
                                      @PathVariable Long id,
                                      @Valid @RequestBody TransformerRequest request) {
        return transformerService.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        transformerService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
