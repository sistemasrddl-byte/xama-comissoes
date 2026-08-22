"use client";

import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/user";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export default function AdminProtectedRoute({
  children,
}: AdminProtectedRouteProps) {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [ehAdmin, setEhAdmin] = useState(false);

  useEffect(() => {
    const cancelar = onAuthStateChanged(
      auth,
      async (usuarioAtual) => {
        try {
          setCarregando(true);
          setUsuario(usuarioAtual);

          if (!usuarioAtual) {
            setEhAdmin(false);
            router.replace("/");
            return;
          }


          const perfil = await getUserProfile(
            usuarioAtual.uid
          );

          // Usuário autenticado como colaborador não deve voltar
          // para o login ao tentar acessar uma rota administrativa.
          if (perfil?.role === "colaborador") {
            setEhAdmin(false);
            router.replace("/colaborador");
            return;
          }

          const acessoPermitido =
            perfil?.role === "admin" &&
            perfil?.ativo !== false;

          if (!acessoPermitido) {
            setEhAdmin(false);
            router.replace("/");
            return;
          }

          setEhAdmin(true);
        } catch (error) {
          console.error(
            "Erro ao validar acesso administrativo:",
            error
          );

          setEhAdmin(false);
          router.replace("/");
        } finally {
          setCarregando(false);
        }
      }
    );

    return () => cancelar();
  }, [router]);

  if (carregando || !usuario || !ehAdmin) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#f97316]" />
          <p className="text-sm font-medium text-slate-600">
            Verificando acesso...
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
