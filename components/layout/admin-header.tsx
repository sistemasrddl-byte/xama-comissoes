"use client";

import { LogOut, Menu } from "lucide-react";
import { signOut } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({
  onMenuClick,
}: AdminHeaderProps) {
  const router = useRouter();

  const [menuUsuarioAberto, setMenuUsuarioAberto] =
    useState(false);

  const [nomeUsuario, setNomeUsuario] =
    useState("Administrador");

  const [emailUsuario, setEmailUsuario] =
    useState("admin@xama.com");

  const menuRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const usuario = auth.currentUser;

    if (usuario) {
      setNomeUsuario(
        usuario.displayName || "Administrador"
      );

      setEmailUsuario(
        usuario.email || "admin@xama.com"
      );
    }

    function fecharAoClicarFora(
      event: MouseEvent
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setMenuUsuarioAberto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      fecharAoClicarFora
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharAoClicarFora
      );
    };
  }, []);

  async function sairDoSistema() {
    try {
      setMenuUsuarioAberto(false);

      await signOut(auth);

      router.replace("/");
    } catch (error) {
      console.error(
        "Erro ao sair do sistema:",
        error
      );
    }
  }

  return (
    <header
      className="
        sticky top-0 z-30
        flex h-16 items-center justify-between
        border-b border-slate-200
        bg-white/95
        px-4
        backdrop-blur
        dark:border-slate-800
        dark:bg-slate-950/95
        sm:px-6 lg:px-8
      "
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="
            rounded-xl p-2
            text-slate-600
            transition hover:bg-slate-100
            dark:text-slate-300
            dark:hover:bg-slate-800
            lg:hidden
          "
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
            XAMA Comissões - 1.1
          </p>

          <h1 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
            Área administrativa
          </h1>
        </div>
      </div>

      <div
        ref={menuRef}
        className="relative flex items-center gap-2 sm:gap-3"
      >
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {nomeUsuario}
          </p>

          <p className="text-xs text-slate-400 dark:text-slate-500">
            Acesso administrativo
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setMenuUsuarioAberto(
              (aberto) => !aberto
            )
          }
          className="
            flex h-10 w-10 items-center justify-center
            rounded-full
            bg-orange-100
            text-sm font-bold text-[#ea580c]
            ring-2 ring-transparent
            transition
            hover:ring-orange-200
            focus:outline-none
            focus:ring-orange-300
            dark:bg-orange-950/60
            dark:text-orange-300
            dark:hover:ring-orange-800
          "
          aria-label="Abrir informações do usuário"
          aria-expanded={menuUsuarioAberto}
        >
          X
        </button>

        {menuUsuarioAberto && (
          <div
            className="
              absolute right-0 top-[calc(100%+10px)]
              z-50 w-72 overflow-hidden
              rounded-2xl
              border border-slate-200
              bg-white
              shadow-xl shadow-slate-900/10
              dark:border-slate-800
              dark:bg-slate-900
              dark:shadow-black/30
            "
          >
            <div className="border-b border-slate-100 p-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex h-11 w-11 shrink-0
                    items-center justify-center
                    rounded-full
                    bg-orange-100
                    text-sm font-bold text-[#ea580c]
                    dark:bg-orange-950/60
                    dark:text-orange-300
                  "
                >
                  X
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                    {nomeUsuario}
                  </p>

                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {emailUsuario}
                  </p>

                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Administrador
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                type="button"
                onClick={sairDoSistema}
                className="
                  flex w-full items-center gap-3
                  rounded-xl px-3 py-3
                  text-left text-sm font-semibold
                  text-red-600
                  transition hover:bg-red-50
                  dark:text-red-400
                  dark:hover:bg-red-950/40
                "
              >
                <span
                  className="
                    flex h-9 w-9 items-center justify-center
                    rounded-lg bg-red-50
                    dark:bg-red-950/40
                  "
                >
                  <LogOut size={17} />
                </span>

                <span>
                  <span className="block">
                    Sair do sistema
                  </span>

                  <span className="mt-0.5 block text-[10px] font-normal text-red-400 dark:text-red-500">
                    Encerrar esta sessão
                  </span>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
