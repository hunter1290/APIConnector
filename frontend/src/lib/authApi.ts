// Auth-specific API calls, built on the generic apiFetch helper.

import { apiFetch } from "@/lib/api";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserSummary,
} from "@/types/auth";

export function register(payload: RegisterRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Fetches the currently authenticated user (requires a valid token). */
export function getCurrentUser(): Promise<UserSummary> {
  return apiFetch<UserSummary>("/api/users/me");
}
