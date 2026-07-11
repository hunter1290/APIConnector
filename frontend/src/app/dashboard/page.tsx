"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { TokenMeter } from "@/components/dashboard/TokenMeter";
import { NoWorkspace } from "@/components/dashboard/NoWorkspace";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { RESPONSE_MODE_LABELS, SECURITY_LABELS } from "@/types/connector";

const INSIGHTS = [
  "Inventory Feed: upstream latency up 42% over 24h — consider caching.",
  "Billing Sync: 2 redundant upstream calls detected; merge to cut cost ~18%.",
  "Acme Orders: schema stable, no anomalies in the last 7 days.",
];

export default function OverviewPage() {
  const { user } = useAuth();
  const { activeSet, loading } = useWorkspace();

  if (loading) return <DashboardLoading />;
  if (!activeSet) return <NoWorkspace />;

  const active = activeSet.apis.filter((a) => a.status === "ACTIVE").length;
  const errored = activeSet.apis.filter((a) => a.status === "ERROR").length;

  const stats = [
    { label: "Connected APIs", value: String(activeSet.apis.length) },
    { label: "Active", value: String(active) },
    { label: "Requests today", value: "12.4k" },
    { label: "Errors", value: String(errored) },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user?.fullName}</h1>
        <p className="mt-1 text-sm text-zinc-500">Overview of “{activeSet.name}”.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
            <div className="text-sm text-zinc-500">{s.label}</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent connections</h2>
            <Link href="/dashboard/apis" className="text-sm font-medium text-brand">
              View all →
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-zinc-500 dark:border-white/10">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Security</th>
                  <th className="px-5 py-3 font-medium">Response</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeSet.apis.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-zinc-500">
                      No APIs yet.{" "}
                      <Link href="/dashboard/apis/new" className="text-brand">Add one</Link>.
                    </td>
                  </tr>
                ) : (
                  activeSet.apis.map((a) => (
                    <tr key={a.id} className="border-b border-black/5 last:border-0 dark:border-white/10">
                      <td className="px-5 py-4">
                        <div className="font-medium">{a.name}</div>
                        <div className="font-mono text-xs text-zinc-500">{a.uniformPath}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{SECURITY_LABELS[a.security]}</td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{RESPONSE_MODE_LABELS[a.responseMode]}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={a.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6">
          <TokenMeter />
          <div>
            <h2 className="mb-3 text-lg font-semibold">AI insights</h2>
            <div className="space-y-3 rounded-2xl border border-brand/20 bg-brand/5 p-5">
              {INSIGHTS.map((i, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <p className="text-zinc-700 dark:text-zinc-300">{i}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-500/10 text-green-600 dark:text-green-400",
    DRAFT: "bg-zinc-500/10 text-zinc-500",
    ERROR: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status] ?? ""}`}>
      {status.toLowerCase()}
    </span>
  );
}
