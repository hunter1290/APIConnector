"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: <svg {...iconProps}><path d="M3 12l9-9 9 9" /><path d="M5 10v10h14V10" /></svg> },
  { href: "/dashboard/apis", label: "Third-party APIs", icon: <svg {...iconProps}><path d="M9 15l6-6M8.5 12H6a3 3 0 010-6h2.5M15.5 12H18a3 3 0 010 6h-2.5" /></svg> },
  { href: "/dashboard/explorer", label: "API Explorer", icon: <svg {...iconProps}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg> },
  { href: "/dashboard/analytics", label: "Analytics", icon: <svg {...iconProps}><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 4-5" /></svg> },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sets, activeSet, activeSetId, setActiveSet, addSet, deleteSet } = useWorkspace();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  function handleAddSet(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addSet(trimmed);
    setName("");
    setAdding(false);
  }

  function handleDelete() {
    if (!activeSet) return;
    const ok = window.confirm(`Delete workspace “${activeSet.name}”? This removes its APIs.`);
    if (ok) deleteSet(activeSet.id);
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-black/10 bg-background dark:border-white/10">
      {/* logo */}
      <div className="flex h-16 items-center px-5">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-fg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 15l6-6M8.5 12H6a3 3 0 010-6h2.5M15.5 12H18a3 3 0 010 6h-2.5"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          APIConnector
        </Link>
      </div>

      {/* workspace switcher */}
      <div className="px-3 pb-2">
        <label className="px-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
          Workspace
        </label>

        {sets.length > 0 ? (
          <div className="mt-1 flex items-center gap-1">
            <select
              value={activeSetId ?? ""}
              onChange={(e) => setActiveSet(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-black/15 bg-background px-3 py-2 text-sm dark:border-white/20"
            >
              {sets.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              onClick={handleDelete}
              title="Delete workspace"
              aria-label="Delete workspace"
              className="shrink-0 rounded-lg border border-black/15 px-2 py-2 text-zinc-400 hover:border-red-400 hover:text-red-500 dark:border-white/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
              </svg>
            </button>
          </div>
        ) : (
          <p className="mt-1 px-2 text-xs text-zinc-400">No workspaces yet.</p>
        )}

        {adding ? (
          <form onSubmit={handleAddSet} className="mt-2 flex gap-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workspace name"
              className="w-full rounded-lg border border-black/15 bg-background px-2 py-1.5 text-sm dark:border-white/20"
            />
            <button type="submit" className="rounded-lg bg-brand px-2 text-sm text-brand-fg" aria-label="Create workspace">✓</button>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-2 w-full rounded-lg border border-dashed border-black/20 px-3 py-1.5 text-sm text-zinc-500 hover:border-brand hover:text-brand dark:border-white/20"
          >
            + New workspace
          </button>
        )}
      </div>

      {/* nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand/10 text-brand"
                  : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* account (user-level) */}
      <div className="border-t border-black/10 p-3 dark:border-white/10">
        <Link
          href="/dashboard/account"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname.startsWith("/dashboard/account")
              ? "bg-brand/10 text-brand"
              : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
          }`}
        >
          <svg {...iconProps}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></svg>
          Account
        </Link>
      </div>
    </aside>
  );
}
