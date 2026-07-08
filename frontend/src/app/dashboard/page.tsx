"use client";

import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function DashboardContent() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          onClick={logout}
          className="rounded-full border border-black/15 px-4 py-2 text-sm dark:border-white/20"
        >
          Sign out
        </button>
      </header>

      <section className="rounded-xl border border-black/10 p-6 dark:border-white/15">
        <h2 className="mb-2 text-lg font-medium">Welcome, {user?.fullName}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <dt>Email</dt>
          <dd>{user?.email}</dd>
          <dt>Role</dt>
          <dd>{user?.role}</dd>
        </dl>
      </section>

      <p className="mt-6 text-sm text-zinc-500">
        Connections and API integrations will appear here.
      </p>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
