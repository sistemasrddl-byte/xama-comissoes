"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Users,
  Wallet,
} from "lucide-react";

import {
  Colaborador,
  observarColaboradores,
} from "@/lib/colaboradores";

import {
  observarResultados,
  Resultado,
} from "@/lib/resultados";

import {
  buscarRegrasComissao,
  RegrasComissao,
  regrasComissaoPadrao,
} from "@/lib/configuracoes-comissoes";

import {
  atualizarFechamento,
  criarFechamento,
  observarFechamentos,
  Fechamento,
} from "@/lib/fechamentos";

import FecharComissaoDialog from "@/components/ui/fechar-comissao-dialog";

import RegistrarPagamentoDialog from "@/components/ui/registrar-pagamento-dialog";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data?: string) {
  if (!data) {
    return "—";
  }

  return new Date(
    `${data}T12:00:00`
  ).toLocaleDateString("pt-BR");
}

function calcularComissao(
  resultado: Resultado,
  regras: RegrasComissao
) {
  const comissaoLiberacao =
    (resultado.producaoFinsol || 0) *
    (regras.liberacaoPercentual / 100);

  const bonificacaoLiberacao =
    comissaoLiberacao *
    (regras.bonificacaoLiberacaoPercentual /
      100);

  const comissaoReembolso =
    (resultado.previsaoReembolso || 0) *
    (regras.reembolsoPercentual / 100);

  const comissaoSeguro =
    (resultado.seguroFinsol || 0) *
    (regras.seguroPercentual / 100);

  const comissaoAssistencia =
    (resultado.quantidadeClientes || 0) *
    regras.assistenciaValorPorCliente;

  const totalComissao =
    comissaoLiberacao +
    comissaoReembolso +
    comissaoSeguro +
    comissaoAssistencia;

  const totalPagar =
    totalComissao +
    bonificacaoLiberacao;

  return {
    comissaoLiberacao,
    bonificacaoLiberacao,
    comissaoReembolso,
    comissaoSeguro,
    comissaoAssistencia,
    totalComissao,
    totalPagar,
  };
}

type LinhaFechamento = {
  id: string;
  colaborador: Colaborador;
  resultados: Resultado[];

  producao: number;
  totalComissao: number;
  totalBonificacao: number;
  totalPagar: number;

  fechamento?: Fechamento;

  tipo: "pendente" | "fechamento";
};

