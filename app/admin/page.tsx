"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  UserRound,
  UsersRound,
  BarChart3,
  RefreshCw,
  ShieldCheck,
  HandCoins,
} from "lucide-react";

import {
  Resultado,
  observarResultados,
} from "@/lib/resultados";

import {
  Colaborador,
  observarColaboradores,
} from "@/lib/colaboradores";

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function numero(valor: number) {
  return valor.toLocaleString("pt-BR");
}

function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] || nome;
}

function formatarCompetencia(valor: string) {
  if (!valor) return "";

  const partes = valor.trim().toLowerCase().split(/[\s/-]+/);

  const meses: Record<string, string> = {
    "01": "Janeiro",
    "02": "Fevereiro",
    "03": "Março",
    "04": "Abril",
    "05": "Maio",
    "06": "Junho",
    "07": "Julho",
    "08": "Agosto",
    "09": "Setembro",
    "10": "Outubro",
    "11": "Novembro",
    "12": "Dezembro",
  };

  const nomesMeses: Record<string, string> = {
    janeiro: "Janeiro",
    fevereiro: "Fevereiro",
    março: "Março",
    abril: "Abril",
    maio: "Maio",
    junho: "Junho",
    julho: "Julho",
    agosto: "Agosto",
    setembro: "Setembro",
    outubro: "Outubro",
    novembro: "Novembro",
    dezembro: "Dezembro",
  };

  if (
    partes.length === 2 &&
    /^\d{4}$/.test(partes[0]) &&
    /^\d{2}$/.test(partes[1])
  ) {
    return `${meses[partes[1]]} de ${partes[0]}`;
  }

  if (
    partes.length >= 3 &&
    nomesMeses[partes[0]] &&
    /^\d{4}$/.test(partes[2])
  ) {
    return `${nomesMeses[partes[0]]} de ${partes[2]}`;
  }

  return valor;
}

function normalizarCompetencia(valor: string) {
  return valor.trim().toLowerCase();
}

function extrairMesAno(valor: string) {
  const normalizado = normalizarCompetencia(valor);

  const meses: Record<string, string> = {
    janeiro: "01",
    fevereiro: "02",
    março: "03",
    abril: "04",
    maio: "05",
    junho: "06",
    julho: "07",
    agosto: "08",
    setembro: "09",
    outubro: "10",
    novembro: "11",
    dezembro: "12",
  };

  const partes = normalizado.split(" ");

  if (
    partes.length >= 3 &&
    meses[partes[0]] &&
    /^\d{4}$/.test(partes[2])
  ) {
    return `${partes[2]}-${meses[partes[0]]}`;
  }

  return normalizado;
}

function valorNumerico(valor: unknown) {
  return typeof valor === "number" ? valor : Number(valor) || 0;
}

const frasesMotivacionais = [
  "Grandes resultados começam com pequenas atitudes feitas todos os dias.",
  "Seu trabalho de hoje constrói os resultados de amanhã.",
  "Organização e constância transformam metas em resultados.",
  "Cada decisão bem tomada aproxima a equipe dos seus objetivos.",
  "Foco no que importa, atenção aos detalhes e confiança no processo.",
  "Resultados consistentes são construídos com dedicação diária.",
  "Hoje é uma nova oportunidade para fazer a diferença.",
  "Planeje, acompanhe e avance: o progresso acontece todos os dias.",
];

function saudacaoAtual() {
  const hora = new Date().getHours();

  if (hora >= 5 && hora < 12) return "Bom dia!";
  if (hora >= 12 && hora < 18) return "Boa tarde!";
  return "Boa noite!";
}

function fraseMotivacionalDoDia() {
  const agora = new Date();
  const inicioDoAno = new Date(agora.getFullYear(), 0, 1);
  const diferenca = agora.getTime() - inicioDoAno.getTime();
  const diaDoAno = Math.floor(
    diferenca / (1000 * 60 * 60 * 24)
  );

  return frasesMotivacionais[
    diaDoAno % frasesMotivacionais.length
  ];
}

