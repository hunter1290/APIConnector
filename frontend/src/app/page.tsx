"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";

/* ---------------------------------- data ---------------------------------- */

interface Feature {
  icon: ReactNode;
  title: string;
  desc: string;
}

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const FEATURES: Feature[] = [
  {
    title: "One uniform API URL",
    desc: "Expose a single, stable endpoint per client that returns exactly the fields they need — no matter how many upstream services the data actually comes from.",
    icon: (
      <svg {...iconProps}>
        <path d="M9 15l6-6" />
        <path d="M8.5 12H6a3 3 0 010-6h2.5" />
        <path d="M15.5 12H18a3 3 0 010 6h-2.5" />
      </svg>
    ),
  },
  {
    title: "Any format, normalized",
    desc: "Consume JSON, XML, CSV, or SOAP from any provider. APIConnector normalizes everything into one clean schema you define and control.",
    icon: (
      <svg {...iconProps}>
        <path d="M8 3H4a1 1 0 00-1 1v16a1 1 0 001 1h4" />
        <path d="M16 3h4a1 1 0 011 1v16a1 1 0 01-1 1h-4" />
        <path d="M9 12h6M12 9l3 3-3 3" />
      </svg>
    ),
  },
  {
    title: "Security translation",
    desc: "Bridge mismatched auth schemes — OAuth2, API keys, Basic, HMAC, JWT. Convert an upstream's security model into whatever your client expects.",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9.5 12l1.8 1.8L15 10" />
      </svg>
    ),
  },
  {
    title: "Deep observability",
    desc: "Trace every request end to end. Inspect latency, payloads, and upstream hops with full request tracking and a live activity timeline.",
    icon: (
      <svg {...iconProps}>
        <path d="M3 12h4l3 8 4-16 3 8h4" />
      </svg>
    ),
  },
  {
    title: "Resilient error handling",
    desc: "Automatic retries, fallbacks, and normalized error responses mean downstream clients always get predictable, actionable results.",
    icon: (
      <svg {...iconProps}>
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
        <path d="M10.3 3.9l-8 13.9A2 2 0 004 21h16a2 2 0 001.7-3.2l-8-13.9a2 2 0 00-3.4 0z" />
      </svg>
    ),
  },
  {
    title: "AI-powered insights",
    desc: "Claude-powered analysis surfaces anomalies, data-quality issues, and efficiency wins across every connection — before they reach your clients.",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        <circle cx="12" cy="12" r="3.2" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    n: "01",
    title: "Connect upstreams",
    desc: "Register the third-party APIs you depend on and their auth schemes.",
  },
  {
    n: "02",
    title: "Map & transform",
    desc: "Define the unified schema and let APIConnector normalize formats and security.",
  },
  {
    n: "03",
    title: "Serve one URL",
    desc: "Hand each client a single endpoint — observable, resilient, and AI-monitored.",
  },
];

/* -------------------------------- component ------------------------------- */

export default function Home() {
  const { user, loading } = useAuth();
  const primaryHref = !loading && user ? "/dashboard" : "/register";
  const primaryLabel = !loading && user ? "Go to dashboard" : "Get started free";

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      {/* ---------------------------------- hero --------------------------------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(79,70,229,0.15),transparent)]"
        />
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-white/15 dark:text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              The API integration hub
            </span>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Every API you depend on,
              <br />
              behind <span className="text-brand">one clean URL</span>.
            </h1>
            <p className="mt-5 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
              APIConnector unifies formats, translates security schemes, and adds
              observability, resilient error handling, and AI insight — so each
              client gets exactly the data they need from a single endpoint.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={primaryHref}
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-fg transition-colors hover:opacity-90"
              >
                {primaryLabel}
              </Link>
              <a
                href="#features"
                className="rounded-full border border-black/15 px-6 py-3 text-sm font-semibold transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              >
                Explore features
              </a>
            </div>
          </div>

          {/* hero visual: a uniform-endpoint code card */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white/60 p-1 shadow-2xl shadow-brand/10 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-1.5 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-3 font-mono text-xs text-zinc-500">
                  GET /v1/clients/acme/orders
                </span>
              </div>
              <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-200">
{`{
  "source": "3 upstreams · normalized",
  "auth":   "OAuth2 → API key (translated)",
  "orders": [
    { "id": "A-1042", "total": 249.0,
      "status": "shipped" }
  ],
  "_meta": {
    "latencyMs": 84,
    "traceId": "c1f9…",
    "insights": "✓ no anomalies"
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- features ------------------------------- */}
      <section id="features" className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Everything between you and your APIs
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Six capabilities that turn a mess of upstream integrations into one
            dependable, observable interface.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-black/10 p-6 transition-colors hover:border-brand/40 dark:border-white/10"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------ how it works ----------------------------- */}
      <section id="how" className="border-y border-black/5 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            How it works
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <div className="font-mono text-sm font-semibold text-brand">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- AI insights ----------------------------- */}
      <section id="insights" className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="rounded-3xl border border-brand/20 bg-brand/5 p-10 md:p-14">
          <div className="max-w-2xl">
            <span className="text-sm font-semibold text-brand">AI analysis</span>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Insight into your data — and its efficiency
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              Every request flowing through APIConnector is analyzed by a Claude
              model. Spot schema drift, redundant upstream calls, latency
              regressions, and data-quality issues automatically — with concrete
              recommendations to make each connection faster and cheaper.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Anomaly detection", "Flags unexpected shapes, values, and error spikes."],
              ["Efficiency scoring", "Rates each connection and suggests where to cut latency and cost."],
              ["Data-quality checks", "Surfaces missing fields, type mismatches, and stale sources."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-black/10 bg-background p-5 dark:border-white/10">
                <h3 className="text-sm font-semibold">{t}</h3>
                <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------- CTA ----------------------------------- */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-foreground px-8 py-16 text-center text-background">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight">
            Ship one dependable endpoint, not a dozen integrations.
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={primaryHref}
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-fg transition-colors hover:opacity-90"
            >
              {primaryLabel}
            </Link>
            {!user && (
              <Link
                href="/login"
                className="rounded-full border border-background/30 px-6 py-3 text-sm font-semibold hover:bg-background/10"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* -------------------------------- footer --------------------------------- */}
      <footer className="border-t border-black/5 dark:border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-zinc-500 sm:flex-row">
          <span>© {new Date().getFullYear()} APIConnector</span>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <Link href="/register" className="hover:text-foreground">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
