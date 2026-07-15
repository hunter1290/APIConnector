"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { NoWorkspace } from "@/components/dashboard/NoWorkspace";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import {
  createTransformer,
  deleteTransformer,
  listTransformers,
  testTransformer,
  type TransformerDto,
  type TransformerTestResult,
} from "@/lib/connectorApi";
import type { DataFormat, ThirdPartyApi } from "@/types/connector";

const FORMATS: DataFormat[] = ["JSON", "XML", "CSV", "SOAP", "FORM_URLENCODED"];

const inputClass =
  "w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-sm dark:border-white/20";

export default function TransformersPage() {
  const { activeSet, loading: workspaceLoading } = useWorkspace();
  const [transformers, setTransformers] = useState<TransformerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTransformers(await listTransformers());
      setError(null);
    } catch {
      setError("Could not load transformers. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (workspaceLoading || loading) return <DashboardLoading />;
  if (!activeSet) return <NoWorkspace />;

  const apisInWorkspace = activeSet.apis;
  const transformersInWorkspace = transformers.filter((t) =>
    apisInWorkspace.some((a) => Number(a.id) === t.apiDetailId),
  );

  async function handleDelete(id: number) {
    try {
      await deleteTransformer(id);
      setTransformers((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Could not remove transformer.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Transformers</h1>
          <p className="mt-1 text-sm text-zinc-500">
            JSONata expressions that normalize an API&apos;s response into your unified format.
            Attached to an API in &ldquo;{activeSet.name}&rdquo;, applied automatically when you
            &quot;Try it&quot; in the Explorer.
          </p>
        </div>
        {!adding && apisInWorkspace.length > 0 && (
          <button
            onClick={() => setAdding(true)}
            className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90"
          >
            + Add transformer
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {apisInWorkspace.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 p-12 text-center dark:border-white/15">
          <p className="text-zinc-500">Add a third-party API first, then attach a transformer to it.</p>
          <Link href="/dashboard/apis/new" className="mt-4 inline-block text-brand">
            Add an API →
          </Link>
        </div>
      ) : adding ? (
        <AddTransformerForm
          apis={apisInWorkspace}
          onCancel={() => setAdding(false)}
          onSaved={(t) => {
            setTransformers((prev) => [...prev, t]);
            setAdding(false);
          }}
        />
      ) : transformersInWorkspace.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 p-12 text-center dark:border-white/15">
          <p className="text-zinc-500">No transformers yet in this workspace.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transformersInWorkspace.map((t) => {
            const api = apisInWorkspace.find((a) => Number(a.id) === t.apiDetailId);
            return (
              <div key={t.id} className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{t.name}</h3>
                    <p className="text-xs text-zinc-500">
                      {api?.name ?? "Unknown API"} · {t.sourceFormat} → {t.targetFormat}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="shrink-0 text-xs font-medium text-zinc-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-200">
                  {t.config}
                </pre>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddTransformerForm({
  apis,
  onCancel,
  onSaved,
}: {
  apis: ThirdPartyApi[];
  onCancel: () => void;
  onSaved: (t: TransformerDto) => void;
}) {
  const [apiDetailId, setApiDetailId] = useState<number>(Number(apis[0].id));
  const [name, setName] = useState("");
  const [sourceFormat, setSourceFormat] = useState<DataFormat>(apis[0].format);
  const [targetFormat, setTargetFormat] = useState<DataFormat>("JSON");
  const [config, setConfig] = useState("");
  const [sampleData, setSampleData] = useState("");
  const [testResult, setTestResult] = useState<TransformerTestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleApiChange(id: number) {
    setApiDetailId(id);
    const api = apis.find((a) => Number(a.id) === id);
    if (api) setSourceFormat(api.format);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    let parsedSample: unknown;
    try {
      parsedSample = JSON.parse(sampleData);
    } catch {
      setTestResult({ success: false, result: null, errorMessage: "Sample data must be valid JSON." });
      setTesting(false);
      return;
    }
    try {
      setTestResult(await testTransformer(config, parsedSample));
    } catch {
      setTestResult({ success: false, result: null, errorMessage: "Could not reach the backend." });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const saved = await createTransformer({ apiDetailId, name, sourceFormat, targetFormat, config });
      onSaved(saved);
    } catch {
      setError("Could not save the transformer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-black/10 p-6 dark:border-white/10">
      <Field label="API">
        <select
          value={apiDetailId}
          onChange={(e) => handleApiChange(Number(e.target.value))}
          className={inputClass}
        >
          {apis.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <Field label="Name">
        <input required value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Normalize orders" className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Source format">
          <select value={sourceFormat} onChange={(e) => setSourceFormat(e.target.value as DataFormat)} className={inputClass}>
            {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Target format">
          <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value as DataFormat)} className={inputClass}>
            {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
      </div>
      {sourceFormat !== "JSON" && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Auto-applying during &quot;Try it&quot; currently only supports JSON source responses —
          this transformer can still be saved and tested here, but won&apos;t run automatically
          for a non-JSON API yet.
        </p>
      )}
      <Field label="JSONata expression">
        <textarea
          rows={4}
          required
          value={config}
          onChange={(e) => setConfig(e.target.value)}
          placeholder='{"orderId": id, "amount": total}'
          className={`${inputClass} font-mono text-xs`}
        />
      </Field>
      <Field label="Sample data (JSON) — to test the expression above">
        <textarea
          rows={6}
          value={sampleData}
          onChange={(e) => setSampleData(e.target.value)}
          placeholder='{"id": "A-1042", "total": 249.0, "status": "shipped"}'
          className={`${inputClass} font-mono text-xs`}
        />
      </Field>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || !config.trim() || !sampleData.trim()}
          className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
        >
          {testing ? "Testing…" : "Test transform"}
        </button>
      </div>
      {testResult && (
        testResult.success ? (
          <pre className="max-h-48 overflow-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-200">
            {JSON.stringify(testResult.result, null, 2)}
          </pre>
        ) : (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {testResult.errorMessage ?? "The transform failed."}
          </p>
        )
      )}
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-full border border-black/15 px-5 py-2 text-sm dark:border-white/20">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-fg hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save transformer"}
        </button>
      </div>
    </form>
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
