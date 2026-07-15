"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { NoWorkspace } from "@/components/dashboard/NoWorkspace";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { RESPONSE_MODE_LABELS, SECURITY_LABELS } from "@/types/connector";

export default function ApisPage() {
  const { activeSet, removeApi, loading } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSubmitted, setShowSubmitted] = useState(false);

  useEffect(() => {
    if (searchParams.get("submitted") === "1") {
      setShowSubmitted(true);
      router.replace("/dashboard/apis");
    }
  }, [searchParams, router]);

  if (loading) return <DashboardLoading />;
  if (!activeSet) return <NoWorkspace />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {showSubmitted && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-4 text-sm">
          <p>
            <span className="font-medium">Request submitted.</span> The connection is saved as a
            draft — a live, servable uniform endpoint for it will be available soon.
          </p>
          <button
            onClick={() => setShowSubmitted(false)}
            aria-label="Dismiss"
            className="shrink-0 text-zinc-400 hover:text-foreground"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Third-party APIs</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Upstream APIs in “{activeSet.name}”. Each gets a uniform URL you can use anywhere.
          </p>
        </div>
        <Link
          href="/dashboard/apis/new"
          className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90"
        >
          + Add API
        </Link>
      </div>

      {activeSet.apis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 p-12 text-center dark:border-white/15">
          <p className="text-zinc-500">No third-party APIs in this set yet.</p>
          <Link
            href="/dashboard/apis/new"
            className="mt-4 inline-block rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-fg"
          >
            Add your first API
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {activeSet.apis.map((a) => (
            <div key={a.id} className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{a.name}</h3>
                  <p className="truncate font-mono text-xs text-zinc-500">{a.baseUrl}</p>
                </div>
                <span className="shrink-0 rounded-md bg-black/5 px-2 py-1 font-mono text-xs dark:bg-white/10">
                  {a.method}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <Meta label="Format" value={a.format} />
                <Meta label="Security" value={SECURITY_LABELS[a.security]} />
                <Meta label="Response" value={RESPONSE_MODE_LABELS[a.responseMode]} />
                <Meta label="Status" value={a.status.toLowerCase()} />
              </dl>

              <div className="mt-4 flex items-center justify-between">
                <code className="truncate rounded bg-black/5 px-2 py-1 font-mono text-xs text-brand dark:bg-white/10">
                  {a.uniformPath}
                </code>
                <div className="flex gap-2">
                  <Link href="/dashboard/explorer" className="text-xs font-medium text-brand">
                    Explore
                  </Link>
                  <button
                    onClick={() => removeApi(a.id)}
                    className="text-xs font-medium text-zinc-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-zinc-400">{label}</dt>
      <dd className="mt-0.5 font-medium capitalize">{value}</dd>
    </div>
  );
}
