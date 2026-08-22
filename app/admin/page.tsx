"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  TrendingUp,
  Wallet,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  Fechamento,
  observarFechamentos,
} from "@/lib/fechamentos";

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

function percentual(valor: number) {
  return `${valor.toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  })}%`;
}

function formatarCompetencia(
  valor: string
) {
  if (!valor) return "";

  const partes = valor
    .trim()
    .toLowerCase()
    .split(/[\s/-]+/);

  const meses: Record<
    string,
    string
  > = {
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

  const nomesMeses: Record<
    string,
    string
  > = {
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

  // Formato: 2026-08
  if (
    partes.length === 2 &&
    /^\d{4}$/.test(partes[0]) &&
    /^\d{2}$/.test(partes[1])
  ) {
    return `${meses[partes[1]]} de ${partes[0]}`;
  }

  // Formato: agosto de 2026
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
  const normalizado =
    normalizarCompetencia(valor);

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
  return typeof valor === "number"
    ? valor
    : Number(valor) || 0;
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

  if (hora >= 5 && hora < 12) {
    return "Bom dia!";
  }

  if (hora >= 12 && hora < 18) {
    return "Boa tarde!";
  }

  return "Boa noite!";
}

function fraseMotivacionalDoDia() {
  const agora = new Date();
  const inicioDoAno = new Date(
    agora.getFullYear(),
    0,
    1
  );

  const diferenca =
    agora.getTime() - inicioDoAno.getTime();

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
  const [ano, mes] =
    competencia.split("-").map(Number);

  const data = new Date(
    ano,
    mes - 1 + quantidade,
    1
  );

  return `${data.getFullYear()}-${String(
    data.getMonth() + 1
  ).padStart(2, "0")}`;
}

function parseDataBR(data?: unknown) {
  if (data == null) return null;

  // Compatibilidade com Timestamp do Firestore.
  if (
    typeof data === "object" &&
    data !== null &&
    "toDate" in data &&
    typeof (data as { toDate?: unknown }).toDate ===
      "function"
  ) {
    const dataFirestore = (
      data as { toDate: () => Date }
    ).toDate();

    return Number.isNaN(
      dataFirestore.getTime()
    )
      ? null
      : new Date(dataFirestore);
  }

  const valor = String(data).trim();

  if (!valor) return null;

  // DD/MM/AAAA
  const formatoBR =
    /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const matchBR = valor.match(formatoBR);

  if (matchBR) {
    const [, dia, mes, ano] = matchBR;

    const dataConvertida = new Date(
      Number(ano),
      Number(mes) - 1,
      Number(dia)
    );

    return Number.isNaN(
      dataConvertida.getTime()
    )
      ? null
      : dataConvertida;
  }

  // AAAA-MM-DD ou AAAA-MM-DDTHH:mm:ss...
  const formatoISO =
    /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/;
  const matchISO = valor.match(formatoISO);

  if (matchISO) {
    const [, ano, mes, dia] = matchISO;

    const dataConvertida = new Date(
      Number(ano),
      Number(mes) - 1,
      Number(dia)
    );

    return Number.isNaN(
      dataConvertida.getTime()
    )
      ? null
      : dataConvertida;
  }

  // Fallback para outros formatos reconhecidos.
  const dataConvertida = new Date(valor);

  return Number.isNaN(
    dataConvertida.getTime()
  )
    ? null
    : dataConvertida;
}

function diasDaCompetencia(
  competencia: string
) {
  const [ano, mes] =
    competencia.split("-").map(Number);

  if (!ano || !mes) {
    return [];
  }

  const quantidadeDias = new Date(
    ano,
    mes,
    0
  ).getDate();

  return Array.from(
    { length: quantidadeDias },
    (_, index) => index + 1
  );
}

export default function AdminPage() {
  const [fechamentos, setFechamentos] =
    useState<Fechamento[]>([]);

  const [colaboradores, setColaboradores] =
    useState<Colaborador[]>([]);

  const [carregando, setCarregando] =
    useState(true);

 const [competenciaSelecionada, setCompetenciaSelecionada] =
  useState(competenciaAtual());

  useEffect(() => {
    let carregouFechamentos = false;
    let carregouColaboradores = false;

    const verificarCarregamento = () => {
      if (
        carregouFechamentos &&
        carregouColaboradores
      ) {
        setCarregando(false);
      }
    };

    const unsubscribeFechamentos =
      observarFechamentos((dados) => {
        setFechamentos(dados);
        carregouFechamentos = true;
        verificarCarregamento();
      });

    const unsubscribeColaboradores =
      observarColaboradores((dados) => {
        setColaboradores(dados);
        carregouColaboradores = true;
        verificarCarregamento();
      });

    return () => {
      unsubscribeFechamentos();
      unsubscribeColaboradores();
    };
  }, []);

  const fechamentosDaCompetencia =
    useMemo(() => {
      if (!competenciaSelecionada) {
        return [];
      }

      return fechamentos.filter(
        (fechamento) =>
          extrairMesAno(
            fechamento.competencia
          ) === competenciaSelecionada
      );
    }, [
      fechamentos,
      competenciaSelecionada,
    ]);

  const indicadores = useMemo(() => {
    const totalComprometido =
      fechamentosDaCompetencia.reduce(
        (total, fechamento) =>
          total +
          valorNumerico(
            fechamento.totalPagar
          ),
        0
      );

    const recebido =
      fechamentosDaCompetencia
        .filter(
          (fechamento) =>
            fechamento.situacao === "Pago"
        )
        .reduce(
          (total, fechamento) =>
            total +
            valorNumerico(
              fechamento.totalPagar
            ),
          0
        );

    const emAberto =
      fechamentosDaCompetencia
        .filter(
          (fechamento) =>
            fechamento.situacao !== "Pago"
        )
        .reduce(
          (total, fechamento) =>
            total +
            valorNumerico(
              fechamento.totalPagar
            ),
          0
        );

    const indiceRecebimento =
      totalComprometido > 0
        ? (recebido / totalComprometido) *
          100
        : 0;

    const pagos =
      fechamentosDaCompetencia.filter(
        (item) => item.situacao === "Pago"
      ).length;

    const fechados =
      fechamentosDaCompetencia.filter(
        (item) =>
          item.situacao === "Fechado"
      ).length;

    const pendentes =
      fechamentosDaCompetencia.filter(
        (item) =>
          item.situacao === "Pendente"
      ).length;

    return {
      totalComprometido,
      recebido,
      emAberto,
      indiceRecebimento,
      pagos,
      fechados,
      pendentes,
    };
  }, [fechamentosDaCompetencia]);

  const colaboradoresMap = useMemo(() => {
    const mapa = new Map<
      string,
      string
    >();

    colaboradores.forEach((colaborador) => {
      mapa.set(
        colaborador.id,
        colaborador.nome
      );
    });

    return mapa;
  }, [colaboradores]);

  const exposicaoPorColaborador =
    useMemo(() => {
      const mapa = new Map<
        string,
        {
          id: string;
          nome: string;
          valor: number;
        }
      >();

      fechamentosDaCompetencia
        .filter(
          (item) =>
            item.situacao !== "Pago"
        )
        .forEach((fechamento) => {
          const id =
            fechamento.colaboradorId;

          const nome =
            colaboradoresMap.get(id) ??
            "Colaborador não identificado";

          const atual =
            mapa.get(id);

          mapa.set(id, {
            id,
            nome,
            valor:
              (atual?.valor ?? 0) +
              valorNumerico(
                fechamento.totalPagar
              ),
          });
        });

      return Array.from(
        mapa.values()
      ).sort(
        (a, b) => b.valor - a.valor
      );
    }, [
      fechamentosDaCompetencia,
      colaboradoresMap,
    ]);

  const maiorExposicao =
    exposicaoPorColaborador[0];

  const maxExposicao =
    maiorExposicao?.valor ?? 0;

  const evolucaoFinanceira =
    useMemo(() => {
      if (!competenciaSelecionada) {
        return [];
      }

      const [ano, mes] =
        competenciaSelecionada
          .split("-")
          .map(Number);

      if (!ano || !mes) {
        return [];
      }

      const dias = diasDaCompetencia(
        competenciaSelecionada
      );

      return dias.map((dia) => {
        const dataDoDia = new Date(
          ano,
          mes - 1,
          dia,
          23,
          59,
          59,
          999
        );

        let recebidoAcumulado = 0;
        let abertoAtual = 0;

        fechamentos.forEach((fechamento) => {
          if (
            extrairMesAno(
              fechamento.competencia
            ) !== competenciaSelecionada
          ) {
            return;
          }

          const valor = valorNumerico(
            fechamento.totalPagar
          );

          let dataFechamento = parseDataBR(
            fechamento.dataFechamento
          );

          // Se o fechamento antigo não tiver
          // data, usamos o primeiro dia da competência.
          if (!dataFechamento) {
            dataFechamento = new Date(
              ano,
              mes - 1,
              1,
              0,
              0,
              0,
              0
            );
          }

          let dataPagamento = parseDataBR(
            fechamento.dataPagamento
          );

          /*
           * PAGOS
           *
           * O gráfico precisa continuar mostrando
           * o recebido mesmo que algum fechamento
           * antigo não possua dataPagamento.
           * Nesse caso usamos a data do fechamento
           * como fallback.
           */
          if (
            fechamento.situacao === "Pago"
          ) {
            if (!dataPagamento) {
              dataPagamento =
                dataFechamento;
            }

            if (
              dataPagamento <= dataDoDia
            ) {
              recebidoAcumulado += valor;
            }

            /*
             * Enquanto o pagamento ainda não ocorreu,
             * o valor aparece como exposição.
             */
            if (
              dataFechamento <= dataDoDia &&
              dataPagamento > dataDoDia
            ) {
              abertoAtual += valor;
            }

            return;
          }

          /*
           * NÃO PAGOS
           *
           * Permanecem na exposição a partir da
           * data do fechamento.
           */
          if (
            dataFechamento <= dataDoDia
          ) {
            abertoAtual += valor;
          }
        });

        return {
          dia,
          recebido: recebidoAcumulado,
          aberto: abertoAtual,
        };
      });
    }, [
      fechamentos,
      competenciaSelecionada,
    ]);

  const maiorValorGrafico =
    Math.max(
      ...evolucaoFinanceira.flatMap(
        (item) => [
          item.recebido,
          item.aberto,
        ]
      ),
      1
    );

  const pontosGrafico = useMemo(() => {
    const largura = 1000;
    const margemX = 12;
    const topo = 18;
    const base = 225;
    const areaAltura = base - topo;

    return evolucaoFinanceira.map(
      (item, index) => {
        const divisor = Math.max(
          evolucaoFinanceira.length - 1,
          1
        );

        const x =
          margemX +
          (index / divisor) *
            (largura - margemX * 2);

        const yRecebido =
          base -
          (item.recebido /
            maiorValorGrafico) *
            areaAltura;

        const yAberto =
          base -
          (item.aberto /
            maiorValorGrafico) *
            areaAltura;

        return {
          dia: item.dia,
          x,
          yRecebido,
          yAberto,
          recebido: item.recebido,
          aberto: item.aberto,
        };
      }
    );
  }, [
    evolucaoFinanceira,
    maiorValorGrafico,
  ]);

  const pontosRecebido =
    pontosGrafico
      .map(
        (ponto) =>
          `${ponto.x},${ponto.yRecebido}`
      )
      .join(" ");

  const pontosAberto =
    pontosGrafico
      .map(
        (ponto) =>
          `${ponto.x},${ponto.yAberto}`
      )
      .join(" ");

  const pontosAreaRecebido =
    pontosGrafico.length > 0
      ? `12,225 ${pontosRecebido} 988,225`
      : "";

  const alertas = useMemo(() => {
    const itens: {
      tipo:
        | "warning"
        | "success"
        | "info";
      texto: string;
    }[] = [];

    if (
      indicadores.pendentes > 0
    ) {
      itens.push({
        tipo: "warning",
        texto: `${
          indicadores.pendentes
        } fechamento(s) ainda estão pendentes.`,
      });
    }

    if (
      indicadores.emAberto > 0
    ) {
      itens.push({
        tipo: "warning",
        texto: `${moeda(
          indicadores.emAberto
        )} ainda está em aberto nesta competência.`,
      });
    }

    if (
      indicadores.indiceRecebimento >=
      80
    ) {
      itens.push({
        tipo: "success",
        texto: `O índice de recebimento está em ${percentual(
          indicadores.indiceRecebimento
        )}.`,
      });
    } else if (
      indicadores.totalComprometido >
      0
    ) {
      itens.push({
        tipo: "info",
        texto: `O índice de recebimento está em ${percentual(
          indicadores.indiceRecebimento
        )}.`,
      });
    }

    if (maiorExposicao) {
      itens.push({
        tipo: "info",
        texto: `Maior exposição: ${maiorExposicao.nome}, com ${moeda(
          maiorExposicao.valor
        )} em aberto.`,
      });
    }

    return itens.slice(0, 4);
  }, [
    indicadores,
    maiorExposicao,
  ]);

  const dataAtual = new Date();
  const saudacao = saudacaoAtual();
  const fraseMotivacional =
    fraseMotivacionalDoDia();

  const competenciaLabel =
    competenciaSelecionada
      ? formatarCompetencia(
          competenciaSelecionada
        )
      : dataAtual.toLocaleDateString(
          "pt-BR",
          {
            month: "long",
            year: "numeric",
          }
        );

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      {/* Cabeçalho */}
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
            Gestão Financeira
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard Financeiro
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Visão executiva dos recebimentos,
            compromissos e exposição financeira.
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

 <div className="w-auto min-w-[110px] text-center">
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
              Carregando dados financeiros...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Indicadores financeiros */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2
                    size={18}
                  />
                </div>

                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                  <ArrowUpRight
                    size={12}
                  />
                  recebido
                </span>
              </div>

              <p className="mt-4 text-xs font-medium text-slate-500">
                Recebido no período
              </p>

              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {moeda(
                  indicadores.recebido
                )}
              </p>

              <p className="mt-1 text-[11px] text-slate-400">
                Valores de fechamentos pagos
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock3 size={18} />
                </div>

                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                  <ArrowDownRight
                    size={12}
                  />
                  aberto
                </span>
              </div>

              <p className="mt-4 text-xs font-medium text-slate-500">
                Em aberto
              </p>

              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {moeda(
                  indicadores.emAberto
                )}
              </p>

              <p className="mt-1 text-[11px] text-slate-400">
                Fechados e pendentes
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Wallet size={18} />
                </div>

                <span className="text-[10px] font-semibold text-slate-400">
                  período
                </span>
              </div>

              <p className="mt-4 text-xs font-medium text-slate-500">
                Total comprometido
              </p>

              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {moeda(
                  indicadores.totalComprometido
                )}
              </p>

              <p className="mt-1 text-[11px] text-slate-400">
                Pago + valores em aberto
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#f97316]">
                  <TrendingUp
                    size={18}
                  />
                </div>

                <span className="text-[10px] font-semibold text-slate-400">
                  eficiência
                </span>
              </div>

              <p className="mt-4 text-xs font-medium text-slate-500">
                Índice de recebimento
              </p>

              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {percentual(
                  indicadores.indiceRecebimento
                )}
              </p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#f97316] transition-all"
                  style={{
                    width: `${Math.min(
                      indicadores.indiceRecebimento,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Gráficos principais */}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(330px,0.8fr)]">
            {/* Evolução */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Evolução financeira
                  </h2>

                  <p className="mt-1 max-w-xl text-[11px] leading-4 text-slate-400 sm:text-xs">
                    Evolução diária dos recebimentos e da exposição financeira.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-[9px] font-medium text-slate-500 sm:gap-4 sm:text-[10px]">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Recebido
                  </span>

                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Em aberto
                  </span>
                </div>
              </div>

              <div className="px-3 pb-4 pt-4 sm:px-5 sm:pb-5">
                {evolucaoFinanceira.length === 0 ? (
                  <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
                    <div className="px-5 text-center">
                      <CircleDollarSign
                        size={28}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-3 text-sm font-semibold text-slate-500">
                        Nenhuma movimentação financeira
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Ainda não existem fechamentos registrados nesta competência.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative h-[250px] w-full sm:h-[280px]">
                      {/* Escala vertical */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[230px]">
                        {[0, 1, 2, 3].map((nivel) => (
                          <div
                            key={nivel}
                            className="absolute left-0 right-0 border-t border-slate-100"
                            style={{
                              top: `${(nivel / 3) * 100}%`,
                            }}
                          />
                        ))}
                      </div>

                      <svg
                        viewBox="0 0 1000 250"
                        preserveAspectRatio="none"
                        className="relative z-10 h-[230px] w-full overflow-visible"
                        role="img"
                        aria-label="Evolução financeira da competência"
                      >
                        {/* Área abaixo da linha de recebimento */}
                        <polygon
                          points={pontosAreaRecebido}
                          fill="rgba(16,185,129,0.07)"
                        />

                        {/* Linha de recebido */}
                        {pontosRecebido && (
                          <polyline
                            points={pontosRecebido}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        )}

                        {/* Linha em aberto */}
                        {pontosAberto && (
                          <polyline
                            points={pontosAberto}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        )}

                        {/* Pontos e informações ao toque/mouse */}
                        {pontosGrafico.map((ponto) => (
                          <g key={ponto.dia}>
                            <circle
                              cx={ponto.x}
                              cy={ponto.yRecebido}
                              r="4.5"
                              fill="#10b981"
                              stroke="white"
                              strokeWidth="2"
                              vectorEffect="non-scaling-stroke"
                            >
                              <title>
                                Dia {ponto.dia} — Recebido: {moeda(ponto.recebido)}
                              </title>
                            </circle>

                            <circle
                              cx={ponto.x}
                              cy={ponto.yAberto}
                              r="4.5"
                              fill="#f59e0b"
                              stroke="white"
                              strokeWidth="2"
                              vectorEffect="non-scaling-stroke"
                            >
                              <title>
                                Dia {ponto.dia} — Em aberto: {moeda(ponto.aberto)}
                              </title>
                            </circle>
                          </g>
                        ))}
                      </svg>

                      {/* Escala de valores */}
                      <div className="pointer-events-none absolute left-1 top-0 z-20 flex h-[230px] flex-col justify-between text-[8px] font-medium text-slate-300 sm:left-1 sm:text-[9px]">
                        <span>
                          {moeda(maiorValorGrafico)}
                        </span>
                        <span>
                          {moeda(maiorValorGrafico * 0.66)}
                        </span>
                        <span>
                          {moeda(maiorValorGrafico * 0.33)}
                        </span>
                        <span>
                          R$ 0,00
                        </span>
                      </div>

                      {/* Dias */}
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[8px] font-medium text-slate-400 sm:text-[9px]">
                        {pontosGrafico
                          .filter((_, index) => {
                            const ultimo =
                              pontosGrafico.length - 1;

                            const marcos = new Set([
                              0,
                              Math.floor(ultimo * 0.25),
                              Math.floor(ultimo * 0.5),
                              Math.floor(ultimo * 0.75),
                              ultimo,
                            ]);

                            return marcos.has(index);
                          })
                          .map((ponto) => (
                            <span key={ponto.dia}>
                              {String(ponto.dia).padStart(2, "0")}
                            </span>
                          ))}
                      </div>
                    </div>

                    {/* Leitura rápida */}
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-emerald-50 px-4 py-3">
                        <p className="text-[9px] font-medium uppercase tracking-wide text-emerald-600 sm:text-[10px]">
                          Recebido acumulado
                        </p>

                        <p className="mt-1 text-sm font-bold text-emerald-800 sm:text-base">
                          {moeda(indicadores.recebido)}
                        </p>

                        <p className="mt-0.5 text-[9px] text-emerald-600/70">
                          Total efetivamente pago na competência.
                        </p>
                      </div>

                      <div className="rounded-xl bg-amber-50 px-4 py-3">
                        <p className="text-[9px] font-medium uppercase tracking-wide text-amber-600 sm:text-[10px]">
                          Exposição atual
                        </p>

                        <p className="mt-1 text-sm font-bold text-amber-800 sm:text-base">
                          {moeda(indicadores.emAberto)}
                        </p>

                        <p className="mt-0.5 text-[9px] text-amber-600/70">
                          Total ainda não pago na competência.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Situação */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Situação financeira
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Distribuição dos fechamentos da
                  competência.
                </p>
              </div>

              <div className="mt-6 flex justify-center">
                <div className="relative flex h-48 w-48 items-center justify-center rounded-full bg-slate-100">
                  {indicadores.totalComprometido >
                  0 ? (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(
                          #10b981 0% ${indicadores.indiceRecebimento}%,
                          #fbbf24 ${indicadores.indiceRecebimento}% 100%
                        )`,
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 rounded-full bg-slate-100" />
                  )}

                  <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white shadow-sm">
                    <span className="text-2xl font-bold text-slate-900">
                      {percentual(
                        indicadores.indiceRecebimento
                      )}
                    </span>

                    <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      recebido
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-slate-600">
                      Pago
                    </span>
                  </div>

                  <strong className="text-sm text-slate-900">
                    {indicadores.pagos}
                  </strong>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-medium text-slate-600">
                      Fechado
                    </span>
                  </div>

                  <strong className="text-sm text-slate-900">
                    {indicadores.fechados}
                  </strong>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="text-xs font-medium text-slate-600">
                      Pendente
                    </span>
                  </div>

                  <strong className="text-sm text-slate-900">
                    {indicadores.pendentes}
                  </strong>
                </div>
              </div>
            </section>
          </div>

          {/* Exposição + alertas */}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(350px,0.9fr)]">
            {/* Exposição */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Exposição financeira
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Onde estão concentrados os valores
                    ainda não recebidos.
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#f97316]">
                  <Users size={17} />
                </div>
              </div>

              <div className="p-5">
                {exposicaoPorColaborador.length ===
                0 ? (
                  <div className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
                    <div className="text-center">
                      <CheckCircle2
                        size={28}
                        className="mx-auto text-emerald-400"
                      />

                      <p className="mt-3 text-sm font-semibold text-slate-500">
                        Nenhuma exposição em aberto
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Todos os fechamentos da
                        competência estão pagos.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {exposicaoPorColaborador.map(
                      (item, index) => {
                        const largura =
                          maxExposicao > 0
                            ? (item.valor /
                                maxExposicao) *
                              100
                            : 0;

                        return (
                          <div
                            key={item.id}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">
                                  {index + 1}
                                </span>

                                <span className="truncate text-xs font-semibold text-slate-700">
                                  {item.nome}
                                </span>
                              </div>

                              <strong className="shrink-0 text-xs text-slate-900">
                                {moeda(
                                  item.valor
                                )}
                              </strong>
                            </div>

                            <div className="ml-10 mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-[#f97316] transition-all"
                                style={{
                                  width: `${largura}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Alertas */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500">
                    <AlertTriangle
                      size={17}
                    />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Alertas financeiros
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Pontos que merecem atenção.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-5">
                {alertas.length === 0 ? (
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <div className="flex gap-3">
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-emerald-600"
                      />

                      <div>
                        <p className="text-xs font-semibold text-emerald-800">
                          Situação financeira estável
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-emerald-700">
                          Não foram identificados
                          alertas relevantes nesta
                          competência.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  alertas.map(
                    (alerta, index) => {
                      const classes =
                        alerta.tipo ===
                        "warning"
                          ? "bg-amber-50 text-amber-700"
                          : alerta.tipo ===
                            "success"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-blue-700";

                      return (
                        <div
                          key={`${alerta.texto}-${index}`}
                          className={`rounded-xl p-4 ${classes}`}
                        >
                          <div className="flex gap-3">
                            {alerta.tipo ===
                            "warning" ? (
                              <AlertTriangle
                                size={17}
                                className="mt-0.5 shrink-0"
                              />
                            ) : alerta.tipo ===
                              "success" ? (
                              <CheckCircle2
                                size={17}
                                className="mt-0.5 shrink-0"
                              />
                            ) : (
                              <TrendingUp
                                size={17}
                                className="mt-0.5 shrink-0"
                              />
                            )}

                            <p className="text-xs font-medium leading-5">
                              {alerta.texto}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )
                )}
              </div>
            </section>
          </div>

          {/* Rodapé analítico */}
          <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Leitura financeira
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Competência de{" "}
                  <span className="font-medium capitalize text-slate-600">
                    {competenciaLabel}
                  </span>
                  .
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-500">
                  {fechamentosDaCompetencia.length}{" "}
                  fechamento(s)
                </span>

                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700">
                  {indicadores.pagos} pago(s)
                </span>

                <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-700">
                  {indicadores.pendentes +
                    indicadores.fechados}{" "}
                  em aberto
                </span>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}