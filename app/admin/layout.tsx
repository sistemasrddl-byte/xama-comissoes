import { ReactNode } from "react";

import AdminProtectedRoute from "@/components/auth/AdminProtectedRoute";
import AdminShell from "@/components/layout/AdminShell";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  return (
    <AdminProtectedRoute>
      <AdminShell>{children}</AdminShell>
    </AdminProtectedRoute>
  );
}
