"use client";

import { useAuth } from "@/context/AuthContext";
import { useAccount, PLAN_LABELS, PLAN_TOKENS, type Plan } from "@/context/AccountContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { TokenMeter } from "@/components/dashboard/TokenMeter";
import { formatNumber } from "@/lib/format";

const PLAN_FEATURES: Record<Plan, string[]> = {
  REGULAR: [
    `${formatNumber(PLAN_TOKENS.REGULAR)} free tokens / month`,
    "Up to 3 workspaces",
    "Format normalization & security translation",
    "Community support",
  ],
  PRO: [
    `${formatNumber(PLAN_TOKENS.PRO)} tokens / month`,
    "Unlimited workspaces",
    "AI insights & advanced analytics",
    "Priority support & SLAs",
  ],
};

export default function AccountPage() {
  const { user } = useAuth();
  const { plan, tokens, tokensRemaining, upgradePlan } = useAccount();
  const { sets } = useWorkspace();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-semibold">Account</h1>

      {/* profile (user-level) */}
      <section className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Profile</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-zinc-500">Name</dt><dd>{user?.fullName}</dd>
          <dt className="text-zinc-500">Email</dt><dd>{user?.email}</dd>
          <dt className="text-zinc-500">Role</dt><dd>{user?.role}</dd>
          <dt className="text-zinc-500">Plan</dt>
          <dd>
            <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
              {PLAN_LABELS[plan]}
            </span>
          </dd>
          <dt className="text-zinc-500">Workspaces</dt><dd>{sets.length}</dd>
        </dl>
      </section>

      {/* tokens (user-level) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Free tokens</h2>
        <TokenMeter />
        <p className="text-xs text-zinc-500">
          You have {formatNumber(tokens.total)} tokens on the {PLAN_LABELS[plan]} plan. They are
          consumed as you call endpoints and use AI features — {formatNumber(tokensRemaining)} remain.
        </p>
      </section>

      {/* plan / upgrade */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Plan</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["REGULAR", "PRO"] as Plan[]).map((p) => {
            const current = plan === p;
            const isUpgrade = p === "PRO" && plan === "REGULAR";
            return (
              <div
                key={p}
                className={`rounded-2xl border p-6 ${
                  current ? "border-brand bg-brand/5" : "border-black/10 dark:border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{PLAN_LABELS[p]}</h3>
                  {current && (
                    <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-brand-fg">
                      Current
                    </span>
                  )}
                </div>
                <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {PLAN_FEATURES[p].map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-brand">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {!current && (
                  <button
                    onClick={() => upgradePlan(p)}
                    className={`mt-5 w-full rounded-full px-4 py-2 text-sm font-medium ${
                      isUpgrade
                        ? "bg-brand text-brand-fg hover:opacity-90"
                        : "border border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                    }`}
                  >
                    {isUpgrade ? "Upgrade to Pro" : "Switch to Regular"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