export default function FechamentosPage() {
  const [resultados, setResultados] =
    useState<Resultado[]>([]);

  const [colaboradores, setColaboradores] =
    useState<Colaborador[]>([]);

  const [fechamentos, setFechamentos] =
    useState<Fechamento[]>([]);

  const [regras, setRegras] =
    useState<RegrasComissao>(
      regrasComissaoPadrao
    );

  const [competencia, setCompetencia] =
    useState("2026-08");

  const [carregando, setCarregando] =
    useState(true);

  const [carregandoRegras, setCarregandoRegras] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [
    dialogFechamentoAberto,
    setDialogFechamentoAberto,
  ] = useState(false);

  const [
    dialogPagamentoAberto,
    setDialogPagamentoAberto,
  ] = useState(false);

  const [
    linhaSelecionada,
    setLinhaSelecionada,
  ] = useState<LinhaFechamento | null>(
    null
  );

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

    const unsubscribeFechamentos =
      observarFechamentos((dados) => {
        setFechamentos(dados);
      });

    async function carregarRegras() {
      try {
        const dados =
          await buscarRegrasComissao();

        setRegras(dados);
      } catch (error) {
        console.error(
          "Erro ao carregar regras de comissão:",
          error
        );

        setRegras(
          regrasComissaoPadrao
        );
      } finally {
        setCarregandoRegras(false);
      }
    }

    carregarRegras();

    return () => {
      unsubscribeResultados();
      unsubscribeColaboradores();
      unsubscribeFechamentos();
    };
  }, []);

  const resultadosDaCompetencia =
    useMemo(() => {
      return resultados.filter(
        (resultado) =>
          resultado.competencia ===
          competencia
      );
    }, [resultados, competencia]);

  const fechamentosDaCompetencia =
    useMemo(() => {
      return fechamentos.filter(
        (fechamento) =>
          fechamento.competencia ===
          competencia
      );
    }, [fechamentos, competencia]);

  /**
   * Todos os resultados que já pertencem
   * a algum fechamento.
   */
  const resultadoIdsFechados =
    useMemo(() => {
      const ids = new Set<string>();

      fechamentosDaCompetencia.forEach(
        (fechamento) => {
          if (
            Array.isArray(
              fechamento.resultadoIds
            )
          ) {
            fechamento.resultadoIds.forEach(
              (resultadoId) => {
                ids.add(resultadoId);
              }
            );
          }
        }
      );

      return ids;
    }, [fechamentosDaCompetencia]);

  /**
   * Monta as linhas da tela.
   *
   * Cada fechamento existente vira uma linha
   * independente.
   *
   * Os resultados que ainda não pertencem a
   * nenhum fechamento formam uma nova linha
   * pendente para o colaborador.
   */
  const linhas = useMemo(() => {
    const resultado: LinhaFechamento[] =
      [];

    const colaboradoresComMovimento =
      new Set<string>();

    resultadosDaCompetencia.forEach(
      (item) => {
        colaboradoresComMovimento.add(
          item.colaboradorId
        );
      }
    );

    fechamentosDaCompetencia.forEach(
      (item) => {
        colaboradoresComMovimento.add(
          item.colaboradorId
        );
      }
    );

    colaboradoresComMovimento.forEach(
      (colaboradorId) => {
        const colaborador =
          colaboradores.find(
            (item) =>
              item.id === colaboradorId
          );

        if (!colaborador) {
          return;
        }

        /**
         * 1. Fechamentos já realizados
         */
        const fechamentosColaborador =
          fechamentosDaCompetencia
            .filter(
              (fechamento) =>
                fechamento.colaboradorId ===
                colaboradorId
            )
            .sort((a, b) => {
              const dataA =
                a.dataFechamento ||
                "";

              const dataB =
                b.dataFechamento ||
                "";

              return dataA.localeCompare(
                dataB
              );
            });

        fechamentosColaborador.forEach(
          (fechamento) => {
            const ids =
              Array.isArray(
                fechamento.resultadoIds
              )
                ? fechamento.resultadoIds
                : [];

            const resultadosDoFechamento =
              resultadosDaCompetencia.filter(
                (item) =>
                  item.colaboradorId ===
                    colaboradorId &&
                  ids.includes(item.id)
              );

            resultado.push({
              id: `fechamento-${fechamento.id}`,

              colaborador,

              resultados:
                resultadosDoFechamento,

              producao:
                fechamento.producaoFinsol,

              totalComissao:
                fechamento.totalComissao,

              totalBonificacao:
                fechamento.totalBonificacao,

              totalPagar:
                fechamento.totalPagar,

              fechamento,

              tipo: "fechamento",
            });
          }
        );

        /**
         * 2. Resultados novos, ainda não fechados
         */
        const resultadosPendentes =
          resultadosDaCompetencia.filter(
            (item) =>
              item.colaboradorId ===
                colaboradorId &&
              !resultadoIdsFechados.has(
                item.id
              )
          );

        if (
          resultadosPendentes.length ===
          0
        ) {
          return;
        }

        const calculos =
          resultadosPendentes.map(
            (item) =>
              calcularComissao(
                item,
                regras
              )
          );

        const producao =
          resultadosPendentes.reduce(
            (total, item) =>
              total +
              (item.producaoFinsol || 0),
            0
          );

        const totalComissao =
          calculos.reduce(
            (total, item) =>
              total +
              item.totalComissao,
            0
          );

        const totalBonificacao =
          calculos.reduce(
            (total, item) =>
              total +
              item.bonificacaoLiberacao,
            0
          );

        const totalPagar =
          calculos.reduce(
            (total, item) =>
              total +
              item.totalPagar,
            0
          );

        resultado.push({
          id: `pendente-${colaboradorId}-${competencia}`,

          colaborador,

          resultados:
            resultadosPendentes,

          producao,

          totalComissao,

          totalBonificacao,

          totalPagar,

          tipo: "pendente",
        });
      }
    );

    return resultado;
  }, [
    resultadosDaCompetencia,
    fechamentosDaCompetencia,
    resultadoIdsFechados,
    colaboradores,
    regras,
  ]);

  const resumo = useMemo(() => {
    let pendentes = 0;
    let fechados = 0;

    let totalPendente = 0;
    let totalPago = 0;

    linhas.forEach((linha) => {
      if (linha.tipo === "pendente") {
        pendentes += 1;

        totalPendente +=
          linha.totalPagar;

        return;
      }

      if (
        linha.fechamento?.situacao ===
        "Pago"
      ) {
        fechados += 1;

        totalPago +=
          linha.totalPagar;

        return;
      }

      if (
        linha.fechamento?.situacao ===
        "Fechado"
      ) {
        fechados += 1;

        totalPendente +=
          linha.totalPagar;
      }
    });

    return {
      pendentes,
      fechados,
      totalPendente,
      totalPago,
    };
  }, [linhas]);

  function abrirDialogFechamento(
    linha: LinhaFechamento
  ) {
    if (linha.tipo !== "pendente") {
      return;
    }

    setLinhaSelecionada(linha);

    setDialogFechamentoAberto(true);
  }

  function fecharDialogFechamento() {
    if (salvando) {
      return;
    }

    setDialogFechamentoAberto(false);
    setLinhaSelecionada(null);
  }

  function abrirDialogPagamento(
    linha: LinhaFechamento
  ) {
    if (
      linha.tipo !== "fechamento" ||
      !linha.fechamento
    ) {
      return;
    }

    if (
      linha.fechamento.situacao !==
      "Fechado"
    ) {
      return;
    }

    setLinhaSelecionada(linha);

    setDialogPagamentoAberto(true);
  }

  function fecharDialogPagamento() {
    if (salvando) {
      return;
    }

    setDialogPagamentoAberto(false);
    setLinhaSelecionada(null);
  }

  async function confirmarFechamento() {
    if (
      !linhaSelecionada ||
      linhaSelecionada.tipo !==
        "pendente"
    ) {
      return;
    }

    if (
      linhaSelecionada.resultados.length ===
      0
    ) {
      return;
    }

    setSalvando(true);

    try {
      const agora = new Date();

      const dataHoje =
        `${agora.getFullYear()}-${String(
          agora.getMonth() + 1
        ).padStart(2, "0")}-${String(
          agora.getDate()
        ).padStart(2, "0")}`;

      const resultadoIds =
        linhaSelecionada.resultados.map(
          (resultado) => resultado.id
        );

      await criarFechamento({
        colaboradorId:
          linhaSelecionada.colaborador
            .id,

        competencia,

        /**
         * Estes são exatamente os resultados
         * que pertencem a este fechamento.
         */
        resultadoIds,

        producaoFinsol:
          linhaSelecionada.producao,

        comissaoLiberacao:
          linhaSelecionada.resultados.reduce(
            (total, resultado) =>
              total +
              calcularComissao(
                resultado,
                regras
              ).comissaoLiberacao,
            0
          ),

        comissaoReembolso:
          linhaSelecionada.resultados.reduce(
            (total, resultado) =>
              total +
              calcularComissao(
                resultado,
                regras
              ).comissaoReembolso,
            0
          ),

        comissaoSeguro:
          linhaSelecionada.resultados.reduce(
            (total, resultado) =>
              total +
              calcularComissao(
                resultado,
                regras
              ).comissaoSeguro,
            0
          ),

        comissaoAssistencia:
          linhaSelecionada.resultados.reduce(
            (total, resultado) =>
              total +
              calcularComissao(
                resultado,
                regras
              ).comissaoAssistencia,
            0
          ),

        totalComissao:
          linhaSelecionada.totalComissao,

        bonificacaoLiberacao:
          linhaSelecionada.totalBonificacao,

        totalBonificacao:
          linhaSelecionada.totalBonificacao,

        totalPagar:
          linhaSelecionada.totalPagar,

        situacao: "Fechado",

        dataFechamento: dataHoje,
      });

      setDialogFechamentoAberto(
        false
      );

      setLinhaSelecionada(null);
    } catch (error) {
      console.error(
        "Erro ao fechar comissão:",
        error
      );

      alert(
        "Não foi possível realizar o fechamento. Tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarPagamento(
    dataPagamento: string
  ) {
    if (
      !linhaSelecionada ||
      linhaSelecionada.tipo !==
        "fechamento" ||
      !linhaSelecionada.fechamento
    ) {
      return;
    }

    setSalvando(true);

    try {
      await atualizarFechamento(
        linhaSelecionada.fechamento.id,
        {
          situacao: "Pago",
          dataPagamento,
        }
      );

      setDialogPagamentoAberto(
        false
      );

      setLinhaSelecionada(null);
    } catch (error) {
      console.error(
        "Erro ao registrar pagamento:",
        error
      );

      alert(
        "Não foi possível registrar o pagamento. Tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  const linhaDoFechamento =
    linhaSelecionada?.tipo ===
    "fechamento"
      ? linhaSelecionada
      : null;

  const linhaPendente =
    linhaSelecionada?.tipo ===
    "pendente"
      ? linhaSelecionada
      : null;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <p className="text-sm font-semibold text-[#f97316]">
          Financeiro
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Fechamentos
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Controle os fechamentos e pagamentos das comissões dos colaboradores.
        </p>
      </div>

      {/* Filtro */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="max-w-sm">
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
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
            />
          </div>
        </div>
      </section>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          icon={<Clock3 size={20} />}
          label="Pendentes"
          valor={String(
            resumo.pendentes
          )}
          estilo="orange"
        />

        <ResumoCard
          icon={<CheckCircle2 size={20} />}
          label="Fechados"
          valor={String(
            resumo.fechados
          )}
          estilo="green"
        />

        <ResumoCard
          icon={<Wallet size={20} />}
          label="Total pendente"
          valor={formatarMoeda(
            resumo.totalPendente
          )}
          estilo="blue"
        />

        <ResumoCard
          icon={<CircleDollarSign size={20} />}
          label="Total pago"
          valor={formatarMoeda(
            resumo.totalPago
          )}
          estilo="purple"
        />
      </div>

      {/* Lista */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Fechamentos da competência
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Cada linha representa um fechamento independente.
              </p>
            </div>

            {resumo.pendentes >
            0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-600">
                <Clock3 size={13} />

                {resumo.pendentes}{" "}
                pendente
                {resumo.pendentes !==
                1
                  ? "s"
                  : ""}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-[11px] font-semibold text-green-700">
                <CheckCircle2 size={13} />

                Tudo fechado
              </span>
            )}
          </div>
        </div>

        {carregando ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-slate-400">
              Carregando informações...
            </p>
          </div>
        ) : linhas.length ===
          0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users size={26} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-700">
              Nenhum fechamento encontrado
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Não existem resultados para a competência selecionada.
            </p>
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
                      Total a pagar
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Data do fechamento
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Data do pagamento
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Situação
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">
                      Ação
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {linhas.map(
                    (linha) => {
                      const situacao =
                        linha.fechamento
                          ?.situacao;

                      const pago =
                        situacao ===
                        "Pago";

                      const fechado =
                        linha.tipo ===
                          "fechamento" &&
                        (situacao ===
                          "Fechado" ||
                          situacao ===
                            "Pago");

                      return (
                        <tr
                          key={linha.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-800">
                              {
                                linha
                                  .colaborador
                                  .nome
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {
                                linha
                                  .resultados
                                  .length
                              }{" "}
                              lançamento
                              {linha
                                .resultados
                                .length !==
                              1
                                ? "s"
                                : ""}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-slate-900">
                            {formatarMoeda(
                              linha.totalPagar
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatarData(
                              linha
                                .fechamento
                                ?.dataFechamento
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatarData(
                              linha
                                .fechamento
                                ?.dataPagamento
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {linha.tipo ===
                            "pendente" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
                                <Clock3
                                  size={
                                    13
                                  }
                                />
                                Pendente
                              </span>
                            ) : pago ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                                <CheckCircle2
                                  size={
                                    13
                                  }
                                />
                                Pago
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                <CheckCircle2
                                  size={
                                    13
                                  }
                                />
                                Fechado
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            {linha.tipo ===
                            "pendente" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  abrirDialogFechamento(
                                    linha
                                  )
                                }
                                className="rounded-xl bg-[#f97316] px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition hover:bg-[#ea580c]"
                              >
                                Fechar
                              </button>
                            ) : fechado &&
                              !pago ? (
                              <button
                                type="button"
                                onClick={() =>
                                  abrirDialogPagamento(
                                    linha
                                  )
                                }
                                className="rounded-xl bg-green-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-green-500/20 transition hover:bg-green-700"
                              >
                                Registrar pagamento
                              </button>
                            ) : (
                              <span className="text-xs font-medium text-green-600">
                                Pagamento registrado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-slate-100 md:hidden">
              {linhas.map(
                (linha) => {
                  const situacao =
                    linha.fechamento
                      ?.situacao;

                  const pago =
                    situacao ===
                    "Pago";

                  const fechado =
                    linha.tipo ===
                      "fechamento" &&
                    (situacao ===
                      "Fechado" ||
                      situacao ===
                        "Pago");

                  return (
                    <div
                      key={linha.id}
                      className="p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {
                              linha
                                .colaborador
                                .nome
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {
                              linha
                                .resultados
                                .length
                            }{" "}
                            lançamento
                            {linha
                              .resultados
                              .length !==
                            1
                              ? "s"
                              : ""}
                          </p>
                        </div>

                        {linha.tipo ===
                        "pendente" ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-600">
                            Pendente
                          </span>
                        ) : pago ? (
                          <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-700">
                            Pago
                          </span>
                        ) : (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                            Fechado
                          </span>
                        )}
                      </div>

                      <div className="mt-4 rounded-xl bg-slate-50 p-4">
                        <p className="text-[11px] text-slate-400">
                          Total a pagar
                        </p>

                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {formatarMoeda(
                            linha.totalPagar
                          )}
                        </p>

                        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                          <span className="text-[11px] text-slate-400">
                            Data do fechamento
                          </span>

                          <span className="text-xs font-semibold text-slate-600">
                            {formatarData(
                              linha
                                .fechamento
                                ?.dataFechamento
                            )}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            Data do pagamento
                          </span>

                          <span
                            className={`text-xs font-semibold ${
                              linha
                                .fechamento
                                ?.dataPagamento
                                ? "text-green-600"
                                : "text-slate-500"
                            }`}
                          >
                            {formatarData(
                              linha
                                .fechamento
                                ?.dataPagamento
                            )}
                          </span>
                        </div>
                      </div>

                      {linha.tipo ===
                      "pendente" ? (
                        <button
                          type="button"
                          onClick={() =>
                            abrirDialogFechamento(
                              linha
                            )
                          }
                          className="mt-3 h-10 w-full rounded-xl bg-[#f97316] text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition hover:bg-[#ea580c]"
                        >
                          Fechar comissão
                        </button>
                      ) : fechado &&
                        !pago ? (
                        <button
                          type="button"
                          onClick={() =>
                            abrirDialogPagamento(
                              linha
                            )
                          }
                          className="mt-3 h-10 w-full rounded-xl bg-green-600 text-xs font-semibold text-white shadow-sm shadow-green-500/20 transition hover:bg-green-700"
                        >
                          Registrar pagamento
                        </button>
                      ) : (
                        <div className="mt-3 flex h-10 items-center justify-center rounded-xl bg-green-50 text-xs font-semibold text-green-700">
                          Pagamento registrado
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}

        {carregandoRegras && (
          <div className="border-t border-slate-100 px-5 py-3 text-center text-xs text-slate-400">
            Atualizando regras de comissão...
          </div>
        )}
      </section>

      {/* Dialog de fechamento */}
      {linhaPendente && (
        <FecharComissaoDialog
          aberto={
            dialogFechamentoAberto
          }
          onClose={
            fecharDialogFechamento
          }
          onConfirmar={
            confirmarFechamento
          }
          nomeColaborador={
            linhaPendente.colaborador
              .nome
          }
          competencia={competencia}
          producao={
            linhaPendente.producao
          }
          totalComissao={
            linhaPendente.totalComissao
          }
          totalBonificacao={
            linhaPendente.totalBonificacao
          }
          totalPagar={
            linhaPendente.totalPagar
          }
          salvando={salvando}
        />
      )}

      {/* Dialog de pagamento */}
      {linhaDoFechamento &&
        linhaDoFechamento.fechamento && (
          <RegistrarPagamentoDialog
            aberto={
              dialogPagamentoAberto
            }
            onClose={
              fecharDialogPagamento
            }
            onConfirmar={
              confirmarPagamento
            }
            nomeColaborador={
              linhaDoFechamento
                .colaborador.nome
            }
            competencia={competencia}
            totalPagar={
              linhaDoFechamento
                .totalPagar
            }
            dataFechamento={
              linhaDoFechamento
                .fechamento
                .dataFechamento
            }
            salvando={salvando}
          />
        )}
    </div>
  );
}

function ResumoCard({
  icon,
  label,
  valor,
  estilo,
}: {
  icon: React.ReactNode;
  label: string;
  valor: string;
  estilo:
    | "orange"
    | "blue"
    | "green"
    | "purple";
}) {
  const estilos = {
    orange:
      "bg-orange-50 text-[#f97316]",

    blue:
      "bg-blue-50 text-blue-600",

    green:
      "bg-green-50 text-green-600",

    purple:
      "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${estilos[estilo]}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-900">
        {valor}
      </p>
    </div>
  );
}