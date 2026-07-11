"use client";

import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { TokenMeter } from "./TokenMeter";

export function Topbar({ title }: { title?: string }) {
  const { user, logout } = useAuth();
  const { activeSet } = useWorkspace();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-black/10 bg-background/80 px-6 backdrop-blur-md dark:border-white/10">
      <div>
        <div className="text-sm font-semibold">
          {title ?? activeSet?.name ?? "No workspace"}
        </div>
        <div className="text-xs text-zinc-500">
          {activeSet ? `${activeSet.apis.length} connected APIs` : "Create a workspace to begin"}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <TokenMeter compact />
        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium">{user?.fullName}</div>
          <div className="text-xs text-zinc-500">{user?.email}</div>
        </div>
        <button
          onClick={logout}
          className="rounded-full border border-black/15 px-3 py-1.5 text-sm dark:border-white/20"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
