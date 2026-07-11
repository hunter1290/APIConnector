"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { NoWorkspace } from "@/components/dashboard/NoWorkspace";
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
  const { activeSet, addApi } = useWorkspace();

  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [format, setFormat] = useState<DataFormat>("JSON");
  const [security, setSecurity] = useState<SecurityScheme>("API_KEY");
  const [responseMode, setResponseMode] = useState<ResponseMode>("DIRECT");
  // Credential fields (captured in UI; persisted to backend later).
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [webhookUrl, setWebhookUrl] = useState("");

  if (!activeSet) return <NoWorkspace />;

  function setCred(key: string, value: string) {
    setCreds((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    addApi({ name, baseUrl, method, format, security, responseMode, status: "DRAFT" });
    router.push("/dashboard/apis");
  }

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* basics */}
        <Card title="Endpoint">
          <Field label="Name">
            <input required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Acme Orders" className={inputClass} />
          </Field>
          <Field label="Base URL">
            <input required type="url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}
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
        </Card>

        {/* security selection */}
        <Card title="Security">
          <Field label="Scheme">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SECURITY.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSecurity(s)}
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
        </Card>

        {/* response mode */}
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

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/apis" className="rounded-full border border-black/15 px-5 py-2 text-sm dark:border-white/20">
            Cancel
          </Link>
          <button type="submit" className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-fg hover:opacity-90">
            Save API
          </button>
        </div>
      </form>
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
