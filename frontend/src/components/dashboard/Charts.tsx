"use client";

// Lightweight, dependency-free charts (inline SVG/CSS). Theme-aware, brand-colored.

import { formatNumber } from "@/lib/format";

export function BarChart({
  data,
  height = 140,
  unit = "",
}: {
  data: { label: string; value: number }[];
  height?: number;
  unit?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-brand/70 transition-colors hover:bg-brand"
            style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
            title={`${d.label}: ${formatNumber(d.value)}${unit}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-zinc-400">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export function AreaChart({
  points,
  labels,
  height = 140,
}: {
  points: number[];
  labels?: string[];
  height?: number;
}) {
  const max = Math.max(1, ...points);
  const n = points.length;
  const coords = points.map((v, i) => [
    n === 1 ? 0 : (i / (n - 1)) * 100,
    100 - (v / max) * 100,
  ]);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L100,100 L0,100 Z`;
  return (
    <div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height }} role="img">
        <path d={area} fill="var(--color-brand)" opacity="0.12" />
        <path
          d={line}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      </svg>
      {labels && (
        <div className="mt-2 flex justify-between text-[10px] text-zinc-400">
          <span>{labels[0]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

export function UptimeGauge({ pct }: { pct: number }) {
  return (
    <div
      className="relative h-28 w-28 rounded-full"
      style={{ background: `conic-gradient(var(--color-brand) ${pct * 3.6}deg, rgba(120,120,120,0.15) 0)` }}
      role="img"
      aria-label={`${pct}% uptime`}
    >
      <div className="absolute inset-[10px] grid place-items-center rounded-full bg-background text-center">
        <div>
          <div className="text-xl font-semibold tabular-nums">{pct}%</div>
          <div className="text-xs text-zinc-500">uptime</div>
        </div>
      </div>
    </div>
  );
}
