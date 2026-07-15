package com.joveo.apiconnector.usage;

/** What consumed the AI tokens recorded in a {@link TokenUsage} event. */
public enum UsageSource {
    /** Tokens spent enriching an upstream response (ResponseMode.AI_INSIGHT). */
    AI_INSIGHT,
    /** Tokens spent by an AI-assisted transformer. */
    TRANSFORM,
    /** Anything else / manual adjustment. */
    OTHER
}
