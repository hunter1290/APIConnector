"use client";

// WORKSPACE-LEVEL state, now backed by the BACKEND (Postgres) instead of
// localStorage. Loads workspaces + APIs on mount, and every mutation calls the
// REST API so data actually persists. Only the "active workspace" selection is
// kept in localStorage (a pure UI preference).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type ApiDto,
  createApiReq,
  createWorkspace,
  deleteApiReq,
  deleteWorkspaceReq,
  listApis,
  listWorkspaces,
} from "@/lib/connectorApi";
import type {
  ApiSet,
  ConnectionStatus,
  ResponseMode,
  SecurityScheme,
  ThirdPartyApi,
} from "@/types/connector";

const ACTIVE_KEY = "apiconnector.activeWorkspace";

export interface AddApiInput {
  name: string;
  baseUrl: string;
  method: ThirdPartyApi["method"];
  format: ThirdPartyApi["format"];
  security: SecurityScheme;
  responseMode: ResponseMode;
  status: ConnectionStatus;
  authConfig?: string | null;
  headers?: string | null;
}

interface WorkspaceContextValue {
  sets: ApiSet[];
  activeSet: ApiSet | undefined;
  activeSetId: string | null;
  hasWorkspaces: boolean;
  loading: boolean;
  error: string | null;
  setActiveSet: (id: string) => void;
  addSet: (name: string, description?: string) => Promise<boolean>;
  deleteSet: (id: string) => Promise<void>;
  addApi: (api: AddApiInput) => Promise<boolean>;
  removeApi: (apiId: string) => Promise<void>;
  reload: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

/* ----------------------------- backend → UI ------------------------------ */

function mapSecurity(authType: string): SecurityScheme {
  return authType === "JWT" ? "BEARER_TOKEN" : (authType as SecurityScheme);
}

function mapStatus(status: string): ConnectionStatus {
  return status === "INACTIVE" ? "DRAFT" : (status as ConnectionStatus);
}

function toThirdPartyApi(a: ApiDto): ThirdPartyApi {
  return {
    id: String(a.id),
    name: a.name,
    baseUrl: a.baseUrl,
    method: a.httpMethod as ThirdPartyApi["method"],
    format: a.requestFormat as ThirdPartyApi["format"],
    security: mapSecurity(a.authType),
    responseMode: a.responseMode as ResponseMode,
    status: mapStatus(a.status),
    uniformPath: a.uniformPath ?? "",
    createdAt: a.createdAt,
  };
}

/* -------------------------------- provider -------------------------------- */

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [sets, setSets] = useState<ApiSet[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [workspaces, apis] = await Promise.all([listWorkspaces(), listApis()]);
      const mapped: ApiSet[] = workspaces.map((w) => ({
        id: String(w.id),
        name: w.name,
        description: w.description ?? undefined,
        apis: apis.filter((a) => a.workspaceId === w.id).map(toThirdPartyApi),
      }));
      setSets(mapped);
      setError(null);
      setActiveSetId((prev) => {
        const stored = typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_KEY) : null;
        if (prev && mapped.some((s) => s.id === prev)) return prev;
        if (stored && mapped.some((s) => s.id === stored)) return stored;
        return mapped[0]?.id ?? null;
      });
    } catch {
      setError("Could not load workspaces. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (activeSetId) window.localStorage.setItem(ACTIVE_KEY, activeSetId);
  }, [activeSetId]);

  const setActiveSet = useCallback((id: string) => setActiveSetId(id), []);

  const addSet = useCallback(async (name: string, description?: string) => {
    try {
      const w = await createWorkspace({ name, description });
      setSets((prev) => [
        ...prev,
        { id: String(w.id), name: w.name, description: w.description ?? undefined, apis: [] },
      ]);
      setActiveSetId(String(w.id));
      setError(null);
      return true;
    } catch {
      setError("Could not create workspace. Is the backend running?");
      return false;
    }
  }, []);

  const deleteSet = useCallback(async (id: string) => {
    try {
      await deleteWorkspaceReq(Number(id));
      setSets((prev) => {
        const next = prev.filter((s) => s.id !== id);
        setActiveSetId((cur) => (cur === id ? next[0]?.id ?? null : cur));
        return next;
      });
      setError(null);
    } catch {
      setError("Could not delete workspace.");
    }
  }, []);

  const addApi = useCallback(
    async (input: AddApiInput) => {
      if (!activeSetId) return false;
      try {
        const dto = await createApiReq({
          workspaceId: Number(activeSetId),
          name: input.name,
          baseUrl: input.baseUrl,
          httpMethod: input.method,
          requestFormat: input.format,
          authType: input.security,
          authConfig: input.authConfig ?? null,
          headers: input.headers ?? null,
          responseMode: input.responseMode,
          status: input.status,
        });
        setSets((prev) =>
          prev.map((s) =>
            s.id === activeSetId ? { ...s, apis: [...s.apis, toThirdPartyApi(dto)] } : s,
          ),
        );
        setError(null);
        return true;
      } catch {
        setError("Could not save API. Is the backend running?");
        return false;
      }
    },
    [activeSetId],
  );

  const removeApi = useCallback(
    async (apiId: string) => {
      try {
        await deleteApiReq(Number(apiId));
        setSets((prev) =>
          prev.map((s) =>
            s.id === activeSetId ? { ...s, apis: s.apis.filter((a) => a.id !== apiId) } : s,
          ),
        );
      } catch {
        setError("Could not remove API.");
      }
    },
    [activeSetId],
  );

  const activeSet = useMemo(() => sets.find((s) => s.id === activeSetId), [sets, activeSetId]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      sets,
      activeSet,
      activeSetId,
      hasWorkspaces: sets.length > 0,
      loading,
      error,
      setActiveSet,
      addSet,
      deleteSet,
      addApi,
      removeApi,
      reload,
    }),
    [sets, activeSet, activeSetId, loading, error, setActiveSet, addSet, deleteSet, addApi, removeApi, reload],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}