function competenciaAtual() {
  const agora = new Date();

  return `${agora.getFullYear()}-${String(
    agora.getMonth() + 1
  ).padStart(2, "0")}`;
}

function alterarCompetencia(
  competencia: string,
  quantidade: number
) {
  const [ano, mes] = competencia.split("-").map(Number);

  const data = new Date(
    ano,
    mes - 1 + quantidade,
    1
  );

  return `${data.getFullYear()}-${String(
    data.getMonth() + 1
  ).padStart(2, "0")}`;
}

interface IndicadorColaborador {
  id: string;
  nome: string;
  quantidadeClientes: number;
  produtividade: number;
  previsaoReembolso: number;
  seguroAssistencia: number;
  seguroFinsol: number;
  seguroPrestamista: number;
  resultados: number;
}

export default function AdminPage() {
  const [resultados, setResultados] =
    useState<Resultado[]>([]);

  const [colaboradores, setColaboradores] =
    useState<Colaborador[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [competenciaSelecionada, setCompetenciaSelecionada] =
    useState(competenciaAtual());

  const [ordenacaoOperador, setOrdenacaoOperador] =
    useState<"produtividade" | "alfabetica">(
      "produtividade"
    );

  useEffect(() => {
    let carregouResultados = false;
    let carregouColaboradores = false;

    const verificarCarregamento = () => {
      if (
        carregouResultados &&
        carregouColaboradores
      ) {
        setCarregando(false);
      }
    };

    const unsubscribeResultados =
      observarResultados((dados) => {
        setResultados(dados);
        carregouResultados = true;
        verificarCarregamento();
      });

    const unsubscribeColaboradores =
      observarColaboradores((dados) => {
        setColaboradores(dados);
        carregouColaboradores = true;
        verificarCarregamento();
      });

    return () => {
      unsubscribeResultados();
      unsubscribeColaboradores();
    };
  }, []);

  const resultadosDaCompetencia = useMemo(() => {
    if (!competenciaSelecionada) return [];

    return resultados.filter(
      (resultado) =>
        extrairMesAno(resultado.competencia) ===
        competenciaSelecionada
    );
  }, [
    resultados,
    competenciaSelecionada,
  ]);

  const colaboradoresMap = useMemo(() => {
    const mapa = new Map<string, string>();

    colaboradores.forEach((colaborador) => {
      mapa.set(colaborador.id, colaborador.nome);
    });

    return mapa;
  }, [colaboradores]);

  const indicadoresPorColaborador =
    useMemo<IndicadorColaborador[]>(() => {
      const mapa = new Map<
        string,
        IndicadorColaborador
      >();

      colaboradores.forEach((colaborador) => {
        mapa.set(colaborador.id, {
          id: colaborador.id,
          nome: colaborador.nome,
          quantidadeClientes: 0,
          produtividade: 0,
          previsaoReembolso: 0,
          seguroAssistencia: 0,
          seguroFinsol: 0,
          seguroPrestamista: 0,
          resultados: 0,
        });
      });

      resultadosDaCompetencia.forEach(
        (resultado) => {
          const id = resultado.colaboradorId;

          const atual =
            mapa.get(id) ??
            {
              id,
              nome:
                colaboradoresMap.get(id) ??
                "Colaborador não identificado",
              quantidadeClientes: 0,
              produtividade: 0,
              previsaoReembolso: 0,
              seguroAssistencia: 0,
              seguroFinsol: 0,
              seguroPrestamista: 0,
              resultados: 0,
            };

          atual.quantidadeClientes +=
            valorNumerico(
              resultado.quantidadeClientes
            );

          atual.produtividade +=
            valorNumerico(
              resultado.produtividade
            );

          atual.previsaoReembolso +=
            valorNumerico(
              resultado.previsaoReembolso
            );

          atual.seguroAssistencia +=
            valorNumerico(
              resultado.seguroAssistencia
            );

          atual.seguroFinsol +=
            valorNumerico(
              resultado.seguroFinsol
            );

          atual.seguroPrestamista +=
            valorNumerico(
              resultado.seguroPrestamista
            );

          atual.resultados += 1;

          mapa.set(id, atual);
        }
      );

      return Array.from(mapa.values()).sort(
        (a, b) => {
          if (ordenacaoOperador === "alfabetica") {
            return a.nome.localeCompare(
              b.nome,
              "pt-BR",
              { sensitivity: "base" }
            );
          }

          if (
            b.produtividade !==
            a.produtividade
          ) {
            return (
              b.produtividade -
              a.produtividade
            );
          }

          return a.nome.localeCompare(
            b.nome,
            "pt-BR",
            { sensitivity: "base" }
          );
        }
      );
    }, [
      colaboradores,
      colaboradoresMap,
      resultadosDaCompetencia,
      ordenacaoOperador,
    ]);

  const totalAgencia = useMemo(() => {
    return indicadoresPorColaborador.reduce(
      (total, item) => ({
        quantidadeClientes:
          total.quantidadeClientes +
          item.quantidadeClientes,
        produtividade:
          total.produtividade +
          item.produtividade,
        previsaoReembolso:
          total.previsaoReembolso +
          item.previsaoReembolso,
        seguroAssistencia:
          total.seguroAssistencia +
          item.seguroAssistencia,
        seguroFinsol:
          total.seguroFinsol +
          item.seguroFinsol,
        seguroPrestamista:
          total.seguroPrestamista +
          item.seguroPrestamista,
      }),
      {
        quantidadeClientes: 0,
        produtividade: 0,
        previsaoReembolso: 0,
        seguroAssistencia: 0,
        seguroFinsol: 0,
        seguroPrestamista: 0,
      }
    );
  }, [indicadoresPorColaborador]);

  const maiorProdutividade = useMemo(
    () =>
      Math.max(
        ...indicadoresPorColaborador.map(
          (item) => item.produtividade
        ),
        1
      ),
    [indicadoresPorColaborador]
  );

  const topColaboradores = useMemo(
    () =>
      indicadoresPorColaborador
        .filter(
          (item) => item.produtividade > 0
        )
        .slice(0, 8),
    [indicadoresPorColaborador]
  );

  const coresOperador = [
    "bg-[#1769e0]",
    "bg-[#f57c00]",
    "bg-[#16a6b6]",
    "bg-[#f57c00]",
    "bg-[#1769e0]",
    "bg-[#f57c00]",
  ];

  const competenciaLabel =
    competenciaSelecionada
      ? formatarCompetencia(
          competenciaSelecionada
        )
      : "";

  const dataAtual = new Date();
  const saudacao = saudacaoAtual();
  const fraseMotivacional =
    fraseMotivacionalDoDia();

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 dark:border-orange-800/60 dark:bg-orange-950/40 sm:px-5">
            <p className="text-sm font-semibold text-[#f97316]">
              {saudacao}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300 sm:text-sm">
              “{fraseMotivacional}”
            </p>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f97316]">
            Visão da agência
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            AGÊNCIA IMPERATRIZ
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Acompanhe os resultados de todos os
            colaboradores em uma única visão.
          </p>
        </div>

        <div className="mx-auto flex w-fit max-w-full items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
          <button
            type="button"
            onClick={() =>
              setCompetenciaSelecionada(
                alterarCompetencia(
                  competenciaSelecionada,
                  -1
                )
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-[#f97316]"
            title="Mês anterior"
          >
            <ChevronLeft size={17} />
          </button>

          <div className="w-auto min-w-[140px] text-center">
            <p className="text-[8px] font-medium uppercase tracking-wide text-slate-400">
              Competência
            </p>

            <p className="mt-0.5 whitespace-nowrap text-sm font-semibold capitalize text-slate-800">
              {competenciaLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setCompetenciaSelecionada(
                alterarCompetencia(
                  competenciaSelecionada,
                  1
                )
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-[#f97316]"
            title="Próximo mês"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {carregando ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#f97316]" />
            <p className="mt-3 text-sm text-slate-500">
              Carregando resultados...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Resultados da agência */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Resultados por colaborador
                </h2>
                <p className="mt-1 text-[11px] leading-4 text-slate-400 sm:text-xs">
                  Visão consolidada dos resultados registrados na competência.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                <CalendarDays size={14} />
                {competenciaLabel}
              </div>
            </div>

            {indicadoresPorColaborador.length === 0 ? (
              <div className="flex min-h-48 items-center justify-center px-5">
                <div className="text-center">
                  <CircleDollarSign
                    size={30}
                    className="mx-auto text-slate-300"
                  />
                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    Nenhum colaborador cadastrado
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden lg:block">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-b border-[#26315f] bg-[#171d4d] text-white">
                        <th className="w-[23%] px-2 py-3.5 text-center text-[9px] font-bold uppercase leading-3 tracking-wide">
                          <button
                            type="button"
                            onClick={() =>
                              setOrdenacaoOperador((atual) =>
                                atual === "produtividade"
                                  ? "alfabetica"
                                  : "produtividade"
                              )
                            }
                            title={
                              ordenacaoOperador === "produtividade"
                                ? "Ordenar alfabeticamente"
                                : "Ordenar por produtividade"
                            }
                            aria-label={
                              ordenacaoOperador === "produtividade"
                                ? "Ordenar operadores alfabeticamente"
                                : "Ordenar operadores por produtividade"
                            }
                            className="mx-auto flex flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <UserRound size={22} strokeWidth={2.2} />
                              <ArrowDownAZ
                                size={15}
                                strokeWidth={2.2}
                                className={
                                  ordenacaoOperador === "alfabetica"
                                    ? "rotate-180 transition-transform"
                                    : "transition-transform"
                                }
                              />
                            </span>
                            <span>Operador</span>
                          </button>
                        </th>
                        <th className="w-[7%] px-1 py-3.5 text-center text-[9px] font-bold uppercase leading-3 tracking-wide">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <UsersRound size={22} strokeWidth={2.2} />
                            <span>Clientes</span>
                          </div>
                        </th>
                        <th className="w-[15%] px-2 py-3.5 text-center text-[9px] font-bold uppercase leading-3 tracking-wide">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <BarChart3 size={22} strokeWidth={2.2} />
                            <span>Produtividade</span>
                          </div>
                        </th>
                        <th className="w-[18%] px-2 py-3.5 text-center text-[9px] font-bold uppercase leading-3 tracking-wide">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <RefreshCw size={22} strokeWidth={2.2} />
                            <span>Previsão de<br />reembolso</span>
                          </div>
                        </th>
                        <th className="w-[10%] px-1 py-3.5 text-center text-[9px] font-bold uppercase leading-3 tracking-wide">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <ShieldCheck size={22} strokeWidth={2.2} />
                            <span>Seguro<br />assistência</span>
                          </div>
                        </th>
                        <th className="w-[13%] px-2 py-3.5 text-center text-[9px] font-bold uppercase leading-3 tracking-wide">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <ShieldCheck size={22} strokeWidth={2.2} />
                            <span>Seguro Finsol</span>
                          </div>
                        </th>
                        <th className="w-[13%] pl-2 pr-4 py-3.5 text-center text-[9px] font-bold uppercase leading-3 tracking-wide">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <HandCoins size={22} strokeWidth={2.2} />
                            <span>Seguro<br />Prestamista</span>
                          </div>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {indicadoresPorColaborador.map(
                        (item, index) => (
                          <tr
                            key={item.id}
                            className="border-b border-slate-200 bg-white last:border-b-0"
                          >
                            <td className="p-0">
                              <div
                                className={`flex min-h-[58px] items-center justify-center px-3 py-2.5 text-center text-white ${
                                  coresOperador[
                                    index %
                                      coresOperador.length
                                  ]
                                }`}
                              >
                                <p className="truncate text-center text-[12px] font-bold">
                                  {primeiroNome(item.nome)}
                                </p>
                              </div>
                            </td>

                            <td className="pl-2 pr-4 py-3 text-center text-[12px] font-bold text-slate-900 whitespace-nowrap">
                              {numero(
                                item.quantidadeClientes
                              )}
                            </td>

                            <td className="px-2 py-3 text-center text-[12px] font-bold text-[#1644a5] whitespace-nowrap">
                              {moeda(
                                item.produtividade
                              )}
                            </td>

                            <td className="px-2 py-3 text-center text-[12px] font-semibold text-slate-900 whitespace-nowrap">
                              {moeda(
                                item.previsaoReembolso
                              )}
                            </td>

                            <td className="px-2 py-3 text-center text-[12px] font-bold text-slate-900 whitespace-nowrap">
                              {numero(
                                item.seguroAssistencia
                              )}
                            </td>

                            <td className="px-2 py-3 text-center text-[12px] font-bold text-[#1644a5] whitespace-nowrap">
                              {moeda(
                                item.seguroFinsol
                              )}
                            </td>

                            <td className="px-2 py-3 text-center text-[12px] font-bold text-slate-900 whitespace-nowrap">
                              {moeda(
                                item.seguroPrestamista
                              )}
                            </td>
                          </tr>
                        )
                      )}

                      <tr className="bg-[#121a45] text-white">
                        <td className="px-3 py-4 text-center text-[12px] font-extrabold uppercase leading-4">
                          TOTAL DA<br />AGÊNCIA
                        </td>

                        <td className="px-2 py-4 text-center text-[14px] font-extrabold text-amber-300 whitespace-nowrap">
                          {numero(
                            totalAgencia.quantidadeClientes
                          )}
                        </td>

                        <td className="pl-2 pr-4 py-4 text-center text-[12px] font-extrabold text-emerald-400 whitespace-nowrap">
                          {moeda(
                            totalAgencia.produtividade
                          )}
                        </td>

                        <td className="px-2 py-4 text-center text-[12px] font-extrabold whitespace-nowrap">
                          {moeda(
                            totalAgencia.previsaoReembolso
                          )}
                        </td>

                        <td className="px-2 py-4 text-center text-[14px] font-extrabold whitespace-nowrap">
                          {numero(
                            totalAgencia.seguroAssistencia
                          )}
                        </td>

                        <td className="px-2 py-4 text-center text-[12px] font-extrabold text-emerald-400 whitespace-nowrap">
                          {moeda(
                            totalAgencia.seguroFinsol
                          )}
                        </td>

                        <td className="px-2 py-4 text-center text-[12px] font-extrabold text-emerald-400 whitespace-nowrap">
                          {moeda(
                            totalAgencia.seguroPrestamista
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="space-y-3 p-4 lg:hidden">
                  {indicadoresPorColaborador.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                              <UserRound size={16} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {primeiroNome(item.nome)}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                {item.resultados} resultado(s)
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-wide text-slate-400">
                              Clientes
                            </p>
                            <p className="text-sm font-bold text-slate-900">
                              {numero(
                                item.quantidadeClientes
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-orange-50 px-3 py-2.5">
                            <p className="text-[9px] uppercase tracking-wide text-orange-600">
                              Produtividade
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-900">
                              {moeda(
                                item.produtividade
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                            <p className="text-[9px] uppercase tracking-wide text-slate-500">
                              Reembolso
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-900">
                              {moeda(
                                item.previsaoReembolso
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-blue-50 px-3 py-2.5">
                            <p className="text-[9px] uppercase tracking-wide text-blue-600">
                              Seguro Finsol
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-900">
                              {moeda(
                                item.seguroFinsol
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-violet-50 px-3 py-2.5">
                            <p className="text-[9px] uppercase tracking-wide text-violet-600">
                              Prestamista
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-900">
                              {moeda(
                                item.seguroPrestamista
                              )}
                            </p>
                          </div>

                          <div className="col-span-2 rounded-xl bg-emerald-50 px-3 py-2.5">
                            <div className="flex items-center justify-between">
                              <p className="text-[9px] uppercase tracking-wide text-emerald-600">
                                Seguro Assistência
                              </p>
                              <p className="text-sm font-bold text-slate-900">
                                {numero(
                                  item.seguroAssistencia
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  <div className="rounded-2xl bg-red-600 p-4 text-white">
                    <p className="text-xs font-bold uppercase tracking-wide">
                      Agência
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[9px] text-white/70">
                          Clientes
                        </p>
                        <p className="mt-0.5 text-sm font-bold">
                          {numero(
                            totalAgencia.quantidadeClientes
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] text-white/70">
                          Produtividade
                        </p>
                        <p className="mt-0.5 text-sm font-bold">
                          {moeda(
                            totalAgencia.produtividade
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] text-white/70">
                          Reembolso
                        </p>
                        <p className="mt-0.5 text-sm font-bold">
                          {moeda(
                            totalAgencia.previsaoReembolso
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] text-white/70">
                          Assistência
                        </p>
                        <p className="mt-0.5 text-sm font-bold">
                          {numero(
                            totalAgencia.seguroAssistencia
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] text-white/70">
                          Finsol
                        </p>
                        <p className="mt-0.5 text-sm font-bold">
                          {moeda(
                            totalAgencia.seguroFinsol
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] text-white/70">
                          Prestamista
                        </p>
                        <p className="mt-0.5 text-sm font-bold">
                          {moeda(
                            totalAgencia.seguroPrestamista
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Análises da competência */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Análise de desempenho
                </h2>
                <p className="mt-1 text-[11px] leading-4 text-slate-400 sm:text-xs">
                  Distribuição percentual da produtividade e principais destaques da competência.
                </p>
              </div>
            </div>

            <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[1.25fr_0.75fr]">
              {/* Participação percentual */}
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Participação na produtividade
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Percentual de cada colaborador sobre o total da agência.
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-xs font-bold text-slate-900">
                    {moeda(totalAgencia.produtividade)}
                  </p>
                </div>

                {topColaboradores.length === 0 ||
                totalAgencia.produtividade <= 0 ? (
                  <div className="mt-5 flex min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
                    <p className="text-sm text-slate-400">
                      Nenhuma produtividade registrada nesta competência.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mt-5 h-5 overflow-hidden rounded-full bg-slate-100">
                      <div className="flex h-full w-full">
                        {topColaboradores.map((item, index) => {
                          const percentual =
                            totalAgencia.produtividade > 0
                              ? (item.produtividade /
                                  totalAgencia.produtividade) *
                                100
                              : 0;

                          return (
                            <div
                              key={item.id}
                              className={`h-full transition-all ${
                                index % 4 === 0
                                  ? "bg-[#f97316]"
                                  : index % 4 === 1
                                  ? "bg-blue-500"
                                  : index % 4 === 2
                                  ? "bg-emerald-500"
                                  : "bg-violet-500"
                              }`}
                              style={{
                                width: `${percentual}%`,
                              }}
                              title={`${item.nome}: ${percentual.toFixed(1)}%`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {topColaboradores.map((item, index) => {
                        const percentual =
                          totalAgencia.produtividade > 0
                            ? (item.produtividade /
                                totalAgencia.produtividade) *
                              100
                            : 0;

                        return (
                          <div key={item.id}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                    index % 4 === 0
                                      ? "bg-[#f97316]"
                                      : index % 4 === 1
                                      ? "bg-blue-500"
                                      : index % 4 === 2
                                      ? "bg-emerald-500"
                                      : "bg-violet-500"
                                  }`}
                                />
                                <p className="truncate text-xs font-semibold text-slate-700">
                                  {item.nome}
                                </p>
                              </div>

                              <div className="flex shrink-0 items-center gap-3">
                                <span className="text-[10px] text-slate-400">
                                  {moeda(item.produtividade)}
                                </span>
                                <span className="min-w-[48px] text-right text-xs font-bold text-slate-900">
                                  {percentual.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${
                                  index % 4 === 0
                                    ? "bg-[#f97316]"
                                    : index % 4 === 1
                                    ? "bg-blue-500"
                                    : index % 4 === 2
                                    ? "bg-emerald-500"
                                    : "bg-violet-500"
                                }`}
                                style={{
                                  width: `${percentual}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Destaques */}
              <div className="border-t border-slate-100 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <p className="text-xs font-semibold text-slate-800">
                  Destaques da competência
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Indicadores para leitura rápida da agência.
                </p>

                {(() => {
                  const principal =
                    indicadoresPorColaborador.find(
                      (item) => item.produtividade > 0
                    );

                  const competenciaAnterior =
                    alterarCompetencia(
                      competenciaSelecionada,
                      -1
                    );

                  const totalAnterior =
                    resultados
                      .filter(
                        (resultado) =>
                          extrairMesAno(
                            resultado.competencia
                          ) === competenciaAnterior
                      )
                      .reduce(
                        (total, resultado) =>
                          total +
                          valorNumerico(
                            resultado.produtividade
                          ),
                        0
                      );

                  const crescimento =
                    totalAnterior > 0
                      ? ((totalAgencia.produtividade -
                          totalAnterior) /
                          totalAnterior) *
                        100
                      : totalAgencia.produtividade > 0
                      ? null
                      : 0;

                  const colaboradoresAtivos =
                    indicadoresPorColaborador.filter(
                      (item) => item.resultados > 0
                    ).length;

                  const concentracao =
                    principal &&
                    totalAgencia.produtividade > 0
                      ? (principal.produtividade /
                          totalAgencia.produtividade) *
                        100
                      : 0;

                  return (
                    <div className="mt-5 space-y-3">
                      <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-600">
                          Colaborador em destaque
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-bold text-slate-900">
                              {principal?.nome ?? "—"}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-500">
                              Maior produtividade da competência
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-base font-bold text-[#f97316]">
                              {principal
                                ? moeda(principal.produtividade)
                                : "R$ 0,00"}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-500">
                              {concentracao.toFixed(1)}% da agência
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                Índice de crescimento
                              </p>
                              <p className="mt-1 text-[10px] text-slate-400">
                                Comparação com {formatarCompetencia(competenciaAnterior)}
                              </p>
                            </div>

                            <p
                              className={`text-xl font-bold ${
                                crescimento === null ||
                                crescimento >= 0
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {crescimento === null
                                ? "Novo"
                                : `${crescimento >= 0 ? "+" : ""}${crescimento.toFixed(1)}%`}
                            </p>
                          </div>

                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full ${
                                crescimento === null ||
                                crescimento >= 0
                                  ? "bg-emerald-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width:
                                  crescimento === null
                                    ? "100%"
                                    : `${Math.min(
                                        Math.abs(crescimento),
                                        100
                                      )}%`,
                              }}
                            />
                          </div>

                          <div className="mt-2 flex justify-between text-[9px] text-slate-400">
                            <span>
                              Anterior: {moeda(totalAnterior)}
                            </span>
                            <span>
                              Atual: {moeda(totalAgencia.produtividade)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Colaboradores ativos
                            </p>
                            <p className="mt-2 text-xl font-bold text-slate-900">
                              {colaboradoresAtivos}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              com resultado no mês
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Concentração
                            </p>
                            <p className="mt-2 text-xl font-bold text-slate-900">
                              {concentracao.toFixed(1)}%
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              no principal colaborador
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>

          {/* Leitura da competência */}
          <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Leitura da competência
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {competenciaLabel}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-500">
                  {indicadoresPorColaborador.length} colaborador(es)
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-semibold text-blue-700">
                  {resultadosDaCompetencia.length} resultado(s)
                </span>

                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-semibold text-orange-700">
                  {moeda(totalAgencia.produtividade)} em produtividade
                </span>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
