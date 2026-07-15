"use client";

// USER-LEVEL state (not workspace-scoped): subscription plan and free-token
// balance. Backed by the backend (/api/usage/me) — plan changes are admin-only
// (see /dashboard/admin), so this context is read-only from the normal user's
// side and just reflects whatever the backend reports.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMyUsage } from "@/lib/connectorApi";

export type Plan = "REGULAR" | "PRO";

interface Tokens {
  total: number;
  used: number;
}

/** Free-token allotment per plan (mirrors the backend's UserPlan.freeTokens()). */
export const PLAN_TOKENS: Record<Plan, number> = {
  REGULAR: 10000,
  PRO: 100000,
};

export const PLAN_LABELS: Record<Plan, string> = {
  REGULAR: "Regular",
  PRO: "Pro",
};

interface AccountContextValue {
  plan: Plan;
  tokens: Tokens;
  tokensRemaining: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>("REGULAR");
  const [tokens, setTokens] = useState<Tokens>({ total: PLAN_TOKENS.REGULAR, used: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const usage = await getMyUsage();
      setPlan((usage.plan as Plan) ?? "REGULAR");
      setTokens({ total: usage.tokenAllotment, used: usage.tokensUsed });
      setError(null);
    } catch {
      setError("Could not load account usage. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<AccountContextValue>(
    () => ({
      plan,
      tokens,
      tokensRemaining: Math.max(0, tokens.total - tokens.used),
      loading,
      error,
      refresh,
    }),
    [plan, tokens, loading, error, refresh],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within an AccountProvider");
  return ctx;
}
