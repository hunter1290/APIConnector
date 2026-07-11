"use client";

// USER-LEVEL state (not workspace-scoped): subscription plan and free-token
// balance. Deterministic seed on first render; hydrate/persist via localStorage
// in effects so there is no SSR/client hydration mismatch.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Plan = "REGULAR" | "PRO";

interface Tokens {
  total: number;
  used: number;
}

interface AccountState {
  plan: Plan;
  tokens: Tokens;
}

const STORAGE_KEY = "apiconnector.account.v1";

/** Free-token allotment per plan. */
export const PLAN_TOKENS: Record<Plan, number> = {
  REGULAR: 10000,
  PRO: 100000,
};

export const PLAN_LABELS: Record<Plan, string> = {
  REGULAR: "Regular",
  PRO: "Pro",
};

const SEED: AccountState = { plan: "REGULAR", tokens: { total: PLAN_TOKENS.REGULAR, used: 0 } };

interface AccountContextValue {
  plan: Plan;
  tokens: Tokens;
  tokensRemaining: number;
  consumeTokens: (amount: number) => void;
  upgradePlan: (plan: Plan) => void;
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>(SEED.plan);
  const [tokens, setTokens] = useState<Tokens>(SEED.tokens);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as AccountState;
      if (parsed.plan) setPlan(parsed.plan);
      if (parsed.tokens) setTokens(parsed.tokens);
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ plan, tokens }));
    } catch {
      /* ignore quota errors */
    }
  }, [plan, tokens]);

  const consumeTokens = useCallback((amount: number) => {
    setTokens((prev) => ({ ...prev, used: Math.min(prev.total, prev.used + amount) }));
  }, []);

  const upgradePlan = useCallback((next: Plan) => {
    setPlan(next);
    setTokens((prev) => ({ total: PLAN_TOKENS[next], used: Math.min(prev.used, PLAN_TOKENS[next]) }));
  }, []);

  const value = useMemo<AccountContextValue>(
    () => ({
      plan,
      tokens,
      tokensRemaining: Math.max(0, tokens.total - tokens.used),
      consumeTokens,
      upgradePlan,
    }),
    [plan, tokens, consumeTokens, upgradePlan],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within an AccountProvider");
  return ctx;
}
