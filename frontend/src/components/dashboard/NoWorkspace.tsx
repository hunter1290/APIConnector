"use client";

import { useState, type FormEvent } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";

/**
 * Empty-state shown on workspace-level pages when the user has no workspaces.
 * Offers to create one (the only option) — there is no default workspace.
 */
export function NoWorkspace() {
  const { addSet, error } = useWorkspace();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    const ok = await addSet(trimmed);
    setSubmitting(false);
    if (ok) setName("");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="6" rx="2" />
          <rect x="3" y="14" width="18" height="6" rx="2" />
        </svg>
      </div>
      <h2 className="mt-5 text-xl font-semibold">No workspace yet</h2>
      <p className="mt-2 text-sm text-zinc-500">
        A workspace groups a set of third-party APIs. Create one to start adding APIs,
        exploring uniform URLs, and viewing analytics.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex w-full gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workspace name (e.g. Client A)"
          className="flex-1 rounded-lg border border-black/15 bg-background px-3 py-2 text-sm dark:border-white/20"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add workspace"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </div>
  );
}
