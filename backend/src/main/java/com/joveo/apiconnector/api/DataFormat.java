package com.joveo.apiconnector.api;

/** Payload format produced/consumed by an upstream API. Normalized into a uniform format by a {@code Transformer}. */
public enum DataFormat {
    JSON,
    XML,
    CSV,
    SOAP,
    FORM_URLENCODED
}
