"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PLAN_LABELS, type Plan } from "@/context/AccountContext";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import {
  approvePlanRequest,
  changeAccountPlan,
  listAdminAccounts,
  listPendingPlanRequests,
  rejectPlanRequest,
  setAccountEnabled,
  type AdminAccountDto,
  type PlanUpgradeRequestDto,
} from "@/lib/connectorApi";
import { formatNumber } from "@/lib/format";

const PLANS: Plan[] = ["REGULAR", "PRO"];

export default function AdminPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AdminAccountDto[]>([]);
  const [requests, setRequests] = useState<PlanUpgradeRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<number, Plan>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsData, requestsData] = await Promise.all([
        listAdminAccounts(),
        listPendingPlanRequests(),
      ]);
      setAccounts(accountsData);
      setRequests(requestsData);
      setError(null);
    } catch {
      setError("Could not load admin data. Is the backend running?");
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

  async function toggleEnabled(account: AdminAccountDto) {
    setTogglingId(account.accountId);
    try {
      const updated = await setAccountEnabled(account.accountId, !account.enabled);
      setAccounts((prev) => prev.map((a) => (a.accountId === account.accountId ? updated : a)));
      setError(null);
    } catch {
      setError("Could not update account status.");
    } finally {
      setTogglingId(null);
    }
  }

  async function resolve(requestId: number, action: "approve" | "reject") {
    setResolvingId(requestId);
    try {
      await (action === "approve" ? approvePlanRequest(requestId) : rejectPlanRequest(requestId));
      await load();
    } catch {
      setError("Could not resolve the request.");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Every account on the platform. Only an admin can change a plan or disable login access.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Pending plan requests
        </h2>
        {requests.length === 0 ? (
          <p className="text-sm text-zinc-500">No pending requests.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-zinc-500 dark:border-white/10">
                <tr>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 font-medium">Requested</th>
                  <th className="px-4 py-3 font-medium">Decision</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.fullName}</div>
                      <div className="text-xs text-zinc-500">{r.email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {new Date(r.requestedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => resolve(r.id, "approve")}
                          disabled={resolvingId === r.id}
                          className="rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-brand-fg hover:opacity-90 disabled:opacity-40"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => resolve(r.id, "reject")}
                          disabled={resolvingId === r.id}
                          className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium hover:bg-black/5 disabled:opacity-40 dark:border-white/20 dark:hover:bg-white/10"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Accounts</h2>
        <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-zinc-500 dark:border-white/10">
              <tr>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            a.enabled
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : "bg-red-500/10 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {a.enabled ? "Enabled" : "Disabled"}
                        </span>
                        <button
                          onClick={() => toggleEnabled(a)}
                          disabled={togglingId === a.accountId}
                          className="text-xs font-medium text-zinc-400 hover:text-foreground disabled:opacity-40"
                        >
                          {a.enabled ? "Disable" : "Enable"}
                        </button>
                      </div>
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
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    No accounts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
