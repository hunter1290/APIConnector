"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { NoWorkspace } from "@/components/dashboard/NoWorkspace";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { testApi, type ApiTestResult } from "@/lib/connectorApi";
import {
  RESPONSE_MODE_LABELS,
  SECURITY_LABELS,
  type DataFormat,
  type HttpMethod,
  type ResponseMode,
  type SecurityScheme,
} from "@/types/connector";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const FORMATS: DataFormat[] = ["JSON", "XML", "CSV", "SOAP", "FORM_URLENCODED"];
const SECURITY: SecurityScheme[] = ["NONE", "API_KEY", "BEARER_TOKEN", "BASIC", "OAUTH2", "HMAC"];
const RESPONSE_MODES: ResponseMode[] = ["DIRECT", "WEBHOOK", "AI_INSIGHT"];

export default function NewApiPage() {
  const router = useRouter();
  const { activeSet, addApi, loading } = useWorkspace();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [format, setFormat] = useState<DataFormat>("JSON");
  const [security, setSecurity] = useState<SecurityScheme>("NONE");
  const [responseMode, setResponseMode] = useState<ResponseMode>("DIRECT");
  // Credential fields — sent to the backend as authConfig.
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [webhookUrl, setWebhookUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step1Result, setStep1Result] = useState<ApiTestResult | null>(null);
  const [testingStep1, setTestingStep1] = useState(false);
  const [step2Result, setStep2Result] = useState<ApiTestResult | null>(null);
  const [testingStep2, setTestingStep2] = useState(false);

  if (loading) return <DashboardLoading />;
  if (!activeSet) return <NoWorkspace />;

  function setCred(key: string, value: string) {
    setCreds((prev) => ({ ...prev, [key]: value }));
  }

  function credsConfig(): string | null {
    return Object.keys(creds).length ? JSON.stringify(creds) : null;
  }

  async function testConnection() {
    setTestingStep1(true);
    setStep1Result(null);
    try {
      const result = await testApi({ baseUrl, httpMethod: method, requestFormat: format, authType: "NONE" });
      setStep1Result(result);
    } catch {
      setStep1Result({ success: false, httpStatus: null, latencyMs: 0, responseBody: null, errorMessage: "Could not reach the backend." });
    } finally {
      setTestingStep1(false);
    }
  }

  async function retestWithCredentials() {
    setTestingStep2(true);
    setStep2Result(null);
    try {
      const result = await testApi({
        baseUrl,
        httpMethod: method,
        requestFormat: format,
        authType: security,
        authConfig: credsConfig(),
      });
      setStep2Result(result);
    } catch {
      setStep2Result({ success: false, httpStatus: null, latencyMs: 0, responseBody: null, errorMessage: "Could not reach the backend." });
    } finally {
      setTestingStep2(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const config: Record<string, string> = { ...creds };
    if (responseMode === "WEBHOOK" && webhookUrl) config.webhookUrl = webhookUrl;
    const authConfig = Object.keys(config).length ? JSON.stringify(config) : null;
    const ok = await addApi({ name, baseUrl, method, format, security, responseMode, status: "DRAFT", authConfig });
    setSubmitting(false);
    if (ok) {
      router.push("/dashboard/apis");
    } else {
      setError("Could not save the API. Make sure the backend is running.");
    }
  }

  const step1Passed = step1Result?.success === true;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard/apis" className="text-sm text-zinc-500 hover:text-foreground">
          ← Back to APIs
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Add a third-party API</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Registering to “{activeSet.name}”. Credentials are stored securely by the backend.
        </p>
      </div>

      <StepHeader step={step} />

      {step === 1 && (
        <Card title="Endpoint">
          <Field label="Name">
            <input required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Acme Orders" className={inputClass} />
          </Field>
          <Field label="Base URL">
            <input required type="url" value={baseUrl} onChange={(e) => { setBaseUrl(e.target.value); setStep1Result(null); }}
              placeholder="https://api.acme.com/orders" className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Method">
              <select value={method} onChange={(e) => setMethod(e.target.value as HttpMethod)} className={inputClass}>
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Upstream format">
              <select value={format} onChange={(e) => setFormat(e.target.value as DataFormat)} className={inputClass}>
                {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={testConnection}
              disabled={!baseUrl || testingStep1}
              className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
            >
              {testingStep1 ? "Testing…" : "Test connection"}
            </button>
            <span className="text-xs text-zinc-500">
              Calls the endpoint with no credentials to confirm it&apos;s reachable.
            </span>
          </div>
          <TestResultView result={step1Result} />

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!step1Passed}
              className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-fg hover:opacity-90 disabled:opacity-40"
            >
              Next: Security
            </button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card title="Security">
          <Field label="Scheme">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SECURITY.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => { setSecurity(s); setStep2Result(null); }}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    security === s
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-black/15 hover:border-black/30 dark:border-white/20"
                  }`}
                >
                  {SECURITY_LABELS[s]}
                </button>
              ))}
            </div>
          </Field>
          <SecurityFields scheme={security} creds={creds} setCred={setCred} />

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={retestWithCredentials}
              disabled={testingStep2}
              className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
            >
              {testingStep2 ? "Testing…" : "Retest with these credentials"}
            </button>
            <span className="text-xs text-zinc-500">Optional — validates the authenticated call.</span>
          </div>
          <TestResultView result={step2Result} />

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-full border border-black/15 px-5 py-2 text-sm dark:border-white/20"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-fg hover:opacity-90"
            >
              Next: Response mode
            </button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card title="Response mode">
            <div className="space-y-2">
              {RESPONSE_MODES.map((m) => (
                <label
                  key={m}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                    responseMode === m ? "border-brand bg-brand/5" : "border-black/15 dark:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="responseMode"
                    checked={responseMode === m}
                    onChange={() => setResponseMode(m)}
                    className="mt-0.5 accent-[var(--color-brand)]"
                  />
                  <span>
                    <span className="font-medium">{RESPONSE_MODE_LABELS[m]}</span>
                    <span className="block text-xs text-zinc-500">{RESPONSE_MODE_HINTS[m]}</span>
                  </span>
                </label>
              ))}
            </div>
            {responseMode === "WEBHOOK" && (
              <Field label="Webhook callback URL">
                <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-app.com/callbacks/apiconnector" className={inputClass} />
              </Field>
            )}
          </Card>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-full border border-black/15 px-5 py-2 text-sm dark:border-white/20"
            >
              Back
            </button>
            <div className="flex gap-3">
              <Link href="/dashboard/apis" className="rounded-full border border-black/15 px-5 py-2 text-sm dark:border-white/20">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-fg hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save API"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

const RESPONSE_MODE_HINTS: Record<ResponseMode, string> = {
  DIRECT: "Return the normalized payload synchronously.",
  WEBHOOK: "Push the result to a callback URL when ready.",
  AI_INSIGHT: "Return the data enriched with AI analysis & insights.",
};

const inputClass =
  "w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-sm dark:border-white/20";

function StepHeader({ step }: { step: 1 | 2 | 3 }) {
  const steps: { n: 1 | 2 | 3; label: string }[] = [
    { n: 1, label: "Endpoint" },
    { n: 2, label: "Security" },
    { n: 3, label: "Response mode" },
  ];
  return (
    <div className="flex items-center gap-2 text-sm">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              step === s.n
                ? "bg-brand text-brand-fg"
                : step > s.n
                  ? "bg-brand/20 text-brand"
                  : "bg-black/5 text-zinc-400 dark:bg-white/10"
            }`}
          >
            {s.n}
          </span>
          <span className={step === s.n ? "font-medium" : "text-zinc-500"}>{s.label}</span>
          {i < steps.length - 1 && <span className="mx-1 text-zinc-300 dark:text-zinc-700">→</span>}
        </div>
      ))}
    </div>
  );
}

