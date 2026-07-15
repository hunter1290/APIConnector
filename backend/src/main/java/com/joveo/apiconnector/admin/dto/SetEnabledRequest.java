package com.joveo.apiconnector.admin.dto;

import jakarta.validation.constraints.NotNull;

/** Admin-only request to enable or disable a normal account's login access. */
public record SetEnabledRequest(@NotNull Boolean enabled) {
}
