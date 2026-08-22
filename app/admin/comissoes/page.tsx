"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Calculator,
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
  observarFechamentos,
  Fechamento,
} from "@/lib/fechamentos";

import ComissaoDialog from "@/components/ui/comissao-dialog";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
    (regras.bonificacaoLiberacaoPercentual / 100);

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

/**
 * Encontra os resultados que pertencem a um fechamento antigo.
 *
 * Antes de existir resultadoIds, o fechamento guardava apenas
 * os valores já calculados. Para não puxar resultados novos
 * para dentro de um fechamento antigo, procuramos uma combinação
 * exata de resultados cuja produção seja igual à produção congelada
 * no fechamento.
 *
 * Trabalhamos em centavos para evitar problemas de ponto flutuante.
 */
function encontrarResultadosDoFechamentoAntigo(
  resultados: Resultado[],
  producaoFechamento: number
): Resultado[] {
  if (resultados.length === 0) {
    return [];
  }

  const alvo = Math.round(
    (producaoFechamento || 0) * 100
  );

  if (alvo <= 0) {
    return [];
  }

  const candidatos = resultados
    .filter(
      (resultado) =>
        (resultado.producaoFinsol || 0) > 0
    )
    .map((resultado) => ({
      resultado,
      valor: Math.round(
        (resultado.producaoFinsol || 0) * 100
      ),
    }))
    .sort((a, b) => b.valor - a.valor);

  /**
   * dp[valor] guarda a melhor combinação encontrada
   * para aquele valor. Preferimos a combinação com
   * menos lançamentos.
   */
  const dp = new Map<
    number,
    Resultado[]
  >();

  dp.set(0, []);

  for (const candidato of candidatos) {
    const estadosAtuais = Array.from(dp.entries());

    for (const [soma, combinacao] of estadosAtuais) {
      const novaSoma =
        soma + candidato.valor;

      if (novaSoma > alvo) {
        continue;
      }

      const novaCombinacao = [
        ...combinacao,
        candidato.resultado,
      ];

      const existente =
        dp.get(novaSoma);

      if (
        !existente ||
        novaCombinacao.length <
          existente.length
      ) {
        dp.set(
          novaSoma,
          novaCombinacao
        );
      }
    }

    if (dp.has(alvo)) {
      const encontrada = dp.get(alvo);

      if (encontrada) {
        return encontrada;
      }
    }
  }

  /**
   * Não encontramos combinação exata.
   *
   * É mais seguro deixar o fechamento sem
   * resultadoIds do que vincular um resultado
   * novo incorretamente.
   */
  return [];
}


type LinhaComissao =
  | {
      tipo: "fechamento";
      id: string;
      colaborador: Colaborador;
      fechamento: Fechamento;
      resultados: Resultado[];
      producao: number;
      comissao: number;
      bonificacao: number;
      totalPagar: number;
    }
  | {
      tipo: "pendente";
      id: string;
      colaborador: Colaborador;
      fechamento?: undefined;
      resultados: Resultado[];
      producao: number;
      comissao: number;
      bonificacao: number;
      totalPagar: number;
    };

