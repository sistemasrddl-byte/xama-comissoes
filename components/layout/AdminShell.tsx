"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";

import AdminHeader from "@/components/layout/admin-header";
import AdminSidebar from "@/components/layout/admin-sidebar";
import MobileNav from "@/components/layout/mobile-nav";

interface AdminShellProps {
  children: ReactNode;
}

export default function AdminShell({
  children,
}: AdminShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const pathname = usePathname();

  // O Dashboard já possui seu próprio container, largura e
  // espaçamento. As demais páginas foram construídas para
  // receber o espaçamento padrão do shell administrativo.
  const ehDashboard =
    pathname === "/admin";

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="min-h-dvh lg:pl-60">
        <AdminHeader
          onMenuClick={() =>
            setMobileMenuOpen(true)
          }
        />

        <main
          className={[
            "min-h-[calc(100dvh-4rem)] pb-20 lg:pb-8",
            ehDashboard
              ? ""
              : "px-4 py-5 sm:px-6 lg:px-8",
          ].join(" ")}
        >
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
