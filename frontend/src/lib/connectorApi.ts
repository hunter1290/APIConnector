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
