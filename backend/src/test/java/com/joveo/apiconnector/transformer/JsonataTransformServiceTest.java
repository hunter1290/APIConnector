package com.joveo.apiconnector.transformer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Pure unit tests for {@link JsonataTransformService} — no Spring context, no DB. */
class JsonataTransformServiceTest {

    private final JsonataTransformService service = new JsonataTransformService();

    @Test
    @DisplayName("apply extracts a top-level field")
    void extractsTopLevelField() {
        Object data = Map.of("name", "Acme Orders");

        Object result = service.apply("name", data);

        assertThat(result).isEqualTo("Acme Orders");
    }

    @Test
    @DisplayName("apply extracts a nested path")
    void extractsNestedPath() {
        Object data = Map.of("user", Map.of("id", 42));

        Object result = service.apply("user.id", data);

        assertThat(result).isEqualTo(42);
    }

    @Test
    @DisplayName("apply aggregates across an array")
    void aggregatesAcrossArray() {
        Object data = Map.of("example", List.of(
                Map.of("value", 4),
                Map.of("value", 7),
                Map.of("value", 13)));

        Object result = service.apply("$sum(example.value)", data);

        assertThat(result).isEqualTo(24);
    }

    @Test
    @DisplayName("apply builds a reshaped object (the actual 'unified format' use case)")
    void reshapesObject() {
        Object data = Map.of("id", "A-1042", "total", 249.0, "status", "shipped");

        Object result = service.apply("{\"orderId\": id, \"amount\": total}", data);

        assertThat(result).isInstanceOfSatisfying(Map.class, m -> {
            assertThat(m).containsEntry("orderId", "A-1042");
            assertThat(m).containsEntry("amount", 249.0);
        });
    }

    @Test
    @DisplayName("apply throws TransformExecutionException for a malformed expression")
    void malformedExpressionThrows() {
        assertThatThrownBy(() -> service.apply("a.(", Map.of()))
                .isInstanceOf(TransformExecutionException.class);
    }
}
