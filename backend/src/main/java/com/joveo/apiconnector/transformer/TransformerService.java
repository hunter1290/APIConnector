package com.joveo.apiconnector.transformer;

import com.joveo.apiconnector.api.ApiDetail;
import com.joveo.apiconnector.api.ApiDetailRepository;
import com.joveo.apiconnector.common.exception.ResourceNotFoundException;
import com.joveo.apiconnector.transformer.dto.TransformerRequest;
import com.joveo.apiconnector.transformer.dto.TransformerResponse;
import com.joveo.apiconnector.transformer.dto.TransformerTestResponse;
import com.joveo.apiconnector.user.User;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** CRUD for transformer objects, scoped to the authenticated user (via their APIs). */
@Service
public class TransformerService {

    private final TransformerRepository transformerRepository;
    private final ApiDetailRepository apiDetailRepository;
    private final JsonataTransformService jsonataTransformService;

    public TransformerService(TransformerRepository transformerRepository,
                              ApiDetailRepository apiDetailRepository,
                              JsonataTransformService jsonataTransformService) {
        this.transformerRepository = transformerRepository;
        this.apiDetailRepository = apiDetailRepository;
        this.jsonataTransformService = jsonataTransformService;
    }

    @Transactional(readOnly = true)
    public List<TransformerResponse> list(User user) {
        return transformerRepository.findByApiDetailUserIdOrderByCreatedAtAsc(user.getId()).stream()
                .map(TransformerResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TransformerResponse get(User user, Long id) {
        return TransformerResponse.from(require(user, id));
    }

    @Transactional
    public TransformerResponse create(User user, TransformerRequest request) {
        ApiDetail api = requireApi(user, request.apiDetailId());
        Transformer t = Transformer.builder()
                .apiDetail(api)
                .name(request.name())
                .description(request.description())
                .sourceFormat(request.sourceFormat())
                .targetFormat(request.targetFormat())
                .config(request.config())
                .build();
        transformerRepository.save(t);
        return TransformerResponse.from(t);
    }

    @Transactional
    public TransformerResponse update(User user, Long id, TransformerRequest request) {
        Transformer t = require(user, id);
        ApiDetail api = requireApi(user, request.apiDetailId());
        t.setApiDetail(api);
        t.setName(request.name());
        t.setDescription(request.description());
        t.setSourceFormat(request.sourceFormat());
        t.setTargetFormat(request.targetFormat());
        t.setConfig(request.config());
        transformerRepository.save(t);
        return TransformerResponse.from(t);
    }

    @Transactional
    public void delete(User user, Long id) {
        transformerRepository.delete(require(user, id));
    }

    /** Ad-hoc: tries a not-yet-saved (or being-edited) expression against pasted sample data. */
    @Transactional(readOnly = true)
    public TransformerTestResponse testAdHoc(String config, Object sampleData) {
        return runTest(config, sampleData);
    }

    /** Tries a saved transformer's expression against pasted sample data. */
    @Transactional(readOnly = true)
    public TransformerTestResponse testSaved(User user, Long id, Object sampleData) {
        Transformer t = require(user, id);
        return runTest(t.getConfig(), sampleData);
    }

    private TransformerTestResponse runTest(String config, Object sampleData) {
        try {
            Object result = jsonataTransformService.apply(config, sampleData);
            return new TransformerTestResponse(true, result, null);
        } catch (TransformExecutionException e) {
            return new TransformerTestResponse(false, null, e.getMessage());
        }
    }

    private Transformer require(User user, Long id) {
        return transformerRepository.findByIdAndApiDetailUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transformer", id));
    }

    private ApiDetail requireApi(User user, Long apiDetailId) {
        return apiDetailRepository.findByIdAndUserId(apiDetailId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ApiDetail", apiDetailId));
    }
}
