package com.joveo.apiconnector.common.exception;

/** Thrown when a requested resource does not exist or is not owned by the caller. */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " not found: " + id);
    }
}
