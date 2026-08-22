"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calculator,
  LayoutDashboard,
  MoreHorizontal,
} from "lucide-react";

const items = [
  {
    label: "Início",
    href: "/admin",
    icon: LayoutDashboard,
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
    label: "Mais",
    href: "/admin/configuracoes",
    icon: MoreHorizontal,
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-950/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-medium transition ${
                active ? "text-[#ea580c]" : "text-slate-400 dark:text-slate-500"
              }`}
            >
              <Icon size={20} />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}