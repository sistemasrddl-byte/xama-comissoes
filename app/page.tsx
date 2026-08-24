"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail } from "lucide-react";

import { login, logout, resetPassword } from "@/lib/auth";
import { getUserProfile } from "@/lib/user";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modo, setModo] = useState<"login" | "recuperar">("login");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Informe seu e-mail e sua senha.");
      return;
    }

    try {
      setLoading(true);

      const credential = await login(email, password);

      const profile = await getUserProfile(credential.user.uid);

      if (!profile) {
        await logout();

        setError(
          "Seu usuário foi encontrado, mas seu perfil ainda não foi configurado."
        );

        return;
      }

      if (!profile.ativo) {
        await logout();

        setError(
          "Seu acesso está desativado. Entre em contato com o administrador."
        );

        return;
      }

      if (profile.role === "admin") {
        router.replace("/admin");
        return;
      }

      if (profile.role === "colaborador") {
        router.replace("/colaborador");
        return;
      }

      await logout();

      setError("Perfil de acesso inválido.");
    } catch (error) {
      console.error("Erro ao realizar login:", error);

      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Informe o e-mail cadastrado.");
      return;
    }

    try {
      setLoading(true);

      await resetPassword(email);

      setSuccess(
        "Se existir uma conta com esse e-mail, enviaremos um link para redefinir sua senha."
      );
    } catch (error) {
      console.error(
        "Erro ao solicitar recuperação de senha:",
        error
      );

      const codigo =
        error instanceof Error &&
        "code" in error
          ? String(
              (error as { code?: unknown }).code
            )
          : "";

      switch (codigo) {
        case "auth/invalid-email":
          setError("Informe um e-mail válido.");
          break;

        case "auth/user-not-found":
          setError(
            "Não encontramos uma conta com esse e-mail."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Muitas solicitações. Aguarde um momento e tente novamente."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Não foi possível conectar ao servidor. Verifique sua internet."
          );
          break;

        case "auth/operation-not-allowed":
          setError(
            "A recuperação de senha não está habilitada no Firebase."
          );
          break;

        default:
          setError(
            "Não foi possível enviar o link de recuperação. Tente novamente."
          );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-5 w-56 sm:w-64">
            <Image
              src="/images/logo-xama-transparente.png"
              alt="XAMA Microcrédito & Corretora"
              width={700}
              height={700}
              className="h-auto w-full object-contain"
              priority
            />
          </div>

          <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            XAMA Comissões
          </h1>

          <p className="mt-2 text-center text-sm leading-6 text-slate-500">
            Gestão de desempenho, comissões e bonificações.
          </p>
        </div>

        {/* Card de Login */}
        {/* Card de Login */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          {modo === "login" ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Acesse sua conta
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Entre com seus dados para continuar.
                </p>
              </div>

              <form
                className="space-y-5"
                onSubmit={handleSubmit}
              >
                {/* E-mail */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    E-mail
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Senha
                    </label>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setModo("recuperar");
                        setError("");
                        setSuccess("");
                      }}
                      className="text-xs font-medium text-[#ea580c] transition-colors hover:text-[#c2410c] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f97316] px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[#ea580c] hover:shadow-orange-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Entrando..." : "Entrar"}

                  {!loading && (
                    <ArrowRight size={18} />
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setModo("login");
                    setError("");
                    setSuccess("");
                  }}
                  className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-500 transition-colors hover:text-[#ea580c] disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  Voltar para o login
                </button>

                <h2 className="text-xl font-semibold text-slate-900">
                  Recuperar senha
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Informe seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
              </div>

              <form
                className="space-y-5"
                onSubmit={handleResetPassword}
              >
                <div>
                  <label
                    htmlFor="reset-email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    E-mail
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="reset-email"
                      name="reset-email"
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-700">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f97316] px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[#ea580c] hover:shadow-orange-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading
                    ? "Enviando..."
                    : "Enviar link de recuperação"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="mt-6 text-center">
          <p className="text-xs font-medium text-slate-400">
            XAMA Microcrédito & Corretora
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Sistema de gestão de comissões
          </p>
        </div>
      </div>
    </main>
  );
}