"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calculator,
  FileBarChart,
  LayoutDashboard,
  Settings,
  Users,
  WalletCards,
  X,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Colaboradores",
    href: "/admin/colaboradores",
    icon: Users,
  },
  {
    label: "Resultados",
    href: "/admin/resultados",
    icon: BarChart3,
  },
  {
    label: "Comissões",
    href: "/admin/comissoes",
    icon: Calculator,
  },
  {
    label: "Fechamentos",
    href: "/admin/fechamentos",
    icon: WalletCards,
  },
  {
    label: "Relatórios",
    href: "/admin/relatorios",
    icon: FileBarChart,
  },
  {
    label: "Configurações",
    href: "/admin/configuracoes",
    icon: Settings,
  },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({
  mobileOpen = false,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  return (
    <>
      {/* =====================================================
          DESKTOP
      ====================================================== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:flex lg:flex-col">
        {/* Logo */}
        <div className="flex h-28 shrink-0 items-center justify-center border-b border-slate-100 px-4 dark:border-slate-800">
          <Link
            href="/admin"
            className="flex h-full w-full items-center justify-center"
          >
            <Image
              src="/images/logo-xama-transparente.png"
              alt="XAMA Microcrédito & Corretora"
              width={170}
              height={92}
              className="h-[92px] w-[170px] object-contain"
              priority
            />
          </Link>
        </div>

        {/* Título do menu */}
        <div className="px-5 pt-6 pb-2">
          <p className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Menu principal
          </p>
        </div>

        {/* Navegação */}
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex items-center gap-3 rounded-xl px-3.5 py-3",
                  "text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-orange-50 text-[#ea580c] dark:bg-orange-950/50 dark:text-orange-300"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                    active
                      ? "bg-white text-[#f97316] shadow-sm dark:bg-slate-800 dark:text-orange-300"
                      : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300",
                  ].join(" ")}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </span>

                <span className="truncate">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé */}
        <div className="shrink-0 border-t border-slate-100 px-4 pt-4 pb-5 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-[#ea580c] dark:bg-orange-950/60 dark:text-orange-300">
              A
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                XAMA Comissões - 1.0
              </p>

              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                Área administrativa
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MOBILE
      ====================================================== */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Fundo */}
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Menu */}
          <aside className="relative flex h-full w-[84%] max-w-[300px] flex-col bg-white shadow-2xl dark:bg-slate-950">
            {/* Cabeçalho */}
            <div className="flex h-24 shrink-0 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800">
              <Link
                href="/admin"
                onClick={onClose}
                className="flex h-full items-center"
              >
                <Image
                  src="/images/logo-xama-transparente.png"
                  alt="XAMA Microcrédito & Corretora"
                  width={140}
                  height={76}
                  className="h-[70px] w-[130px] object-contain"
                  priority
                />
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Título */}
            <div className="px-5 pt-6 pb-2">
              <p className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Menu principal
              </p>
            </div>

            {/* Navegação */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={[
                      "group flex items-center gap-3 rounded-xl px-3.5 py-3",
                      "text-sm font-medium transition-all",
                      active
                        ? "bg-orange-50 text-[#ea580c] dark:bg-orange-950/50 dark:text-orange-300"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        active
                          ? "bg-white text-[#f97316] shadow-sm dark:bg-slate-800 dark:text-orange-300"
                          : "text-slate-400",
                      ].join(" ")}
                    >
                      <Icon size={18} strokeWidth={1.8} />
                    </span>

                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Rodapé mobile */}
            <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-800">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-[#ea580c] dark:bg-orange-950/60 dark:text-orange-300">
                  A
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                    XAMA Comissões - 1.0
                  </p>

                  <p className="mt-0.5 truncate text-[10px] text-slate-400">
                    Área administrativa
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}