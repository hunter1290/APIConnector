package com.joveo.apiconnector.transformer;

/** Thrown when a JSONata expression fails to parse or evaluate against a given input. */
public class TransformExecutionException extends RuntimeException {

    public TransformExecutionException(String message, Throwable cause) {
        super(message, cause);
    }
}
