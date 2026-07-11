package com.joveo.apiconnector.user;

/**
 * Subscription tier for normal (non-admin) users.
 * Admin accounts leave this {@code null}.
 */
public enum UserPlan {
    REGULAR,
    PRO
}
