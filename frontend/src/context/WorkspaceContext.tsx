"use client";

// WORKSPACE-LEVEL state: the user's workspaces and the third-party APIs inside
// each. Starts EMPTY (no default workspace) — the UI shows an empty state with
// an "Add workspace" option. User-level concerns (plan, tokens) live in
// AccountContext. Hydrates/persists via localStorage in effects (no SSR mismatch).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ApiSet, ThirdPartyApi } from "@/types/connector";

const STORAGE_KEY = "apiconnector.workspaces.v2";

interface PersistedState {
  sets: ApiSet[];
  activeSetId: string | null;
}

interface WorkspaceContextValue {
  sets: ApiSet[];
  activeSet: ApiSet | undefined;
  activeSetId: string | null;
  hasWorkspaces: boolean;
  setActiveSet: (id: string) => void;
  addSet: (name: string, description?: string) => string;
  deleteSet: (id: string) => void;
  addApi: (api: Omit<ThirdPartyApi, "id" | "createdAt" | "uniformPath">) => void;
  removeApi: (apiId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "item"
  );
}

function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [sets, setSets] = useState<ApiSet[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);

  // Hydrate after mount (first render stays empty/deterministic).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed.sets) {
        setSets(parsed.sets);
        const valid = parsed.sets.some((s) => s.id === parsed.activeSetId);
        setActiveSetId(valid ? parsed.activeSetId : parsed.sets[0]?.id ?? null);
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ sets, activeSetId }));
    } catch {
      /* ignore quota errors */
    }
  }, [sets, activeSetId]);

  const setActiveSet = useCallback((id: string) => setActiveSetId(id), []);

  const addSet = useCallback((name: string, description?: string) => {
    const id = newId("ws");
    setSets((prev) => [...prev, { id, name, description, apis: [] }]);
    setActiveSetId(id);
    return id;
  }, []);

  const deleteSet = useCallback((id: string) => {
    setSets((prev) => {
      const next = prev.filter((s) => s.id !== id);
      setActiveSetId((current) => (current === id ? next[0]?.id ?? null : current));
      return next;
    });
  }, []);

  const addApi = useCallback(
    (api: Omit<ThirdPartyApi, "id" | "createdAt" | "uniformPath">) => {
      setSets((prev) =>
        prev.map((set) => {
          if (set.id !== activeSetId) return set;
          const full: ThirdPartyApi = {
            ...api,
            id: newId("api"),
            createdAt: new Date().toISOString(),
            uniformPath: `/v1/${slugify(set.name)}/${slugify(api.name)}`,
          };
          return { ...set, apis: [...set.apis, full] };
        }),
      );
    },
    [activeSetId],
  );

  const removeApi = useCallback(
    (apiId: string) => {
      setSets((prev) =>
        prev.map((set) =>
          set.id === activeSetId
            ? { ...set, apis: set.apis.filter((a) => a.id !== apiId) }
            : set,
        ),
      );
    },
    [activeSetId],
  );

  const activeSet = useMemo(
    () => sets.find((s) => s.id === activeSetId),
    [sets, activeSetId],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      sets,
      activeSet,
      activeSetId,
      hasWorkspaces: sets.length > 0,
      setActiveSet,
      addSet,
      deleteSet,
      addApi,
      removeApi,
    }),
    [sets, activeSet, activeSetId, setActiveSet, addSet, deleteSet, addApi, removeApi],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}