export default function ComissoesPage() {
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

  const [colaboradorFiltro, setColaboradorFiltro] =
    useState("todos");

  const [carregando, setCarregando] =
    useState(true);

  const [carregandoRegras, setCarregandoRegras] =
    useState(true);

  const [dialogAberto, setDialogAberto] =
    useState(false);

  const [colaboradorSelecionado, setColaboradorSelecionado] =
    useState<Colaborador | null>(null);

  const [linhaSelecionada, setLinhaSelecionada] =
    useState<LinhaComissao | null>(null);

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

  /**
   * Reconciliação dos fechamentos antigos.
   *
   * IMPORTANTE:
   * Alguns fechamentos antigos já receberam resultadoIds
   * pela lógica anterior, mas esses IDs podem estar errados.
   *
   * Por isso não verificamos apenas "resultadoIds vazio".
   * Também conferimos se a soma da produção dos resultados
   * vinculados é exatamente igual à produção congelada no
   * fechamento.
   *
   * Exemplo:
   * fechamento = R$ 50.000
   * IDs antigos = R$ 20.000 + R$ 50.000 = R$ 70.000
   *
   * Como 70.000 !== 50.000, o vínculo é considerado
   * inconsistente e é reconstruído.
   *
   * Depois da correção:
   * fechamento = R$ 50.000
   * resultadoIds = somente o lançamento de R$ 50.000
   * lançamento de R$ 20.000 = continua pendente.
   */
  useEffect(() => {
    if (
      resultados.length === 0 ||
      fechamentos.length === 0
    ) {
      return;
    }

    let cancelado = false;

    function centavos(valor: number) {
      return Math.round(
        (valor || 0) * 100
      );
    }

    function somaResultadosPorIds(
      ids: string[]
    ) {
      return resultados
        .filter((resultado) =>
          ids.includes(resultado.id)
        )
        .reduce(
          (total, resultado) =>
            total +
            centavos(
              resultado.producaoFinsol
            ),
          0
        );
    }

    async function reconciliarFechamentos() {
      /**
       * Fechamentos que já têm resultadoIds corretos
       * ficam preservados e seus resultados não podem
       * ser usados por outro fechamento.
       */
      const idsReservados =
        new Set<string>();

      const fechamentosOrdenados =
        [...fechamentos].sort((a, b) =>
          (
            a.dataFechamento || ""
          ).localeCompare(
            b.dataFechamento || ""
          )
        );

      for (const fechamento of fechamentosOrdenados) {
        if (cancelado) {
          return;
        }

        const idsAtuais =
          Array.isArray(
            fechamento.resultadoIds
          )
            ? fechamento.resultadoIds
            : [];

        const resultadosAtuais =
          resultados.filter(
            (resultado) =>
              resultado.competencia ===
                fechamento.competencia &&
              resultado.colaboradorId ===
                fechamento.colaboradorId &&
              idsAtuais.includes(
                resultado.id
              )
          );

        const somaAtual =
          somaResultadosPorIds(
            idsAtuais
          );

        const producaoEsperada =
          centavos(
            fechamento.producaoFinsol
          );

        /**
         * Se o vínculo atual bate exatamente com
         * o valor congelado, preservamos o histórico.
         */
        const vinculoAtualCorreto =
          idsAtuais.length > 0 &&
          somaAtual === producaoEsperada;

        if (vinculoAtualCorreto) {
          idsAtuais.forEach((id) =>
            idsReservados.add(id)
          );
          continue;
        }

        /**
         * O vínculo está vazio ou inconsistente.
         * Procuramos uma combinação exata somente entre
         * resultados do mesmo colaborador/competência
         * que ainda não estejam reservados.
         */
        const candidatos =
          resultados.filter(
            (resultado) =>
              resultado.competencia ===
                fechamento.competencia &&
              resultado.colaboradorId ===
                fechamento.colaboradorId &&
              !idsReservados.has(
                resultado.id
              )
          );

        if (
          candidatos.length === 0 ||
          producaoEsperada <= 0
        ) {
          /**
           * Se não conseguimos reconstruir com segurança,
           * não alteramos o registro existente.
           */
          continue;
        }

        const candidatosComValor =
          candidatos
            .filter(
              (resultado) =>
                centavos(
                  resultado.producaoFinsol
                ) > 0
            )
            .map((resultado) => ({
              resultado,
              valor: centavos(
                resultado.producaoFinsol
              ),
            }))
            .sort(
              (a, b) =>
                b.valor - a.valor
            );

        /**
         * Busca uma combinação exata de lançamentos.
         * A combinação com menos lançamentos é preferida.
         */
        const dp = new Map<
          number,
          Resultado[]
        >();

        dp.set(0, []);

        for (const candidato of candidatosComValor) {
          const estados =
            Array.from(dp.entries());

          for (const [
            soma,
            combinacao,
          ] of estados) {
            const novaSoma =
              soma + candidato.valor;

            if (
              novaSoma >
              producaoEsperada
            ) {
              continue;
            }

            const novaCombinacao = [
              ...combinacao,
              candidato.resultado,
            ];

            const existente =
              dp.get(novaSoma);

            if (
              !existente ||
              novaCombinacao.length <
                existente.length
            ) {
              dp.set(
                novaSoma,
                novaCombinacao
              );
            }
          }

          if (
            dp.has(producaoEsperada)
          ) {
            break;
          }
        }

        const combinacao =
          dp.get(
            producaoEsperada
          );

        if (
          !combinacao ||
          combinacao.length === 0
        ) {
          console.warn(
            "Não foi possível reconciliar o fechamento:",
            fechamento.id,
            "produção:",
            fechamento.producaoFinsol
          );

          continue;
        }

        const novosIds =
          combinacao.map(
            (resultado) =>
              resultado.id
          );

        try {
          await atualizarFechamento(
            fechamento.id,
            {
              resultadoIds:
                novosIds,
            }
          );

          novosIds.forEach((id) =>
            idsReservados.add(id)
          );

          console.info(
            "Fechamento reconciliado:",
            fechamento.id,
            novosIds
          );
        } catch (error) {
          console.error(
            "Erro ao reconciliar fechamento:",
            error
          );
        }
      }
    }

    reconciliarFechamentos();

    return () => {
      cancelado = true;
    };
  }, [resultados, fechamentos]);

  const resultadosDaCompetencia =
    useMemo(() => {
      return resultados.filter(
        (resultado) =>
          resultado.competencia ===
          competencia
      );
    }, [resultados, competencia]);

  const resultadosFiltrados =
    useMemo(() => {
      return resultadosDaCompetencia.filter(
        (resultado) => {
          if (
            colaboradorFiltro ===
            "todos"
          ) {
            return true;
          }

          return (
            resultado.colaboradorId ===
            colaboradorFiltro
          );
        }
      );
    }, [
      resultadosDaCompetencia,
      colaboradorFiltro,
    ]);

  const fechamentosDaCompetencia =
    useMemo(() => {
      return fechamentos.filter(
        (fechamento) =>
          fechamento.competencia ===
          competencia
      );
    }, [fechamentos, competencia]);

  /**
   * Todos os resultados que já foram utilizados
   * em algum fechamento desta competência.
   */
  const resultadoIdsFechados =
    useMemo(() => {
      const ids = new Set<string>();

      fechamentosDaCompetencia.forEach(
        (fechamento) => {
          fechamento.resultadoIds.forEach(
            (resultadoId) => {
              ids.add(resultadoId);
            }
          );
        }
      );

      return ids;
    }, [fechamentosDaCompetencia]);

  const colaboradoresComResultados =
    useMemo(() => {
      const ids = new Set<string>();

      resultadosFiltrados.forEach(
        (resultado) => {
          ids.add(resultado.colaboradorId);
        }
      );

      /**
       * Também adicionamos colaboradores que possuem
       * fechamento na competência. Isso mantém o
       * histórico visível mesmo quando não há resultado
       * novo pendente.
       */
      fechamentosDaCompetencia.forEach(
        (fechamento) => {
          if (
            colaboradorFiltro ===
              "todos" ||
            fechamento.colaboradorId ===
              colaboradorFiltro
          ) {
            ids.add(
              fechamento.colaboradorId
            );
          }
        }
      );

      return colaboradores.filter(
        (colaborador) =>
          ids.has(colaborador.id)
      );
    }, [
      colaboradores,
      resultadosFiltrados,
      fechamentosDaCompetencia,
      colaboradorFiltro,
    ]);

  function obterNomeColaborador(
    id: string
  ) {
    return (
      colaboradores.find(
        (colaborador) =>
          colaborador.id === id
      )?.nome ||
      "Colaborador não encontrado"
    );
  }

  /**
   * Cria todas as linhas da tela.
   *
   * Um colaborador pode possuir:
   *
   * - vários fechamentos históricos;
   * - e uma nova linha pendente com resultados
   *   que ainda não pertencem a nenhum fechamento.
   */
  const linhasComissao =
    useMemo<LinhaComissao[]>(() => {
      const linhas: LinhaComissao[] = [];

      colaboradoresComResultados.forEach(
        (colaborador) => {
          const fechamentosColaborador =
            fechamentosDaCompetencia
              .filter(
                (fechamento) =>
                  fechamento.colaboradorId ===
                  colaborador.id
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

          /**
           * Adiciona cada fechamento como uma
           * linha independente.
           */
          fechamentosColaborador.forEach(
            (fechamento) => {
              const resultadosDoFechamento =
                resultadosDaCompetencia.filter(
                  (resultado) =>
                    resultado.colaboradorId ===
                      colaborador.id &&
                    fechamento.resultadoIds.includes(
                      resultado.id
                    )
                );

              linhas.push({
                tipo: "fechamento",

                id: `fechamento-${fechamento.id}`,

                colaborador,

                fechamento,

                resultados:
                  resultadosDoFechamento,

                producao:
                  fechamento.producaoFinsol,

                comissao:
                  fechamento.totalComissao,

                bonificacao:
                  fechamento.totalBonificacao,

                totalPagar:
                  fechamento.totalPagar,
              });
            }
          );

          /**
           * Resultados que ainda não pertencem
           * a nenhum fechamento.
           */
          const resultadosPendentes =
            resultadosFiltrados.filter(
              (resultado) =>
                resultado.colaboradorId ===
                  colaborador.id &&
                !resultadoIdsFechados.has(
                  resultado.id
                )
            );

          if (
            resultadosPendentes.length > 0
          ) {
            const calculos =
              resultadosPendentes.map(
                (resultado) =>
                  calcularComissao(
                    resultado,
                    regras
                  )
              );

            const producao =
              resultadosPendentes.reduce(
                (total, resultado) =>
                  total +
                  (resultado.producaoFinsol ||
                    0),
                0
              );

            const comissao =
              calculos.reduce(
                (total, calculo) =>
                  total +
                  calculo.totalComissao,
                0
              );

            const bonificacao =
              calculos.reduce(
                (total, calculo) =>
                  total +
                  calculo.bonificacaoLiberacao,
                0
              );

            const totalPagar =
              calculos.reduce(
                (total, calculo) =>
                  total +
                  calculo.totalPagar,
                0
              );

            linhas.push({
              tipo: "pendente",

              id: `pendente-${colaborador.id}-${competencia}`,

              colaborador,

              resultados:
                resultadosPendentes,

              producao,

              comissao,

              bonificacao,

              totalPagar,
            });
          }
        }
      );

      return linhas;
    }, [
      colaboradoresComResultados,
      fechamentosDaCompetencia,
      resultadosDaCompetencia,
      resultadosFiltrados,
      resultadoIdsFechados,
      regras,
      competencia,
    ]);

  /**
   * Somente os resultados ainda não fechados
   * entram nos cards de cálculo.
   */
  const linhasPendentes =
    useMemo(() => {
      return linhasComissao.filter(
        (linha) =>
          linha.tipo === "pendente"
      );
    }, [linhasComissao]);

  const resumo = useMemo(() => {
    return linhasPendentes.reduce(
      (acc, linha) => {
        linha.resultados.forEach(
          (resultado) => {
            const calculo =
              calcularComissao(
                resultado,
                regras
              );

            acc.producao +=
              resultado.producaoFinsol ||
              0;

            acc.comissaoLiberacao +=
              calculo.comissaoLiberacao;

            acc.bonificacaoLiberacao +=
              calculo.bonificacaoLiberacao;

            acc.comissaoReembolso +=
              calculo.comissaoReembolso;

            acc.comissaoSeguro +=
              calculo.comissaoSeguro;

            acc.comissaoAssistencia +=
              calculo.comissaoAssistencia;

            acc.comissao +=
              calculo.totalComissao;

            acc.bonificacoes +=
              calculo.bonificacaoLiberacao;

            acc.totalPagar +=
              calculo.totalPagar;

            acc.clientes +=
              resultado.quantidadeClientes ||
              0;
          }
        );

        return acc;
      },
      {
        producao: 0,
        comissaoLiberacao: 0,
        bonificacaoLiberacao: 0,
        comissaoReembolso: 0,
        comissaoSeguro: 0,
        comissaoAssistencia: 0,
        comissao: 0,
        bonificacoes: 0,
        totalPagar: 0,
        clientes: 0,
      }
    );
  }, [linhasPendentes, regras]);

  function abrirDetalhamento(
    linha: LinhaComissao
  ) {
    setColaboradorSelecionado(
      linha.colaborador
    );

    setLinhaSelecionada(linha);

    setDialogAberto(true);
  }

  function fecharDetalhamento() {
    setDialogAberto(false);
    setColaboradorSelecionado(null);
    setLinhaSelecionada(null);
  }

  function renderizarSituacao(
    linha: LinhaComissao
  ) {
    if (linha.tipo === "pendente") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
          <Clock3 size={13} />
          Pendente
        </span>
      );
    }

    if (
      linha.fechamento.situacao ===
      "Fechado"
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
          <CheckCircle2 size={13} />
          Fechado
        </span>
      );
    }

    if (
      linha.fechamento.situacao ===
      "Pago"
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
          <CheckCircle2 size={13} />
          Pago
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
        <Clock3 size={13} />
        Pendente
      </span>
    );
  }

  const resultadosDoDialog =
    linhaSelecionada?.resultados ||
    [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <p className="text-sm font-semibold text-[#f97316]">
          Financeiro
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Comissões
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Confira as comissões e os valores calculados para cada colaborador.
        </p>
      </div>

      {/* Filtros */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-2">
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
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
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
        </div>
      </section>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          icon={<BarChart3 size={20} />}
          label="Produção a calcular"
          valor={formatarMoeda(
            resumo.producao
          )}
          estilo="orange"
        />

        <ResumoCard
          icon={<Calculator size={20} />}
          label="Comissões"
          valor={formatarMoeda(
            resumo.comissao
          )}
          estilo="blue"
        />

        <ResumoCard
          icon={<CircleDollarSign size={20} />}
          label="Bonificações"
          valor={formatarMoeda(
            resumo.bonificacoes
          )}
          estilo="green"
        />

        <ResumoCard
          icon={<Wallet size={20} />}
          label="Total a pagar"
          valor={formatarMoeda(
            resumo.totalPagar
          )}
          estilo="purple"
        />
      </div>

      {/* Fechamento */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#f97316]">
              <Calculator size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Fechamento de comissões
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Valores disponíveis para fechamento na competência:{" "}
                {competencia}
              </p>
            </div>
          </div>

          {linhasPendentes.length >
          0 ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <Clock3 size={14} />
              Cálculo pendente
            </span>
          ) : (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
              <CheckCircle2 size={14} />
              Tudo fechado
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <CalculoItem
            titulo="Liberação"
            percentual={`${regras.liberacaoPercentual}%`}
            valor={formatarMoeda(
              resumo.comissaoLiberacao
            )}
          />

          <CalculoItem
            titulo="Bonificação"
            percentual={`${regras.bonificacaoLiberacaoPercentual}%`}
            valor={formatarMoeda(
              resumo.bonificacaoLiberacao
            )}
          />

          <CalculoItem
            titulo="Reembolso"
            percentual={`${regras.reembolsoPercentual}%`}
            valor={formatarMoeda(
              resumo.comissaoReembolso
            )}
          />

          <CalculoItem
            titulo="Seguros"
            percentual={`${regras.seguroPercentual}%`}
            valor={formatarMoeda(
              resumo.comissaoSeguro
            )}
          />

          <CalculoItem
            titulo="Assistência"
            percentual={`R$ ${regras.assistenciaValorPorCliente
              .toFixed(2)
              .replace(
                ".",
                ","
              )} / cliente`}
            valor={formatarMoeda(
              resumo.comissaoAssistencia
            )}
          />
        </div>

        {carregandoRegras && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Atualizando regras de comissão...
          </p>
        )}
      </section>

      {/* Colaboradores */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900">
            Colaboradores
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            {linhasComissao.length}{" "}
            linha(s) de comissão na competência
          </p>
        </div>

        {carregando ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-slate-400">
              Carregando informações...
            </p>
          </div>
        ) : linhasComissao.length ===
          0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users size={26} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-700">
              Nenhum resultado encontrado
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Não existem resultados ou fechamentos registrados para os filtros selecionados.
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
                      Produção
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Comissão
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Bonificação
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Total a pagar
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Situação
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {linhasComissao.map(
                    (linha) => {
                      const ehPendente =
                        linha.tipo ===
                        "pendente";

                      return (
                        <tr
                          key={linha.id}
                          onClick={() =>
                            abrirDetalhamento(
                              linha
                            )
                          }
                          className="cursor-pointer border-b border-slate-100 transition hover:bg-orange-50/40 last:border-0"
                        >
                          <td className="px-5 py-4">
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

                                {!ehPendente &&
                                  " • fechamento"}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                            {formatarMoeda(
                              linha.producao
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                            {formatarMoeda(
                              linha.comissao
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-green-600">
                            {formatarMoeda(
                              linha.bonificacao
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-slate-900">
                            {formatarMoeda(
                              linha.totalPagar
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {renderizarSituacao(
                              linha
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
              {linhasComissao.map(
                (linha) => {
                  return (
                    <button
                      key={linha.id}
                      type="button"
                      onClick={() =>
                        abrirDetalhamento(
                          linha
                        )
                      }
                      className="block w-full p-4 text-left transition hover:bg-slate-50"
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

                        {renderizarSituacao(
                          linha
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <MiniMetric
                          label="Produção"
                          value={formatarMoeda(
                            linha.producao
                          )}
                        />

                        <MiniMetric
                          label="Comissão"
                          value={formatarMoeda(
                            linha.comissao
                          )}
                        />

                        <MiniMetric
                          label="Bonificação"
                          value={formatarMoeda(
                            linha.bonificacao
                          )}
                        />

                        <MiniMetric
                          label="Total a pagar"
                          value={formatarMoeda(
                            linha.totalPagar
                          )}
                        />
                      </div>

                      <p className="mt-3 text-center text-[11px] font-medium text-[#f97316]">
                        Toque para ver o detalhamento
                      </p>
                    </button>
                  );
                }
              )}
            </div>
          </>
        )}
      </section>

      {/* Dialog */}
      {colaboradorSelecionado &&
        linhaSelecionada && (
          <ComissaoDialog
            aberto={dialogAberto}
            onClose={fecharDetalhamento}
            nomeColaborador={
              colaboradorSelecionado.nome
            }
            competencia={competencia}
            resultados={
              resultadosDoDialog
            }
            regras={regras}
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

function CalculoItem({
  titulo,
  percentual,
  valor,
}: {
  titulo: string;
  percentual: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-600">
          {titulo}
        </p>

        <span className="text-[10px] font-semibold text-slate-400">
          {percentual}
        </span>
      </div>

      <p className="mt-2 text-lg font-bold text-slate-900">
        {valor}
      </p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}