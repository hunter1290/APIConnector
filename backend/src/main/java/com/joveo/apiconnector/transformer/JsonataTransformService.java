package com.joveo.apiconnector.transformer;

import static com.dashjoin.jsonata.Jsonata.jsonata;

import org.springframework.stereotype.Component;

/**
 * Executes a {@link Transformer#getConfig()} JSONata expression against a parsed data
 * structure (a Jackson-decoded {@code Map}/{@code List}/primitive graph) to produce the
 * uniform-format output. This is the actual "format normalization" the product promises —
 * previously {@code config} was inert text with nothing behind it.
 */
@Component
public class JsonataTransformService {

    /** @throws TransformExecutionException if the expression fails to parse or evaluate. */
    public Object apply(String expression, Object data) {
        try {
            var compiled = jsonata(expression);
            return compiled.evaluate(data);
        } catch (RuntimeException e) {
            throw new TransformExecutionException("Transform failed: " + rootMessage(e), e);
        }
    }

    private String rootMessage(Throwable t) {
        Throwable cause = t;
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }
        return cause.getMessage() != null ? cause.getMessage() : t.getMessage();
    }
}
