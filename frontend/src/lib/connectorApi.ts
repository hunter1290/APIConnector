// Typed calls to the backend connector endpoints, built on the shared apiFetch
// (which attaches the JWT). These replace the old localStorage-only mock so that
// workspaces and APIs persist to Postgres via the backend.

import { apiFetch } from "@/lib/api";

/* ------------------------------ backend DTOs ------------------------------ */

export interface WorkspaceDto {
  id: number;
  name: string;
  description: string | null;
  apiCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiDto {
  id: number;
  workspaceId: number | null;
  name: string;
  description: string | null;
  baseUrl: string;
  httpMethod: string;
  requestFormat: string;
  authType: string;
  headers: string | null;
  responseMode: string;
  status: string;
  uniformPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiBody {
  workspaceId: number;
  name: string;
  baseUrl: string;
  httpMethod: string;
  requestFormat: string;
  authType: string;
  authConfig?: string | null;
  headers?: string | null;
  responseMode: string;
  status?: string;
}

/* ------------------------------- workspaces ------------------------------- */

export function listWorkspaces() {
  return apiFetch<WorkspaceDto[]>("/api/workspaces");
}

export function createWorkspace(body: { name: string; description?: string }) {
  return apiFetch<WorkspaceDto>("/api/workspaces", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteWorkspaceReq(id: number) {
  return apiFetch<void>(`/api/workspaces/${id}`, { method: "DELETE" });
}

/* ---------------------------------- apis ---------------------------------- */

export function listApis() {
  return apiFetch<ApiDto[]>("/api/apis");
}

export function createApiReq(body: CreateApiBody) {
  return apiFetch<ApiDto>("/api/apis", { method: "POST", body: JSON.stringify(body) });
}

export function deleteApiReq(id: number) {
  return apiFetch<void>(`/api/apis/${id}`, { method: "DELETE" });
}

/* -------------------------------- api testing ------------------------------ */

export interface ApiTestRequestBody {
  baseUrl: string;
  httpMethod: string;
  requestFormat: string;
  authType: string;
  authConfig?: string | null;
  headers?: string | null;
}

export interface ApiTestResult {
  success: boolean;
  httpStatus: number | null;
  latencyMs: number;
  responseBody: string | null;
  errorMessage: string | null;
}

/** Ad-hoc test of a not-yet-saved upstream configuration. Credentials are transient. */
export function testApi(body: ApiTestRequestBody) {
  return apiFetch<ApiTestResult>("/api/apis/test", { method: "POST", body: JSON.stringify(body) });
}

/** Tests an already-saved API using its persisted config; no credentials leave the browser. */
export function testSavedApi(id: number) {
  return apiFetch<ApiTestResult>(`/api/apis/${id}/test`, { method: "POST" });
}

/* ---------------------------------- usage ---------------------------------- */

export interface WorkspaceUsageDto {
  id: number;
  name: string;
  apiCount: number;
  tokensUsed: number;
}

export interface AccountUsageDto {
  accountId: number;
  email: string;
  fullName: string;
  plan: string | null;
  tokenAllotment: number;
  tokensUsed: number;
  tokensRemaining: number;
  workspaces: WorkspaceUsageDto[];
}

export function getMyUsage() {
  return apiFetch<AccountUsageDto>("/api/usage/me");
}

export interface RecordUsageBody {
  workspaceId?: number;
  apiDetailId?: number;
  tokens: number;
  source?: string;
  description?: string;
}

export function recordUsage(body: RecordUsageBody) {
  return apiFetch<AccountUsageDto>("/api/usage", { method: "POST", body: JSON.stringify(body) });
}

/* ---------------------------------- admin ---------------------------------- */

export interface AdminAccountDto {
  accountId: number;
  email: string;
  fullName: string;
  plan: string | null;
  workspaceCount: number;
  apiCount: number;
  tokenAllotment: number;
  tokensUsed: number;
  tokensRemaining: number;
}

export function listAdminAccounts() {
  return apiFetch<AdminAccountDto[]>("/api/admin/accounts");
}

export function changeAccountPlan(id: number, plan: string) {
  return apiFetch<AdminAccountDto>(`/api/admin/accounts/${id}/plan`, {
    method: "PATCH",
    body: JSON.stringify({ plan }),
  });
}
