"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useAccount } from "@/context/AccountContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { NoWorkspace } from "@/components/dashboard/NoWorkspace";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import {
  listAiProviderCatalog,
  testApi,
  type AiProviderCatalogEntry,
  type ApiTestResult,
} from "@/lib/connectorApi";
import { parseCurl } from "@/lib/curlParser";
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

interface KeyValue {
  key: string;
  value: string;
}

const EMPTY_ROW: KeyValue = { key: "", value: "" };

export default function NewApiPage() {
  const router = useRouter();
  const { plan } = useAccount();
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

  // Custom (non-auth) headers, editable as key/value rows.
  const [headerRows, setHeaderRows] = useState<KeyValue[]>([{ ...EMPTY_ROW }]);

  // Request body: either freeform "raw" text, or built from key/value rows (JSON / form-urlencoded only).
  const [bodyMode, setBodyMode] = useState<"raw" | "keyvalue">("raw");
  const [body, setBody] = useState("");
  const [bodyRows, setBodyRows] = useState<KeyValue[]>([{ ...EMPTY_ROW }]);

  const [showCurlImport, setShowCurlImport] = useState(false);
  const [curlText, setCurlText] = useState("");
  const [curlError, setCurlError] = useState<string | null>(null);

  const [aiProviderCatalog, setAiProviderCatalog] = useState<AiProviderCatalogEntry[]>([]);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step1Result, setStep1Result] = useState<ApiTestResult | null>(null);
  const [testingStep1, setTestingStep1] = useState(false);
  const [step2Result, setStep2Result] = useState<ApiTestResult | null>(null);
  const [testingStep2, setTestingStep2] = useState(false);

  const isPro = plan === "PRO";

  useEffect(() => {
    listAiProviderCatalog().then(setAiProviderCatalog).catch(() => setAiProviderCatalog([]));
  }, []);

  if (loading) return <DashboardLoading />;
  if (!activeSet) return <NoWorkspace />;

  function setCred(key: string, value: string) {
    setCreds((prev) => ({ ...prev, [key]: value }));
  }

  function credsConfig(): string | null {
    return Object.keys(creds).length ? JSON.stringify(creds) : null;
  }

  function headersJson(): string | null {
    const obj: Record<string, string> = {};
    headerRows.forEach((r) => {
      if (r.key.trim()) obj[r.key.trim()] = r.value;
    });
    return Object.keys(obj).length ? JSON.stringify(obj) : null;
  }

  function syncBodyFromRows(rows: KeyValue[], fmt: DataFormat) {
    if (fmt === "FORM_URLENCODED") {
      setBody(
        rows
          .filter((r) => r.key.trim())
          .map((r) => `${encodeURIComponent(r.key)}=${encodeURIComponent(r.value)}`)
          .join("&"),
      );
    } else {
      const obj: Record<string, string> = {};
      rows.forEach((r) => {
        if (r.key.trim()) obj[r.key.trim()] = r.value;
      });
      setBody(Object.keys(obj).length ? JSON.stringify(obj, null, 2) : "");
    }
  }

  function updateBodyRow(index: number, field: "key" | "value", value: string) {
    const next = bodyRows.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    setBodyRows(next);
    syncBodyFromRows(next, format);
    setStep1Result(null);
  }

  function addBodyRow() {
    setBodyRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeBodyRow(index: number) {
    const next = bodyRows.filter((_, i) => i !== index);
    setBodyRows(next.length ? next : [{ ...EMPTY_ROW }]);
    syncBodyFromRows(next.length ? next : [{ ...EMPTY_ROW }], format);
  }

  function switchBodyMode(mode: "raw" | "keyvalue") {
    if (mode === "keyvalue" && bodyMode === "raw") {
      // Best-effort: parse the existing raw body into rows so nothing is lost.
      const parsed = parseBodyIntoRows(body, format);
      if (parsed.length) {
        setBodyRows(parsed);
        syncBodyFromRows(parsed, format);
      }
    }
    setBodyMode(mode);
  }

  function updateHeaderRow(index: number, field: "key" | "value", value: string) {
    setHeaderRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addHeaderRow() {
    setHeaderRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeHeaderRow(index: number) {
    setHeaderRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [{ ...EMPTY_ROW }];
    });
  }

  function applyParsedCurl() {
    setCurlError(null);
    const parsed = parseCurl(curlText);
    if (!parsed) {
      setCurlError("Couldn't find a URL in that command.");
      return;
    }

    setBaseUrl(parsed.url);
    if (METHODS.includes(parsed.method as HttpMethod)) {
      setMethod(parsed.method as HttpMethod);
    }

    const headers = { ...parsed.headers };
    const contentType = headers["Content-Type"] ?? headers["content-type"];
    if (contentType?.includes("json")) setFormat("JSON");
    else if (contentType?.includes("xml")) setFormat("XML");
    else if (contentType?.includes("form-urlencoded")) setFormat("FORM_URLENCODED");
    else if (contentType?.includes("csv")) setFormat("CSV");
    delete headers["Content-Type"];
    delete headers["content-type"];

    // Best-effort auth detection so Step 2 is prefilled too.
    const authHeader = headers["Authorization"] ?? headers["authorization"];
    if (parsed.basicAuth) {
      setSecurity("BASIC");
      setCred("username", parsed.basicAuth.username);
      setCred("password", parsed.basicAuth.password);
    } else if (authHeader?.toLowerCase().startsWith("bearer ")) {
      setSecurity("BEARER_TOKEN");
      setCred("token", authHeader.slice(7).trim());
      delete headers["Authorization"];
      delete headers["authorization"];
    } else {
      const apiKeyHeaderName = Object.keys(headers).find((h) => /api[-_]?key/i.test(h));
      if (apiKeyHeaderName) {
        setSecurity("API_KEY");
        setCred("headerName", apiKeyHeaderName);
        setCred("apiKey", headers[apiKeyHeaderName]);
        delete headers[apiKeyHeaderName];
      }
    }

    const rows = Object.entries(headers).map(([key, value]) => ({ key, value }));
    setHeaderRows(rows.length ? rows : [{ ...EMPTY_ROW }]);

    if (parsed.body) {
      setBody(parsed.body);
      setBodyMode("raw");
    }

    setShowCurlImport(false);
    setCurlText("");
    setStep1Result(null);
  }

  const showBody = method !== "GET";
  const bodyInvalid = showBody && format === "JSON" && body.trim() !== "" && !isValidJson(body);
  const supportsKeyValueBody = format === "JSON" || format === "FORM_URLENCODED";

  async function testConnection() {
    setTestingStep1(true);
    setStep1Result(null);
    try {
      const result = await testApi({
        baseUrl,
        httpMethod: method,
        requestFormat: format,
        authType: "NONE",
        headers: headersJson(),
        body: showBody ? body : null,
      });
      setStep1Result(result);
    } catch {
      setStep1Result({ success: false, httpStatus: null, latencyMs: 0, responseBody: null, errorMessage: "Could not reach the backend.", insights: null, transformedBody: null, transformError: null });
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
        headers: headersJson(),
        body: showBody ? body : null,
      });
      setStep2Result(result);
    } catch {
      setStep2Result({ success: false, httpStatus: null, latencyMs: 0, responseBody: null, errorMessage: "Could not reach the backend.", insights: null, transformedBody: null, transformError: null });
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
    const result = await addApi({
      name, baseUrl, method, format, security, responseMode, status: "DRAFT", authConfig,
      headers: headersJson(),
      aiProvider: responseMode === "AI_INSIGHT" && isPro ? aiProvider : null,
    });
    setSubmitting(false);
    if (result.ok) {
      // Saving registers the connection — it doesn't stand up the live uniform endpoint yet
      // (that runtime pipeline is still being built). Say so on the list page.
      router.push("/dashboard/apis?submitted=1");
    } else {
      setError(result.error ?? "Could not save the API.");
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
          <div>
            <button
              type="button"
              onClick={() => setShowCurlImport((s) => !s)}
              className="text-sm font-medium text-brand hover:underline"
            >
              {showCurlImport ? "Hide curl import" : "Paste a curl command instead →"}
            </button>
            {showCurlImport && (
              <div className="mt-3 space-y-2 rounded-lg border border-black/10 p-3 dark:border-white/10">
                <textarea
                  rows={4}
                  value={curlText}
                  onChange={(e) => setCurlText(e.target.value)}
                  placeholder={"curl -X POST https://api.acme.com/orders \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"total\": 25}'"}
                  className={`${inputClass} font-mono text-xs`}
                />
                {curlError && <p className="text-xs text-red-600 dark:text-red-400">{curlError}</p>}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={applyParsedCurl}
                    disabled={!curlText.trim()}
                    className="rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-brand-fg hover:opacity-90 disabled:opacity-50"
                  >
                    Parse & fill in
                  </button>
                </div>
              </div>
            )}
          </div>

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
              <select value={format} onChange={(e) => { setFormat(e.target.value as DataFormat); if (bodyMode === "keyvalue") syncBodyFromRows(bodyRows, e.target.value as DataFormat); }} className={inputClass}>
                {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Headers (optional)">
            <KeyValueRows
              rows={headerRows}
              onChange={updateHeaderRow}
              onAdd={addHeaderRow}
              onRemove={removeHeaderRow}
              keyPlaceholder="Header name"
              valuePlaceholder="Value"
            />
          </Field>

          {showBody && (
            <Field label="Request body (optional)">
              {supportsKeyValueBody && (
                <div className="mb-2 flex gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => switchBodyMode("keyvalue")}
                    className={`rounded-full px-3 py-1 ${bodyMode === "keyvalue" ? "bg-brand text-brand-fg" : "border border-black/15 dark:border-white/20"}`}
                  >
                    Key-value
                  </button>
                  <button
                    type="button"
                    onClick={() => switchBodyMode("raw")}
                    className={`rounded-full px-3 py-1 ${bodyMode === "raw" ? "bg-brand text-brand-fg" : "border border-black/15 dark:border-white/20"}`}
                  >
                    Raw
                  </button>
                </div>
              )}
              {bodyMode === "keyvalue" && supportsKeyValueBody ? (
                <KeyValueRows
                  rows={bodyRows}
                  onChange={updateBodyRow}
                  onAdd={addBodyRow}
                  onRemove={removeBodyRow}
                  keyPlaceholder="Field"
                  valuePlaceholder="Value"
                />
              ) : (
                <textarea
                  rows={6}
                  value={body}
                  onChange={(e) => { setBody(e.target.value); setStep1Result(null); }}
                  placeholder={format === "JSON" ? '{\n  "example": "value"\n}' : "Raw request body to send"}
                  className={`${inputClass} font-mono text-xs ${bodyInvalid ? "border-red-400" : ""}`}
                />
              )}
              {bodyMode === "keyvalue" && supportsKeyValueBody && (
                <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-black/5 p-2 font-mono text-xs text-zinc-500 dark:bg-white/5">
                  {body || "(empty)"}
                </pre>
              )}
              {bodyInvalid && <p className="mt-1 text-xs text-red-600 dark:text-red-400">Not valid JSON.</p>}
            </Field>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={testConnection}
              disabled={!baseUrl || testingStep1 || bodyInvalid}
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
              disabled={testingStep2 || bodyInvalid}
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
            {responseMode === "AI_INSIGHT" && (
              <Field label="AI provider">
                {!isPro ? (
                  <p className="rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm text-zinc-600 dark:text-zinc-400">
                    AI analysis is a Pro feature.{" "}
                    <Link href="/dashboard/account" className="text-brand hover:underline">
                      Request a Pro upgrade →
                    </Link>
                  </p>
                ) : (
                  <select
                    value={aiProvider ?? ""}
                    onChange={(e) => setAiProvider(e.target.value || null)}
                    className={inputClass}
                  >
                    <option value="">None</option>
                    {aiProviderCatalog.map((p) => (
                      <option key={p.provider} value={p.provider}>{p.label}</option>
                    ))}
                  </select>
                )}
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
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-xs text-zinc-500">
          <span className="font-mono">{result.httpStatus}</span> · {result.latencyMs}ms
        </div>
        <pre className="max-h-48 overflow-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-200">
          {result.responseBody ?? "(empty body)"}
        </pre>
      </div>
      {result.insights && (
        <div className="rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand">
            AI insights · {result.insights.quality} · {result.insights.anomalies} anomalies
          </div>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">{result.insights.summary}</p>
          {result.insights.recommendations.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-500">
              {result.insights.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function isValidJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

function parseBodyIntoRows(body: string, format: DataFormat): KeyValue[] {
  if (!body.trim()) return [];
  if (format === "FORM_URLENCODED") {
    return body.split("&").filter(Boolean).map((pair) => {
      const [k, v = ""] = pair.split("=");
      return { key: decodeURIComponent(k), value: decodeURIComponent(v) };
    });
  }
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }));
    }
  } catch {
    // not JSON — leave rows empty, raw text is preserved separately
  }
  return [];
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

function KeyValueRows({
  rows,
  onChange,
  onAdd,
  onRemove,
  keyPlaceholder,
  valuePlaceholder,
}: {
  rows: KeyValue[];
  onChange: (index: number, field: "key" | "value", value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  keyPlaceholder: string;
  valuePlaceholder: string;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={row.key}
            onChange={(e) => onChange(i, "key", e.target.value)}
            placeholder={keyPlaceholder}
            className={`${inputClass} flex-1`}
          />
          <input
            value={row.value}
            onChange={(e) => onChange(i, "value", e.target.value)}
            placeholder={valuePlaceholder}
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label="Remove"
            className="shrink-0 rounded-lg border border-black/15 px-3 text-zinc-400 hover:border-red-400 hover:text-red-500 dark:border-white/20"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="text-xs font-medium text-brand hover:underline"
      >
        + Add field
      </button>
    </div>
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
