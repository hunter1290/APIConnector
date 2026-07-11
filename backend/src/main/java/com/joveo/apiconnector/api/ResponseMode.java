package com.joveo.apiconnector.api;

/** How the uniform endpoint returns data to the client. */
public enum ResponseMode {
    /** Return the normalized payload synchronously. */
    DIRECT,
    /** Push the result to a callback URL when ready. */
    WEBHOOK,
    /** Return the data enriched with AI analysis. */
    AI_INSIGHT
}
