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
  /** Platform AI provider ("ANTHROPIC"/"OPENAI") attached for AI_INSIGHT analysis. Pro plan only. */
  aiProvider: string | null;
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
  aiProvider?: string | null;
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
  /** Raw request body to send (ignored for GET); e.g. a sample JSON payload to test with. */
  body?: string | null;
  /** If set and the call succeeds, the response is analyzed by this platform AI provider. Pro plan only. */
  aiProvider?: string | null;
}

export interface AiInsights {
  anomalies: number;
  quality: "good" | "fair" | "poor";
  summary: string;
  recommendations: string[];
}

export interface ApiTestResult {
  success: boolean;
  httpStatus: number | null;
  latencyMs: number;
  responseBody: string | null;
  errorMessage: string | null;
  insights: AiInsights | null;
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
  enabled: boolean;
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

export function setAccountEnabled(id: number, enabled: boolean) {
  return apiFetch<AdminAccountDto>(`/api/admin/accounts/${id}/enabled`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}

/* ------------------------------- ai providers ------------------------------ */
// Platform-owned: APIConnector supplies the AI provider credentials (AI_analysis/.env), not
// the user. This is a fixed, read-only catalog — no create/delete/API-key entry anywhere.
// Using a provider (attaching one, or the standalone analyze call) is Pro-plan only.

export interface AiProviderCatalogEntry {
  provider: "ANTHROPIC" | "OPENAI";
  label: string;
}

/** The platform's available AI providers. Visible to everyone; *using* one is Pro-gated. */
export function listAiProviderCatalog() {
  return apiFetch<AiProviderCatalogEntry[]>("/api/ai-providers");
}

/** Standalone analysis of arbitrary data using a platform AI provider. Pro plan only (403/400 otherwise). */
export function analyzeWithProvider(provider: string, data: unknown) {
  return apiFetch<{ success: boolean; insights: AiInsights | null }>(`/api/ai-providers/${provider}/analyze`, {
    method: "POST",
    body: JSON.stringify({ data }),
  });
}

/* ------------------------------- plan requests ------------------------------ */

export interface PlanUpgradeRequestDto {
  id: number;
  accountId: number;
  email: string;
  fullName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  resolvedAt: string | null;
  resolvedByEmail: string | null;
}

/** Requests a plan upgrade for the caller. */
export function requestPlanUpgrade() {
  return apiFetch<PlanUpgradeRequestDto>("/api/plan-requests", { method: "POST" });
}

/** The caller's latest plan-upgrade request, or undefined if they've never requested (204). */
export function getMyPlanRequest() {
  return apiFetch<PlanUpgradeRequestDto | undefined>("/api/plan-requests/me");
}

export function listPendingPlanRequests() {
  return apiFetch<PlanUpgradeRequestDto[]>("/api/admin/plan-requests");
}

export function approvePlanRequest(id: number) {
  return apiFetch<PlanUpgradeRequestDto>(`/api/admin/plan-requests/${id}/approve`, { method: "POST" });
}

export function rejectPlanRequest(id: number) {
  return apiFetch<PlanUpgradeRequestDto>(`/api/admin/plan-requests/${id}/reject`, { method: "POST" });
}
