"use client";

import { useAccount } from "@/context/AccountContext";
import { formatNumber } from "@/lib/format";

/** Free-token usage meter (user-level). Decrements as the user exercises the platform. */
export function TokenMeter({ compact = false }: { compact?: boolean }) {
  const { tokens, tokensRemaining } = useAccount();
  const pct = tokens.total === 0 ? 0 : Math.min(100, (tokens.used / tokens.total) * 100);
  const low = tokensRemaining < tokens.total * 0.15;

  if (compact) {
    return (
      <div className="flex items-center gap-2" title={`${formatNumber(tokensRemaining)} free tokens left`}>
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
          <div
            className={`h-full rounded-full ${low ? "bg-amber-500" : "bg-brand"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-mono text-xs tabular-nums text-zinc-500">
          {formatNumber(tokensRemaining)}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Free tokens</span>
        <span className="text-xs text-zinc-500">
          {formatNumber(tokens.used)} / {formatNumber(tokens.total)} used
        </span>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
        <div
          className={`h-full rounded-full ${low ? "bg-amber-500" : "bg-brand"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-zinc-500">
        <span className={`font-semibold ${low ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
          {formatNumber(tokensRemaining)}
        </span>{" "}
        tokens remaining
      </p>
    </div>
  );
}
