"use client";

import Link from "next/link";
import { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useAccount } from "@/context/AccountContext";
import { NoWorkspace } from "@/components/dashboard/NoWorkspace";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { recordUsage, testSavedApi, type ApiTestResult } from "@/lib/connectorApi";
import {
  RESPONSE_MODE_LABELS,
  SECURITY_LABELS,
  type ThirdPartyApi,
} from "@/types/connector";

const API_HOST = "https://api.apiconnector.io";
const TRY_COST = 25; // tokens consumed per "Try it"

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-500/15 text-green-600 dark:text-green-400",
  POST: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  PUT: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  PATCH: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  DELETE: "bg-red-500/15 text-red-600 dark:text-red-400",
};

export default function ExplorerPage() {
  const { activeSet, loading } = useWorkspace();

  if (loading) return <DashboardLoading />;
  if (!activeSet) return <NoWorkspace />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">API Explorer</h1>
        <p className="mt-1 text-sm text-zinc-500">
          A Swagger-style view of the uniform URLs APIConnector generates for “{activeSet.name}”.
          Use these endpoints anywhere — one shape, whatever the upstream.
        </p>
      </div>

      {activeSet.apis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 p-12 text-center dark:border-white/15">
          <p className="text-zinc-500">No endpoints to explore.</p>
          <Link href="/dashboard/apis/new" className="mt-4 inline-block text-brand">
            Add an API →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSet.apis.map((api) => (
            <Operation key={api.id} api={api} />
          ))}
        </div>
      )}
    </div>
  );
}

function Operation({ api }: { api: ThirdPartyApi }) {
  const { tokensRemaining, refresh } = useAccount();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ApiTestResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullUrl = `${API_HOST}${api.uniformPath}`;

  async function tryIt() {
    if (tokensRemaining < TRY_COST) return;
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const testResult = await testSavedApi(Number(api.id));
      setResult(testResult);
      await recordUsage({ apiDetailId: Number(api.id), tokens: TRY_COST, source: "AI_INSIGHT" });
      await refresh();
    } catch {
      setError("Could not reach the backend to run this test.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className={`rounded-md px-2 py-1 font-mono text-xs font-semibold ${METHOD_COLORS[api.method]}`}>
          {api.method}
        </span>
        <code className="flex-1 truncate font-mono text-sm">{api.uniformPath}</code>
        <span className="text-xs text-zinc-500">{api.name}</span>
        <span className="text-zinc-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-5 border-t border-black/10 px-4 py-5 dark:border-white/10">
          <div className="grid gap-3 sm:grid-cols-3">
            <Info label="Full URL" value={fullUrl} mono />
            <Info label="Security" value={SECURITY_LABELS[api.security]} />
            <Info label="Response mode" value={RESPONSE_MODE_LABELS[api.responseMode]} />
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Example request
            </h4>
            <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-200">
{`curl -X ${api.method} '${fullUrl}' \\
  -H 'Authorization: Bearer <YOUR_APICONNECTOR_TOKEN>'`}
            </pre>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={tryIt}
              disabled={running || tokensRemaining < TRY_COST}
              className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90 disabled:opacity-50"
            >
              {running ? "Running…" : "Try it"}
            </button>
            <span className="text-xs text-zinc-500">
              Costs {TRY_COST} tokens{tokensRemaining < TRY_COST ? " — not enough left" : ""}
            </span>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          {result && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Response
                {result.success && (
                  <span className="rounded bg-black/5 px-1.5 py-0.5 font-mono normal-case text-zinc-500 dark:bg-white/10">
                    {result.httpStatus} · {result.latencyMs}ms
                  </span>
                )}
              </h4>
              {result.success ? (
                <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-200">
                  {result.responseBody ?? "(empty body)"}
                </pre>
              ) : (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                  {result.errorMessage ?? "The test call failed."}
                </p>
              )}
              {result.insights && (
                <div className="mt-3 rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand">
                    AI insights · {result.insights.quality} · {result.insights.anomalies} anomalies
                  </div>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">{result.insights.summary}</p>
                  {result.insights.recommendations.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-500">
                      {result.insights.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                </div>
              )}
              {result.transformedBody && (
                <div className="mt-3">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Unified format (transformed)
                  </h4>
                  <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-200">
                    {result.transformedBody}
                  </pre>
                </div>
              )}
              {result.transformError && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {result.transformError}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-zinc-400">{label}</div>
      <div className={`mt-0.5 break-all text-sm ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}