function TestResultView({ result }: { result: ApiTestResult | null }) {
  if (!result) return null;
  if (!result.success) {
    return (
      <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
        {result.errorMessage ?? "The test call failed."}
      </p>
    );
  }
  return (
    <div className="space-y-1">
      <div className="text-xs text-zinc-500">
        <span className="font-mono">{result.httpStatus}</span> · {result.latencyMs}ms
      </div>
      <pre className="max-h-48 overflow-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-200">
        {result.responseBody ?? "(empty body)"}
      </pre>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-black/10 p-6 dark:border-white/10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}

function SecurityFields({
  scheme,
  creds,
  setCred,
}: {
  scheme: SecurityScheme;
  creds: Record<string, string>;
  setCred: (k: string, v: string) => void;
}) {
  if (scheme === "NONE") {
    return <p className="text-sm text-zinc-500">No authentication required for this upstream.</p>;
  }
  const fields: Record<Exclude<SecurityScheme, "NONE">, { key: string; label: string; type?: string }[]> = {
    API_KEY: [
      { key: "headerName", label: "Header name" },
      { key: "apiKey", label: "API key", type: "password" },
    ],
    BEARER_TOKEN: [{ key: "token", label: "Bearer token", type: "password" }],
    BASIC: [
      { key: "username", label: "Username" },
      { key: "password", label: "Password", type: "password" },
    ],
    OAUTH2: [
      { key: "clientId", label: "Client ID" },
      { key: "clientSecret", label: "Client secret", type: "password" },
      { key: "tokenUrl", label: "Token URL" },
      { key: "scopes", label: "Scopes" },
    ],
    HMAC: [
      { key: "secret", label: "Signing secret", type: "password" },
      { key: "algorithm", label: "Algorithm (e.g. SHA-256)" },
    ],
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields[scheme].map((f) => (
        <label key={f.key} className="block text-sm">
          <span className="mb-1 block font-medium">{f.label}</span>
          <input
            type={f.type ?? "text"}
            value={creds[f.key] ?? ""}
            onChange={(e) => setCred(f.key, e.target.value)}
            className={inputClass}
          />
        </label>
      ))}
    </div>
  );
}
