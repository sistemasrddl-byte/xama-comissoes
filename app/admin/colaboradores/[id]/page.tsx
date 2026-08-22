"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Edit3,
  Mail,
  Phone,
  Target,
  UserRound,
  Wallet,
} from "lucide-react";

import {
  Colaborador,
  alterarStatusColaborador,
  observarColaborador,
} from "@/lib/colaboradores";

function formatarData(data: string) {
  if (!data) {
    return "Não informada";
  }

  const partes = data.split("-");

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ColaboradorDetalhesPage() {
  const params = useParams();
  const router = useRouter();

  const id = String(params.id);

  const [colaborador, setColaborador] =
    useState<Colaborador | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [alterandoStatus, setAlterandoStatus] =
    useState(false);

  const [dialogStatusAberto, setDialogStatusAberto] =
    useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    const unsubscribe = observarColaborador(
      id,
      (dados) => {
        setColaborador(dados);
        setCarregando(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  function abrirDialogStatus() {
    if (!colaborador || alterandoStatus) {
      return;
    }

    setDialogStatusAberto(true);
  }

  function fecharDialogStatus() {
    if (alterandoStatus) {
      return;
    }

    setDialogStatusAberto(false);
  }

  async function confirmarAlteracaoStatus() {
    if (!colaborador) {
      return;
    }

    const novoStatus = !colaborador.ativo;

    try {
      setAlterandoStatus(true);

      await alterarStatusColaborador(
        colaborador.id,
        novoStatus
      );

      setDialogStatusAberto(false);
    } catch (error) {
      console.error(
        "Erro ao alterar status:",
        error
      );

      window.alert(
        "Não foi possível alterar o status."
      );
    } finally {
      setAlterandoStatus(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-400">
          Carregando colaborador...
        </p>
      </div>
    );
  }

  if (!colaborador) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <UserRound size={26} />
        </div>

        <h1 className="mt-4 text-lg font-semibold text-slate-800">
          Colaborador não encontrado
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          O colaborador pode ter sido removido ou o
          endereço é inválido.
        </p>

        <Link
          href="/admin/colaboradores"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#f97316] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#ea580c]"
        >
          <ArrowLeft size={17} />
          Voltar para colaboradores
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <Link
          href="/admin/colaboradores"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#ea580c]"
        >
          <ArrowLeft size={17} />
          Voltar para colaboradores
        </Link>
      </div>

      {/* Perfil */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-xl font-bold text-[#ea580c]">
              {colaborador.nome
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {colaborador.nome}
                </h1>

                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    colaborador.ativo
                      ? "bg-green-50 text-green-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {colaborador.ativo
                    ? "Ativo"
                    : "Inativo"}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {colaborador.cargo ||
                  "Cargo não informado"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/admin/colaboradores/${colaborador.id}/editar`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Edit3 size={17} />
              Editar
            </Link>

            <button
              type="button"
              onClick={abrirDialogStatus}
              disabled={alterandoStatus}
              className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
                colaborador.ativo
                  ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-green-600 text-white hover:bg-green-700"
              } disabled:opacity-60`}
            >
              {alterandoStatus
                ? "Alterando..."
                : colaborador.ativo
                  ? "Desativar"
                  : "Ativar"}
            </button>
          </div>
        </div>
      </section>

      {/* Informações */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Dados pessoais
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Informações cadastradas.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <UserRound
                size={18}
                className="mt-0.5 text-slate-400"
              />

              <div>
                <p className="text-xs text-slate-400">
                  Nome completo
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {colaborador.nome}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <UserRound
                size={18}
                className="mt-0.5 text-slate-400"
              />

              <div>
                <p className="text-xs text-slate-400">
                  CPF
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {colaborador.cpf ||
                    "Não informado"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays
                size={18}
                className="mt-0.5 text-slate-400"
              />

              <div>
                <p className="text-xs text-slate-400">
                  Data de admissão
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {formatarData(
                    colaborador.dataAdmissao
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Contato e função
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Informações profissionais.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <Mail
                size={18}
                className="mt-0.5 text-slate-400"
              />

              <div>
                <p className="text-xs text-slate-400">
                  E-mail
                </p>

                <p className="mt-1 break-all text-sm font-medium text-slate-700">
                  {colaborador.email ||
                    "Não informado"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone
                size={18}
                className="mt-0.5 text-slate-400"
              />

              <div>
                <p className="text-xs text-slate-400">
                  Telefone
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {colaborador.telefone ||
                    "Não informado"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <BriefcaseBusiness
                size={18}
                className="mt-0.5 text-slate-400"
              />

              <div>
                <p className="text-xs text-slate-400">
                  Cargo / função
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {colaborador.cargo ||
                    "Não informado"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Desempenho */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <h2 className="font-semibold text-slate-900">
            Desempenho
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Indicadores do colaborador.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-[#f97316]">
              <Target size={18} />
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Meta mensal
            </p>

            <p className="mt-1 text-lg font-bold text-slate-800">
              {formatarMoeda(
                colaborador.metaMensal
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Target size={18} />
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Produção
            </p>

            <p className="mt-1 text-lg font-bold text-slate-800">
              R$ 0,00
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <Wallet size={18} />
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Comissão
            </p>

            <p className="mt-1 text-lg font-bold text-slate-800">
              R$ 0,00
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Wallet size={18} />
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Bonificação
            </p>

            <p className="mt-1 text-lg font-bold text-slate-800">
              R$ 0,00
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
          <p className="text-sm font-medium text-slate-600">
            Os dados de produção e comissão aparecerão aqui.
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Eles serão calculados automaticamente quando o
            módulo de resultados estiver configurado.
          </p>
        </div>
      </section>

      {dialogStatusAberto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharDialogStatus();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-status-titulo"
            aria-describedby="dialog-status-descricao"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  colaborador.ativo
                    ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                    : "bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400"
                }`}
              >
                <UserRound size={20} />
              </div>

              <div className="min-w-0">
                <h2
                  id="dialog-status-titulo"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  {colaborador.ativo
                    ? "Desativar colaborador?"
                    : "Ativar colaborador?"}
                </h2>

                <p
                  id="dialog-status-descricao"
                  className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400"
                >
                  {colaborador.ativo ? (
                    <>
                      Tem certeza que deseja desativar{" "}
                      <strong className="font-semibold text-slate-700 dark:text-slate-200">
                        {colaborador.nome}
                      </strong>
                      ? O acesso ao sistema será interrompido,
                      mas os dados e o histórico serão mantidos.
                    </>
                  ) : (
                    <>
                      Deseja reativar{" "}
                      <strong className="font-semibold text-slate-700 dark:text-slate-200">
                        {colaborador.nome}
                      </strong>
                      ? O colaborador poderá acessar o sistema
                      novamente.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={fecharDialogStatus}
                disabled={alterandoStatus}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarAlteracaoStatus}
                disabled={alterandoStatus}
                className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  colaborador.ativo
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {alterandoStatus
                  ? "Alterando..."
                  : colaborador.ativo
                    ? "Desativar colaborador"
                    : "Ativar colaborador"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}