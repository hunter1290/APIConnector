import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AccountProvider } from "@/context/AccountContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

/** Authenticated app shell: sidebar + topbar around all dashboard pages. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AccountProvider>
        <WorkspaceProvider>
          <div className="flex h-screen w-full overflow-hidden">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <Topbar />
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
        </WorkspaceProvider>
      </AccountProvider>
    </ProtectedRoute>
  );
}
