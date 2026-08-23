"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Pencil,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  Wallet,
  Target,
} from "lucide-react";

import {
  buscarResultado,
  excluirResultado,
  Resultado,
} from "@/lib/resultados";

import {
  observarColaborador,
  Colaborador,
} from "@/lib/colaboradores";

import ConfirmDialog from "@/components/ui/confirm-dialog";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data: string) {
  if (!data) return "—";

  const partes = data.split("-");

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarCompetencia(competencia: string) {
  if (!competencia) return "—";

  const [ano, mes] = competencia.split("-");

  const nomesMeses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const indice = Number(mes) - 1;

  if (!ano || indice < 0 || indice > 11) {
    return competencia;
  }

  return `${nomesMeses[indice]} de ${ano}`;
}

function getSituacaoClasses(
  situacao: Resultado["situacao"]
) {
  switch (situacao) {
    case "Grupo Desembolsado":
      return "bg-green-50 text-green-700 border-green-200";

    case "Grupo em Atraso":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "Grupo Evadido":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function getSituacaoIcon(
  situacao: Resultado["situacao"]
) {
  switch (situacao) {
    case "Grupo Desembolsado":
      return <CheckCircle2 size={15} />;

    case "Grupo em Atraso":
      return <CalendarDays size={15} />;

    case "Grupo Evadido":
      return <Users size={15} />;

    default:
      return null;
  }
}

export default function ResultadoDetalhesPage() {
  const params = useParams();
  const router = useRouter();

  const id =
    typeof params.id === "string"
      ? params.id
      : "";

  const [resultado, setResultado] =
    useState<Resultado | null>(null);

  const [colaborador, setColaborador] =
    useState<Colaborador | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  const [dialogAberto, setDialogAberto] =
    useState(false);

  const [excluindo, setExcluindo] =
    useState(false);

  useEffect(() => {
    if (!id) return;

    let cancelado = false;
    let unsubscribeColaborador:
      | (() => void)
      | undefined;

    async function carregarResultado() {
      try {
        setCarregando(true);
        setErro("");

        const resultadoEncontrado =
          await buscarResultado(id);

        if (cancelado) return;

        if (!resultadoEncontrado) {
          setErro("Resultado não encontrado.");
          setResultado(null);
          setCarregando(false);
          return;
        }

        setResultado(resultadoEncontrado);

        if (resultadoEncontrado.colaboradorId) {
          unsubscribeColaborador =
            observarColaborador(
              resultadoEncontrado.colaboradorId,
              (colaboradorEncontrado) => {
                if (!cancelado) {
                  setColaborador(
                    colaboradorEncontrado
                  );
                }
              }
            );
        }

        setCarregando(false);
      } catch (error) {
        console.error(
          "Erro ao carregar resultado:",
          error
        );

        if (!cancelado) {
          setErro(
            "Não foi possível carregar o resultado."
          );
          setCarregando(false);
        }
      }
    }

    carregarResultado();

    return () => {
      cancelado = true;
      unsubscribeColaborador?.();
    };
  }, [id]);

  async function confirmarExclusao() {
    if (!id) return;

    try {
      setExcluindo(true);

      await excluirResultado(id);

      setDialogAberto(false);

      router.push("/admin/resultados");
    } catch (error) {
      console.error(
        "Erro ao excluir resultado:",
        error
      );

      setErro(
        "Não foi possível excluir o resultado."
      );

      setExcluindo(false);
      setDialogAberto(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#f97316]" />

          <p className="mt-3 text-sm text-slate-500">
            Carregando resultado...
          </p>
        </div>
      </div>
    );
  }

  if (erro || !resultado) {
    return (
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/resultados"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#ea580c]"
        >
          <ArrowLeft size={17} />
          Voltar para resultados
        </Link>

        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="font-semibold text-red-700">
            {erro || "Resultado não encontrado."}
          </p>

          <Link
            href="/admin/resultados"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#f97316] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ea580c]"
          >
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/admin/resultados"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#ea580c]"
            >
              <ArrowLeft size={17} />
              Voltar para resultados
            </Link>

            <div className="mt-5">
              <p className="text-sm font-semibold text-[#f97316]">
                Resultado
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {resultado.nomeCliente}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {formatarCompetencia(
                  resultado.competencia
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/admin/resultados/${resultado.id}/editar`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Pencil size={16} />

              <span className="hidden sm:inline">
                Editar
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setDialogAberto(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={16} />

              <span className="hidden sm:inline">
                Excluir
              </span>
            </button>
          </div>
        </div>

        {erro && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        {/* Operação */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#f97316]">
                  <UserRound size={22} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-400">
                    Colaborador
                  </p>

                  <p className="truncate font-semibold text-slate-900">
                    {colaborador?.nome ||
                      "Colaborador"}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${getSituacaoClasses(
                  resultado.situacao
                )}`}
              >
                {getSituacaoIcon(
                  resultado.situacao
                )}

                {resultado.situacao.replace(
                  "Grupo ",
                  ""
                )}
              </span>
            </div>
          </div>

          <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <InfoItem
              label="Cliente / Grupo"
              value={resultado.nomeCliente || "—"}
            />

            <InfoItem
              label="Data do desembolso"
              value={formatarData(
                resultado.dataDesembolso
              )}
            />

            <InfoItem
              label="Nº clientes"
              value={String(
                resultado.quantidadeClientes ?? 0
              )}
            />
          </div>
        </section>

        {/* Produtividade e seguros */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={<CircleDollarSign size={18} />}
            title="Produtividade e seguros"
            description="Valores e quantidades registrados no resultado."
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="PRODUTIVIDADE"
              value={formatarMoeda(
                resultado.produtividade
              )}
              icon={<Target size={18} />}
              highlight
            />

            <MetricCard
              label="Seguro Finsol"
              value={formatarMoeda(
                resultado.seguroFinsol
              )}
              icon={<ShieldCheck size={18} />}
            />

            <MetricCard
              label="Seguro assistência"
              value={String(
                resultado.seguroAssistencia ?? 0
              )}
              icon={<ShieldCheck size={18} />}
            />

            <MetricCard
              label="Previsão de reembolso"
              value={formatarMoeda(
                resultado.previsaoReembolso
              )}
              icon={<Wallet size={18} />}
            />

            <MetricCard
              label="Seguro PRESTAMISTA"
              value={String(
                resultado.seguroPrestamista ?? 0
              )}
              icon={<ShieldCheck size={18} />}
            />
          </div>
        </section>

        {/* Observações */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={<FileTextIcon />}
            title="Observações"
            description="Informações adicionais do lançamento."
          />

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            {resultado.observacoes ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {resultado.observacoes}
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                Nenhuma observação registrada.
              </p>
            )}
          </div>
        </section>

        <div className="pb-6 text-center text-xs text-slate-400">
          Resultado registrado em{" "}
          {resultado.criadoEm
            ? resultado.criadoEm
                .toDate()
                .toLocaleString("pt-BR")
            : "data não informada"}
        </div>
      </div>

      <ConfirmDialog
        open={dialogAberto}
        title="Excluir resultado?"
        description="Esta ação não pode ser desfeita. O lançamento será removido permanentemente."
        confirmText="Excluir resultado"
        cancelText="Cancelar"
        loading={excluindo}
        onCancel={() => {
          if (!excluindo) {
            setDialogAberto(false);
          }
        }}
        onConfirm={confirmarExclusao}
      >
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs text-slate-400">
            Lançamento
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-slate-800">
            {resultado.nomeCliente}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {colaborador?.nome || "Colaborador"}{" "}
            •{" "}
            {formatarCompetencia(
              resultado.competencia
            )}
          </p>
        </div>
      </ConfirmDialog>
    </>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="p-5 sm:p-6">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#f97316]">
        {icon}
      </div>

      <div>
        <h2 className="font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-orange-100 bg-orange-50/50"
          : "border-slate-100 bg-slate-50/60"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={
            highlight
              ? "text-[#f97316]"
              : "text-slate-400"
          }
        >
          {icon}
        </span>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function FileTextIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}
