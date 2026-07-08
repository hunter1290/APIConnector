"use client";

// Client-side guard: redirects to /login when there is no authenticated user.
// Suitable because the JWT lives in the browser (localStorage). For server-side
// enforcement, move token storage to an httpOnly cookie and check it in proxy.ts.

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
