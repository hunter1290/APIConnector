"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PLAN_LABELS, type Plan } from "@/context/AccountContext";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import {
  changeAccountPlan,
  listAdminAccounts,
  type AdminAccountDto,
} from "@/lib/connectorApi";
import { formatNumber } from "@/lib/format";

const PLANS: Plan[] = ["REGULAR", "PRO"];

export default function AdminPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AdminAccountDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<number, Plan>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAdminAccounts();
      setAccounts(data);
      setError(null);
    } catch {
      setError("Could not load accounts. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "ADMIN") load();
  }, [user, load]);

  if (user?.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-zinc-500">Not authorized. This page is admin-only.</p>
      </div>
    );
  }

  if (loading) return <DashboardLoading />;

  async function save(accountId: number) {
    const plan = selected[accountId];
    if (!plan) return;
    setSavingId(accountId);
    try {
      const updated = await changeAccountPlan(accountId, plan);
      setAccounts((prev) => prev.map((a) => (a.accountId === accountId ? updated : a)));
      setError(null);
    } catch {
      setError("Could not update plan.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Every account on the platform. Only an admin can change a plan.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-zinc-500 dark:border-white/10">
            <tr>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Workspaces</th>
              <th className="px-4 py-3 font-medium">APIs</th>
              <th className="px-4 py-3 font-medium">Tokens</th>
              <th className="px-4 py-3 font-medium">Change plan</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => {
              const pending = selected[a.accountId] ?? (a.plan as Plan) ?? "REGULAR";
              const dirty = pending !== a.plan;
              return (
                <tr key={a.accountId} className="border-b border-black/5 last:border-0 dark:border-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.fullName}</div>
                    <div className="text-xs text-zinc-500">{a.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                      {a.plan ? PLAN_LABELS[a.plan as Plan] : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{a.workspaceCount}</td>
                  <td className="px-4 py-3">{a.apiCount}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {formatNumber(a.tokensUsed)} / {formatNumber(a.tokenAllotment)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={pending}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [a.accountId]: e.target.value as Plan }))
                        }
                        className="rounded-lg border border-black/15 bg-background px-2 py-1.5 text-xs dark:border-white/20"
                      >
                        {PLANS.map((p) => (
                          <option key={p} value={p}>
                            {PLAN_LABELS[p]}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => save(a.accountId)}
                        disabled={!dirty || savingId === a.accountId}
                        className="rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-brand-fg hover:opacity-90 disabled:opacity-40"
                      >
                        {savingId === a.accountId ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
