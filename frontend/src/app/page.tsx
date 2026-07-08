"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">APIConnector</h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Orchestrate, transform, and route calls across your third-party APIs
          from one place.
        </p>
      </div>

      {!loading && (
        <div className="flex gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-foreground px-6 py-2.5 text-background"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full bg-foreground px-6 py-2.5 text-background"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-black/15 px-6 py-2.5 dark:border-white/20"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      )}
    </main>
  );
}
