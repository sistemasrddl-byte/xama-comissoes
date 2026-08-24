"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import {
  observarResultados,
  Resultado,
} from "@/lib/resultados";

import {
  Colaborador,
  observarColaboradores,
} from "@/lib/colaboradores";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data: string) {
  if (!data) return "-";

  const partes = data.split("-");

  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export default function ResultadosPage() {
  const router = useRouter();

  const [resultados, setResultados] =
    useState<Resultado[]>([]);

  const [colaboradores, setColaboradores] =
    useState<Colaborador[]>([]);

  const [competencia, setCompetencia] =
    useState("2026-08");

  const [colaboradorFiltro, setColaboradorFiltro] =
    useState("todos");

  const [busca, setBusca] = useState("");

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    const unsubscribeResultados =
      observarResultados((dados) => {
        setResultados(dados);
        setCarregando(false);
      });

    const unsubscribeColaboradores =
      observarColaboradores((dados) => {
        setColaboradores(dados);
      });

    return () => {
      unsubscribeResultados();
      unsubscribeColaboradores();
    };
  }, []);

  const resultadosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return resultados.filter((resultado) => {
      const mesmaCompetencia =
        resultado.competencia === competencia;

      const mesmoColaborador =
        colaboradorFiltro === "todos" ||
        resultado.colaboradorId ===
          colaboradorFiltro;

      const mesmaBusca =
        !termo ||
        resultado.nomeCliente
          .toLowerCase()
          .includes(termo);

      return (
        mesmaCompetencia &&
        mesmoColaborador &&
        mesmaBusca
      );
    });
  }, [
    resultados,
    competencia,
    colaboradorFiltro,
    busca,
  ]);

  const resumo = useMemo(() => {
    return resultadosFiltrados.reduce(
      (acc, resultado) => {
        acc.clientes +=
          resultado.quantidadeClientes || 0;

        acc.produtividade +=
          resultado.produtividade || 0;

        acc.seguroFinsol +=
          resultado.seguroFinsol || 0;

        acc.seguroAssistencia +=
          resultado.seguroAssistencia || 0;

        acc.reembolso +=
          resultado.previsaoReembolso || 0;

        acc.seguroPrestamista +=
          resultado.seguroPrestamista || 0;

        return acc;
      },
      {
        clientes: 0,
        produtividade: 0,
        seguroFinsol: 0,
        seguroAssistencia: 0,
        reembolso: 0,
        seguroPrestamista: 0,
      }
    );
  }, [resultadosFiltrados]);

  function obterNomeColaborador(
    id: string
  ) {
    return (
      colaboradores.find(
        (colaborador) => colaborador.id === id
      )?.nome ||
      "Colaborador não encontrado"
    );
  }

  function abrirResultado(id: string) {
    router.push(`/admin/resultados/${id}`);
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#f97316]">
            Desempenho
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Resultados
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Registre e acompanhe os resultados dos
            colaboradores.
          </p>
        </div>

        <Link
          href="/admin/resultados/novo"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#ea580c]"
        >
          <Plus size={18} />
          Novo resultado
        </Link>
      </div>

      {/* Filtros */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-500">
              Competência
            </label>

            <div className="relative">
              <CalendarDays
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="month"
                value={competencia}
                onChange={(event) =>
                  setCompetencia(
                    event.target.value
                  )
                }
                className="input-month-clean h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-500">
              Colaborador
            </label>

            <select
              value={colaboradorFiltro}
              onChange={(event) =>
                setColaboradorFiltro(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
            >
              <option value="todos">
                Todos os colaboradores
              </option>

              {colaboradores
                .filter(
                  (colaborador) =>
                    colaborador.ativo
                )
                .map((colaborador) => (
                  <option
                    key={colaborador.id}
                    value={colaborador.id}
                  >
                    {colaborador.nome}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-500">
              Buscar cliente
            </label>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={busca}
                onChange={(event) =>
                  setBusca(event.target.value)
                }
                placeholder="Nome do cliente..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#f97316]">
            <BarChart3 size={20} />
          </div>

          <p className="mt-4 text-xs text-slate-400">
            PRODUTIVIDADE
          </p>

          <p className="mt-1 text-xl font-bold text-slate-900">
            {formatarMoeda(
              resumo.produtividade
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Users size={20} />
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Nº CLIENTES
          </p>

          <p className="mt-1 text-xl font-bold text-slate-900">
            {resumo.clientes}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <ShieldCheck size={20} />
          </div>

          <p className="mt-4 text-xs text-slate-400">
            SEGUROS
          </p>

          <p className="mt-1 text-xl font-bold text-slate-900">
            {formatarMoeda(
              resumo.seguroFinsol +
                resumo.seguroPrestamista
            )}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            Finsol + Prestamista
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Wallet size={20} />
          </div>

          <p className="mt-4 text-xs text-slate-400">
            PREVISÃO DE REEMBOLSO
          </p>

          <p className="mt-1 text-xl font-bold text-slate-900">
            {formatarMoeda(
              resumo.reembolso
            )}
          </p>
        </div>
      </div>

      {/* Lista */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900">
            Lançamentos
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            {resultadosFiltrados.length} resultado(s)
            encontrado(s)
          </p>
        </div>

        {carregando ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-slate-400">
              Carregando resultados...
            </p>
          </div>
        ) : resultadosFiltrados.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText size={26} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-700">
              Nenhum resultado encontrado
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Cadastre um resultado para esta competência.
            </p>

            <Link
              href="/admin/resultados/novo"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#f97316] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#ea580c]"
            >
              <Plus size={17} />
              Novo resultado
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Colaborador
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Cliente / Grupo
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Data
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Nº clientes
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Produtividade
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Seguro Finsol
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Assistência
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Prestamista
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Situação
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {resultadosFiltrados.map(
                    (resultado) => (
                      <tr
                        key={resultado.id}
                        onClick={() =>
                          abrirResultado(resultado.id)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            abrirResultado(resultado.id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-orange-50/40 focus:bg-orange-50/40 focus:outline-none last:border-0"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {obterNomeColaborador(
                              resultado.colaboradorId
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-xs truncate text-sm text-slate-700">
                            {resultado.nomeCliente ||
                              "-"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-500">
                          {formatarData(
                            resultado.dataDesembolso
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {resultado.quantidadeClientes}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {formatarMoeda(
                            resultado.produtividade
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatarMoeda(
                            resultado.seguroFinsol
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {resultado.seguroAssistencia}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatarMoeda(
                            resultado.seguroPrestamista
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              resultado.situacao ===
                              "Grupo Desembolsado"
                                ? "bg-green-50 text-green-600"
                                : resultado.situacao ===
                                    "Grupo em Atraso"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-red-50 text-red-600"
                            }`}
                          >
                            {resultado.situacao.replace(
                              "Grupo ",
                              ""
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-slate-100 md:hidden">
              {resultadosFiltrados.map(
                (resultado) => (
                  <Link
                  key={resultado.id}
                  href={`/admin/resultados/${resultado.id}`}
                  className="block cursor-pointer p-4 transition-colors active:bg-orange-50/60"
                >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#f97316]">
                          {obterNomeColaborador(
                            resultado.colaboradorId
                          )}
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                          {resultado.nomeCliente ||
                            "Cliente não informado"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          resultado.situacao ===
                          "Grupo Desembolsado"
                            ? "bg-green-50 text-green-600"
                            : resultado.situacao ===
                                "Grupo em Atraso"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-red-50 text-red-600"
                        }`}
                      >
                        {resultado.situacao.replace(
                          "Grupo ",
                          ""
                        )}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] text-slate-400">
                          Data
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-700">
                          {formatarData(
                            resultado.dataDesembolso
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400">
                          Nº clientes
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-700">
                          {resultado.quantidadeClientes}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400">
                          Produtividade
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-800">
                          {formatarMoeda(
                            resultado.produtividade
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400">
                          Seguro Finsol
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-800">
                          {formatarMoeda(
                            resultado.seguroFinsol
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400">
                          Assistência
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-800">
                          {resultado.seguroAssistencia}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400">
                          Prestamista
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-800">
                          {formatarMoeda(
                            resultado.seguroPrestamista
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}