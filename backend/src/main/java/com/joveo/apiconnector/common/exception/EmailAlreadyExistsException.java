package com.joveo.apiconnector.common.exception;

/** Thrown when registration is attempted with an email that already exists. */
public class EmailAlreadyExistsException extends RuntimeException {

    public EmailAlreadyExistsException(String email) {
        super("Email already registered: " + email);
    }
}
