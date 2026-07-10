"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

/* Placeholder data — replaced by real API-connection endpoints once the
   backend integration domain is built. */
const STATS = [
  { label: "Active connections", value: "6" },
  { label: "Requests today", value: "12.4k" },
  { label: "Avg latency", value: "84 ms" },
  { label: "Error rate", value: "0.3%" },
];

const CONNECTIONS = [
  { name: "Acme Orders", upstreams: 3, format: "JSON ← XML, CSV", auth: "OAuth2 → API key", status: "healthy" },
  { name: "Billing Sync", upstreams: 2, format: "JSON ← SOAP", auth: "JWT → Basic", status: "healthy" },
  { name: "Inventory Feed", upstreams: 4, format: "JSON ← CSV", auth: "API key → HMAC", status: "degraded" },
];

const INSIGHTS = [
  "Inventory Feed: upstream #3 latency up 42% over 24h — consider caching.",
  "Billing Sync: 2 redundant upstream calls detected; merge to cut cost ~18%.",
  "Acme Orders: schema stable, no anomalies in the last 7 days.",
];

function statusStyles(status: string) {
  return status === "healthy"
    ? "bg-green-500/10 text-green-600 dark:text-green-400"
    : "bg-amber-500/10 text-amber-600 dark:text-amber-400";
}

function DashboardContent() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-1 flex-col">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-background/80 backdrop-blur-md dark:border-white/10">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-fg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 15l6-6M8.5 12H6a3 3 0 010-6h2.5M15.5 12H18a3 3 0 010 6h-2.5"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            APIConnector
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-500 sm:inline">{user?.email}</span>
            <button
              onClick={logout}
              className="rounded-full border border-black/15 px-4 py-2 text-sm dark:border-white/20"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Welcome back, {user?.fullName}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Here&apos;s what&apos;s happening across your connections.
          </p>
        </div>

        {/* KPI tiles */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <div className="text-sm text-zinc-500">{s.label}</div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</div>
            </div>
          ))}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* connections */}
          <section className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Connections</h2>
              <button className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90">
                New connection
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-zinc-500 dark:border-white/10">
                  <tr>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Format</th>
                    <th className="px-5 py-3 font-medium">Auth</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {CONNECTIONS.map((c) => (
                    <tr key={c.name} className="border-b border-black/5 last:border-0 dark:border-white/10">
                      <td className="px-5 py-4">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-zinc-500">{c.upstreams} upstreams</div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-zinc-500">{c.format}</td>
                      <td className="px-5 py-4 font-mono text-xs text-zinc-500">{c.auth}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* AI insights */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">AI insights</h2>
            <div className="space-y-3 rounded-2xl border border-brand/20 bg-brand/5 p-5">
              {INSIGHTS.map((i, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <p className="text-zinc-700 dark:text-zinc-300">{i}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <p className="mt-8 text-xs text-zinc-400">
          Showing sample data. Live connections, tracing, and AI analysis populate
          here once the backend integration domain is connected.
        </p>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
