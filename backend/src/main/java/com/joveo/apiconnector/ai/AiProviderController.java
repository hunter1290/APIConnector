package com.joveo.apiconnector.ai;

import com.joveo.apiconnector.ai.dto.AiInsightsResponse;
import com.joveo.apiconnector.ai.dto.AiProviderCatalogEntry;
import com.joveo.apiconnector.user.User;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The platform's fixed AI-provider catalog, and a standalone analyze endpoint. There is no
 * per-user provider CRUD — APIConnector supplies the credentials (AI_analysis/.env), not the
 * user, and using them is a Pro-only feature (see {@link AiAccessGuard}).
 */
@RestController
@RequestMapping("/api/ai-providers")
@Tag(name = "AI providers")
public class AiProviderController {

    private static final List<AiProviderCatalogEntry> CATALOG = List.of(
            new AiProviderCatalogEntry(AiProvider.ANTHROPIC.name(), "Claude (Anthropic)"),
            new AiProviderCatalogEntry(AiProvider.OPENAI.name(), "GPT (OpenAI)"));

    private final AiAccessGuard aiAccessGuard;
    private final AiAnalysisClient analysisClient;

    public AiProviderController(AiAccessGuard aiAccessGuard, AiAnalysisClient analysisClient) {
        this.aiAccessGuard = aiAccessGuard;
        this.analysisClient = analysisClient;
    }

    /** The available providers. Visible to everyone — using one is Pro-gated, viewing isn't. */
    @GetMapping
    public List<AiProviderCatalogEntry> catalog() {
        return CATALOG;
    }

    /** Standalone analysis of arbitrary data using a platform AI provider. Pro plan only. */
    @PostMapping("/{provider}/analyze")
    public AnalyzeResult analyze(@AuthenticationPrincipal User user,
                                 @PathVariable String provider,
                                 @RequestBody AnalyzeRequest request) {
        aiAccessGuard.requirePro(user);
        AiProvider aiProvider = parseProvider(provider);
        AiInsightsResponse insights = analysisClient.analyze(aiProvider, request.model(), request.data());
        return new AnalyzeResult(insights != null, insights);
    }

    private AiProvider parseProvider(String provider) {
        try {
            return AiProvider.valueOf(provider.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown AI provider: " + provider);
        }
    }

    public record AnalyzeRequest(Object data, String model) {
    }

    public record AnalyzeResult(boolean success, AiInsightsResponse insights) {
    }
}
