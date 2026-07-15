package com.joveo.apiconnector.api;

/** Thrown when a live test is attempted with an {@link AuthType} not yet supported for live calls. */
public class UnsupportedAuthTypeException extends RuntimeException {

    public UnsupportedAuthTypeException(AuthType authType) {
        super("Live testing with " + authType + " isn't supported yet — save the API and validate "
                + "the upstream call manually, or use API_KEY/BEARER_TOKEN/BASIC/NONE for now.");
    }
}
