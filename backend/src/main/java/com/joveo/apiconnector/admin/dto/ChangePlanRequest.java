package com.joveo.apiconnector.admin.dto;

import com.joveo.apiconnector.user.UserPlan;
import jakarta.validation.constraints.NotNull;

/** Admin-only request to change a normal (USER) account's subscription plan. */
public record ChangePlanRequest(@NotNull UserPlan plan) {
}
