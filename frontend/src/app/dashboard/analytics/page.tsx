"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { NoWorkspace } from "@/components/dashboard/NoWorkspace";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { AreaChart, BarChart, UptimeGauge } from "@/components/dashboard/Charts";
import { formatNumber } from "@/lib/format";
import type { ThirdPartyApi } from "@/types/connector";

/* ---- deterministic mock generators (seeded by id → stable across SSR/client) ---- */

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY_LABELS = Array.from({ length: 14 }, (_, i) => `D${i + 1}`);
const FREQUENCIES = ["every 5 min", "every 15 min", "hourly", "every 6h", "daily"];

interface ApiAnalytics {
  syncs: number[];
  volume: number[];
  uptimePct: number;
  frequency: string;
  lastPulledMin: number;
  lastSyncedMin: number;
  downtime: { day: string; durationMin: number }[];
}

function analyticsFor(api: ThirdPartyApi): ApiAnalytics {
  const rand = mulberry32(hash(api.id));
  const syncs = DAY_LABELS.map(() => 20 + Math.floor(rand() * 180));
  const volume = syncs.map((s) => s * (50 + Math.floor(rand() * 150)));
  const uptimePct = api.status === "ERROR" ? 92 + Math.floor(rand() * 4) : 98 + Math.floor(rand() * 2);
  const frequency = FREQUENCIES[Math.floor(rand() * FREQUENCIES.length)];
  const lastPulledMin = 1 + Math.floor(rand() * 30);
  const lastSyncedMin = lastPulledMin + Math.floor(rand() * 5);
  const downtime =
    api.status === "ERROR"
      ? [
          { day: DAY_LABELS[3], durationMin: 8 + Math.floor(rand() * 20) },
          { day: DAY_LABELS[9], durationMin: 3 + Math.floor(rand() * 15) },
        ]
      : rand() > 0.6
        ? [{ day: DAY_LABELS[7], durationMin: 2 + Math.floor(rand() * 6) }]
        : [];
  return { syncs, volume, uptimePct, frequency, lastPulledMin, lastSyncedMin, downtime };
}

function sumArrays(arrs: number[][]): number[] {
  if (arrs.length === 0) return DAY_LABELS.map(() => 0);
  return DAY_LABELS.map((_, i) => arrs.reduce((acc, a) => acc + (a[i] ?? 0), 0));
}

/* --------------------------------- page ---------------------------------- */

export default function AnalyticsPage() {
  const { activeSet, loading } = useWorkspace();
  const [filter, setFilter] = useState<string>("ALL");

  const apis = activeSet?.apis ?? [];
  const selectedApis = filter === "ALL" ? apis : apis.filter((a) => a.id === filter);

  const agg = useMemo(() => {
    const per = selectedApis.map(analyticsFor);
    const syncs = sumArrays(per.map((p) => p.syncs));
    const volume = sumArrays(per.map((p) => p.volume));
    const uptimePct = per.length
      ? Math.round(per.reduce((a, p) => a + p.uptimePct, 0) / per.length)
      : 100;
    const totalVolume = volume.reduce((a, b) => a + b, 0);
    const totalSyncs = syncs.reduce((a, b) => a + b, 0);
    const downtime = per.flatMap((p, i) =>
      p.downtime.map((d) => ({ ...d, api: selectedApis[i].name })),
    );
    const lastSyncedMin = per.length ? Math.min(...per.map((p) => p.lastSyncedMin)) : null;
    const lastPulledMin = per.length ? Math.min(...per.map((p) => p.lastPulledMin)) : null;
    const frequency = per[0]?.frequency ?? "—";
    return { syncs, volume, uptimePct, totalVolume, totalSyncs, downtime, lastSyncedMin, lastPulledMin, frequency };
  }, [selectedApis]);

  if (loading) return <DashboardLoading />;
  if (!activeSet) return <NoWorkspace />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-500">
            How the data in “{activeSet.name}” is pulled, synced, and how reliable it is.
          </p>
        </div>
        {apis.length > 0 && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-black/15 bg-background px-3 py-2 text-sm dark:border-white/20"
          >
            <option value="ALL">All endpoints</option>
            {apis.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
      </div>

      {apis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 p-12 text-center text-sm text-zinc-500 dark:border-white/15">
          No data to analyze yet. Once this workspace has connected APIs, their pull/sync
          activity, volume, and downtime appear here.
        </div>
      ) : (
        <>
          {/* metrics row */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Last pulled" value={agg.lastPulledMin != null ? `${agg.lastPulledMin} min ago` : "—"} />
            <Metric label="Last synced" value={agg.lastSyncedMin != null ? `${agg.lastSyncedMin} min ago` : "—"} />
            <Metric label="Sync frequency" value={agg.frequency} />
            <Metric label="Records synced (14d)" value={formatNumber(agg.totalVolume)} />
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* sync activity */}
            <section className="rounded-2xl border border-black/10 p-5 lg:col-span-2 dark:border-white/10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Sync activity (last 14 days)</h2>
                <span className="text-xs text-zinc-500">{formatNumber(agg.totalSyncs)} syncs</span>
              </div>
              <BarChart data={agg.syncs.map((v, i) => ({ label: DAY_LABELS[i], value: v }))} unit=" syncs" />
            </section>

            {/* uptime */}
            <section className="flex flex-col items-center justify-center rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <h2 className="mb-4 self-start text-sm font-semibold">Reliability</h2>
              <UptimeGauge pct={agg.uptimePct} />
              <p className="mt-4 text-xs text-zinc-500">
                {agg.downtime.length} downtime incident{agg.downtime.length === 1 ? "" : "s"} in 14 days
              </p>
            </section>

            {/* data volume */}
            <section className="rounded-2xl border border-black/10 p-5 lg:col-span-2 dark:border-white/10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Data volume (records/day)</h2>
                <span className="text-xs text-zinc-500">peak {formatNumber(Math.max(...agg.volume))}</span>
              </div>
              <AreaChart points={agg.volume} labels={DAY_LABELS} />
            </section>

            {/* downtime */}
            <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <h2 className="mb-4 text-sm font-semibold">Downtime</h2>
              {agg.downtime.length === 0 ? (
                <p className="text-sm text-green-600 dark:text-green-400">No downtime recorded 🎉</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {agg.downtime.map((d, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="text-zinc-500">{d.api} · {d.day}</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">{d.durationMin} min</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
