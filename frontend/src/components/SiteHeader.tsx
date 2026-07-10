"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

/** Sticky marketing header. CTAs swap based on authentication state. */
export function SiteHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-background/80 backdrop-blur-md dark:border-white/10">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-fg">
            {/* link / connector glyph */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 15l6-6M8.5 12H6a3 3 0 010-6h2.5M15.5 12H18a3 3 0 010 6h-2.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span>APIConnector</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-zinc-600 md:flex dark:text-zinc-300">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#insights" className="hover:text-foreground">AI insights</a>
        </nav>

        <div className="flex items-center gap-2">
          {!loading && user ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-foreground hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition-colors hover:opacity-90"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
