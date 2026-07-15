package com.joveo.apiconnector.ai;

import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.user.UserPlan;
import org.springframework.stereotype.Component;

/**
 * AI analysis is a Pro-only feature — APIConnector supplies the provider credentials (see
 * AI_analysis/.env), not the user, so access is gated by plan rather than by who owns a key.
 */
@Component
public class AiAccessGuard {

    /** @throws IllegalArgumentException (→ 400) if the caller isn't on the PRO plan. */
    public void requirePro(User user) {
        if (user.getPlan() != UserPlan.PRO) {
            throw new IllegalArgumentException("AI analysis is available on the Pro plan only.");
        }
    }
}
