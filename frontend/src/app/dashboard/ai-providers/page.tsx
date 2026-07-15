"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "@/context/AccountContext";
import { listAiProviderCatalog, type AiProviderCatalogEntry } from "@/lib/connectorApi";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";

export default function AiProvidersPage() {
  const { plan } = useAccount();
  const isPro = plan === "PRO";
  const [catalog, setCatalog] = useState<AiProviderCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCatalog(await listAiProviderCatalog());
      setError(null);
    } catch {
      setError("Could not load AI providers. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <DashboardLoading />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Providers</h1>
        <p className="mt-1 text-sm text-zinc-500">
          APIConnector supplies these credentials — there&apos;s nothing for you to configure.
          Attach one to an API&apos;s <span className="font-medium">AI-processed response</span>{" "}
          mode to get real, on-demand analysis of what it returns.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {!isPro && (
        <div className="rounded-2xl border border-brand/20 bg-brand/5 p-6">
          <h2 className="font-semibold">AI analysis is a Pro feature</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Upgrade to Pro to attach one of these providers to your APIs and get real insights
            when you test them.
          </p>
          <Link
            href="/dashboard/account"
            className="mt-4 inline-block rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90"
          >
            Request Pro upgrade
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {catalog.map((c) => (
          <div
            key={c.provider}
            className={`rounded-2xl border p-5 ${
              isPro ? "border-black/10 dark:border-white/10" : "border-black/10 opacity-60 dark:border-white/10"
            }`}
          >
            <h3 className="font-semibold">{c.label}</h3>
            <p className="mt-1 text-xs text-zinc-500">
              {isPro ? "Available — pick this when adding or editing an API." : "Available on Pro."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
