"use client";

import ExcelJS from "exceljs";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  CircleDollarSign,
  Clock3,
  FileBarChart,
  FileText,
  Filter,
  Printer,
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
  observarFechamentos,
  Fechamento,
} from "@/lib/fechamentos";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data?: string) {
  if (!data) return "—";

  return new Date(
    `${data}T12:00:00`
  ).toLocaleDateString("pt-BR");
}

function calcularComissao(
  resultado: Resultado,
  regras: RegrasComissao
) {
  const comissaoLiberacao =
    (resultado.produtividade || 0) *
    (regras.liberacaoPercentual / 100);

  const bonificacaoLiberacao =
    comissaoLiberacao *
    (regras.bonificacaoLiberacaoPercentual / 100);

  const comissaoReembolso =
    (resultado.previsaoReembolso || 0) *
    (regras.reembolsoPercentual / 100);

  const comissaoSeguroFinsol =
    (resultado.seguroFinsol || 0) *
    (regras.seguroPercentual / 100);

  const comissaoSeguroPrestamista =
    (resultado.seguroPrestamista || 0) *
    (regras.seguroPercentual / 100);

  const comissaoSeguro =
    comissaoSeguroFinsol +
    comissaoSeguroPrestamista;

  const comissaoAssistencia =
    (resultado.seguroAssistencia || 0) *
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

type TipoRelatorio =
  | "resumo"
  | "colaboradores"
  | "lancamentos"
  | "pagamentos"
  | "comissoes";

type SituacaoFiltro =
  | "todas"
  | "pendente"
  | "fechado"
  | "pago";

type LinhaRelatorio = {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;

  resultados: Resultado[];

  producao: number;
  comissao: number;
  bonificacao: number;
  totalPagar: number;

  comissaoLiberacao: number;
  comissaoReembolso: number;
  comissaoSeguro: number;
  comissaoAssistencia: number;

  situacao: "Pendente" | "Fechado" | "Pago";

  dataFechamento?: string;
  dataPagamento?: string;

  tipo: "fechamento" | "pendente";
};

function obterSituacao(
  fechamento?: Fechamento
): LinhaRelatorio["situacao"] {
  if (!fechamento) {
    return "Pendente";
  }

  if (fechamento.situacao === "Pago") {
    return "Pago";
  }

  if (fechamento.situacao === "Fechado") {
    return "Fechado";
  }

  return "Pendente";
}

function SituacaoBadge({
  situacao,
}: {
  situacao: LinhaRelatorio["situacao"];
}) {
  if (situacao === "Pago") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
        <CheckCircle2 size={13} />
        Pago
      </span>
    );
  }

  if (situacao === "Fechado") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
        <CheckCircle2 size={13} />
        Fechado
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

function ResumoCard({
  icon,
  label,
  valor,
  estilo,
}: {
  icon: React.ReactNode;
  label: string;
  valor: string;
  estilo: "orange" | "blue" | "green" | "purple";
}) {
  const estilos = {
    orange:
      "bg-orange-50 text-orange-500",
    blue:
      "bg-blue-50 text-blue-500",
    green:
      "bg-green-50 text-green-500",
    purple:
      "bg-purple-50 text-purple-500",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${estilos[estilo]}`}
      >
        {icon}
      </div>

      <p className="text-[11px] font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-slate-900">
        {valor}
      </p>
    </div>
  );
}

export default function RelatoriosPage() {
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

  const [situacaoFiltro, setSituacaoFiltro] =
    useState<SituacaoFiltro>("todas");

  const [tipoRelatorio, setTipoRelatorio] =
    useState<TipoRelatorio>("resumo");

  const [carregando, setCarregando] =
    useState(true);

  const [tipoPrevia, setTipoPrevia] =
    useState<"excel" | "pdf" | null>(null);

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

  /**
   * IDs que já pertencem a algum fechamento.
   *
   * Um resultado fechado/pago não pode aparecer
   * novamente como pendente no relatório.
   */
  const resultadoIdsFechados =
    useMemo(() => {
      const ids = new Set<string>();

      fechamentos
        .filter(
          (fechamento) =>
            fechamento.competencia ===
            competencia
        )
        .forEach((fechamento) => {
          (
            fechamento.resultadoIds || []
          ).forEach((id) =>
            ids.add(id)
          );
        });

      return ids;
    }, [fechamentos, competencia]);

  const colaboradorPorId =
    useMemo(() => {
      return new Map(
        colaboradores.map(
          (colaborador) => [
            colaborador.id,
            colaborador,
          ]
        )
      );
    }, [colaboradores]);

  /**
   * Monta cada linha como uma unidade independente:
   *
   * - um fechamento existente = uma linha
   * - cada resultado ainda não fechado = uma linha
   *
   * Isso preserva exatamente a regra adotada
   * em Comissões e Fechamentos.
   */
  const linhasBase =
    useMemo<LinhaRelatorio[]>(() => {
      const linhas: LinhaRelatorio[] = [];

      const fechamentosDaCompetencia =
        fechamentos
          .filter(
            (fechamento) =>
              fechamento.competencia ===
              competencia
          )
          .sort((a, b) =>
            (
              a.dataFechamento || ""
            ).localeCompare(
              b.dataFechamento || ""
            )
          );

      for (const fechamento of fechamentosDaCompetencia) {
        const colaborador =
          colaboradorPorId.get(
            fechamento.colaboradorId
          );

        if (!colaborador) {
          continue;
        }

        const resultadosDaLinha =
          resultadosDaCompetencia.filter(
            (resultado) =>
              (
                fechamento.resultadoIds ||
                []
              ).includes(resultado.id)
          );

        const producao =
          resultadosDaLinha.length > 0
            ? resultadosDaLinha.reduce(
                (total, resultado) =>
                  total +
                  (resultado.produtividade ||
                    0),
                0
              )
            : fechamento.produtividade;

        const calculos =
          resultadosDaLinha.map(
            (resultado) =>
              calcularComissao(
                resultado,
                regras
              )
          );

        const comissaoCalculada =
          calculos.reduce(
            (total, calculo) =>
              total +
              calculo.totalComissao,
            0
          );

        const bonificacaoCalculada =
          calculos.reduce(
            (total, calculo) =>
              total +
              calculo.bonificacaoLiberacao,
            0
          );

        /**
         * Para fechamentos existentes usamos os
         * valores congelados no fechamento.
         * Isso evita que uma alteração futura
         * nas regras de comissão altere o histórico.
         */
        const comissao =
          fechamento.totalComissao ??
          comissaoCalculada;

        const bonificacao =
          fechamento.totalBonificacao ??
          bonificacaoCalculada;

        const totalPagar =
          fechamento.totalPagar ??
          comissao + bonificacao;

        const comissaoLiberacao =
          calculos.reduce(
            (total, calculo) =>
              total +
              calculo.comissaoLiberacao,
            0
          );

        const comissaoReembolso =
          calculos.reduce(
            (total, calculo) =>
              total +
              calculo.comissaoReembolso,
            0
          );

        const comissaoSeguro =
          calculos.reduce(
            (total, calculo) =>
              total +
              calculo.comissaoSeguro,
            0
          );

        const comissaoAssistencia =
          calculos.reduce(
            (total, calculo) =>
              total +
              calculo.comissaoAssistencia,
            0
          );

        linhas.push({
          id: `fechamento-${fechamento.id}`,
          colaboradorId:
            colaborador.id,
          colaboradorNome:
            colaborador.nome,
          resultados:
            resultadosDaLinha,
          producao,
          comissao,
          bonificacao,
          totalPagar,
          comissaoLiberacao,
          comissaoReembolso,
          comissaoSeguro,
          comissaoAssistencia,
          situacao:
            obterSituacao(
              fechamento
            ),
          dataFechamento:
            fechamento.dataFechamento,
          dataPagamento:
            fechamento.dataPagamento,
          tipo: "fechamento",
        });
      }

      /**
       * Resultados que ainda não pertencem a
       * nenhum fechamento permanecem pendentes.
       */
      const resultadosPendentes =
        resultadosDaCompetencia.filter(
          (resultado) =>
            !resultadoIdsFechados.has(
              resultado.id
            )
        );

      for (const resultado of resultadosPendentes) {
        const colaborador =
          colaboradorPorId.get(
            resultado.colaboradorId
          );

        if (!colaborador) {
          continue;
        }

        const calculo =
          calcularComissao(
            resultado,
            regras
          );

        linhas.push({
          id: `pendente-${resultado.id}`,
          colaboradorId:
            colaborador.id,
          colaboradorNome:
            colaborador.nome,
          resultados: [resultado],
          producao:
            resultado.produtividade || 0,
          comissao:
            calculo.totalComissao,
          bonificacao:
            calculo.bonificacaoLiberacao,
          totalPagar:
            calculo.totalPagar,
          comissaoLiberacao:
            calculo.comissaoLiberacao,
          comissaoReembolso:
            calculo.comissaoReembolso,
          comissaoSeguro:
            calculo.comissaoSeguro,
          comissaoAssistencia:
            calculo.comissaoAssistencia,
          situacao: "Pendente",
          tipo: "pendente",
        });
      }

      return linhas;
    }, [
      resultadosDaCompetencia,
      fechamentos,
      colaboradorPorId,
      resultadoIdsFechados,
      regras,
    ]);

  const linhasFiltradas =
    useMemo(() => {
      return linhasBase.filter(
        (linha) => {
          const colaboradorOk =
            colaboradorFiltro ===
              "todos" ||
            linha.colaboradorId ===
              colaboradorFiltro;

          const situacaoOk =
            situacaoFiltro ===
              "todas" ||
            linha.situacao.toLowerCase() ===
              situacaoFiltro;

          return (
            colaboradorOk &&
            situacaoOk
          );
        }
      );
    }, [
      linhasBase,
      colaboradorFiltro,
      situacaoFiltro,
    ]);

  const resumo =
    useMemo(() => {
      return linhasFiltradas.reduce(
        (acc, linha) => {
          acc.producao +=
            linha.producao;

          acc.comissao +=
            linha.comissao;

          acc.bonificacao +=
            linha.bonificacao;

          acc.totalPagar +=
            linha.totalPagar;

          if (
            linha.situacao ===
            "Pago"
          ) {
            acc.totalPago +=
              linha.totalPagar;
          }

          if (
            linha.situacao ===
            "Pendente"
          ) {
            acc.totalPendente +=
              linha.totalPagar;
          }

          if (
            linha.situacao ===
            "Fechado"
          ) {
            acc.totalFechado +=
              linha.totalPagar;
          }

          return acc;
        },
        {
          producao: 0,
          comissao: 0,
          bonificacao: 0,
          totalPagar: 0,
          totalPago: 0,
          totalPendente: 0,
          totalFechado: 0,
        }
      );
    }, [linhasFiltradas]);

  const linhasPorColaborador =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          LinhaRelatorio
        >();

      for (const linha of linhasFiltradas) {
        const existente =
          mapa.get(
            linha.colaboradorId
          );

        if (!existente) {
          mapa.set(
            linha.colaboradorId,
            {
              ...linha,
              id: `colaborador-${linha.colaboradorId}`,
              resultados: [
                ...linha.resultados,
              ],
            }
          );

          continue;
        }

        existente.resultados.push(
          ...linha.resultados
        );

        existente.producao +=
          linha.producao;

        existente.comissao +=
          linha.comissao;

        existente.bonificacao +=
          linha.bonificacao;

        existente.totalPagar +=
          linha.totalPagar;

        existente.comissaoLiberacao +=
          linha.comissaoLiberacao;

        existente.comissaoReembolso +=
          linha.comissaoReembolso;

        existente.comissaoSeguro +=
          linha.comissaoSeguro;

        existente.comissaoAssistencia +=
          linha.comissaoAssistencia;

        /**
         * Em uma consolidação, mostramos
         * "Pendente" se houver algo pendente,
         * depois "Fechado" e somente "Pago"
         * quando todas as linhas estiverem pagas.
         */
        if (
          linha.situacao ===
          "Pendente"
        ) {
          existente.situacao =
            "Pendente";
        } else if (
          linha.situacao ===
            "Fechado" &&
          existente.situacao ===
            "Pago"
        ) {
          existente.situacao =
            "Fechado";
        }
      }

      return Array.from(
        mapa.values()
      );
    }, [linhasFiltradas]);

  function imprimirRelatorio() {
    const folha = document.querySelector(
      ".print-preview-sheet"
    ) as HTMLElement | null;

    if (!folha) {
      window.alert(
        "Abra a prévia do PDF antes de baixar o relatório."
      );
      return;
    }

    const janela = window.open(
      "",
      "_blank",
      "width=1200,height=800"
    );

    if (!janela) {
      window.alert(
        "O navegador bloqueou a janela de impressão. Permita pop-ups para este site."
      );
      return;
    }

    const orientacao =
      tipoRelatorio === "comissoes" ||
      tipoRelatorio === "lancamentos"
        ? "landscape"
        : "portrait";

    const estilos = Array.from(
      document.querySelectorAll(
        'link[rel="stylesheet"], style'
      )
    )
      .map((elemento) => elemento.outerHTML)
      .join("\n");

    const conteudo = folha.cloneNode(true) as HTMLElement;

    // Remove elementos que são úteis apenas na prévia da tela.
    conteudo.querySelectorAll(
      "button, [data-print-hide=\"true\"]"
    ).forEach((elemento) => elemento.remove());

    janela.document.open();
    janela.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${tituloRelatorio} - ${competencia}</title>
  ${estilos}
  <style>
    @page {
      size: A4 ${orientacao};
      margin: 10mm;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      width: 100%;
      min-height: 100%;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
    }

    .print-preview-sheet {
      width: 100% !important;
      max-width: none !important;
      min-height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      box-shadow: none !important;
    }

    .print-preview-sheet table {
      width: 100% !important;
      min-width: 0 !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      font-size: 8px !important;
    }

    .print-preview-sheet th,
    .print-preview-sheet td {
      padding: 5px 4px !important;
      font-size: 8px !important;
      line-height: 1.25 !important;
      overflow-wrap: anywhere !important;
      word-break: break-word !important;
    }

    .print-preview-sheet th {
      font-weight: 700 !important;
    }

    .print-preview-sheet tr {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .print-preview-sheet > div {
      max-width: none !important;
    }

    .print-preview-sheet .overflow-x-auto,
    .print-preview-sheet .overflow-hidden {
      overflow: visible !important;
    }

    @media print {
      body {
        overflow: visible !important;
      }
    }
  </style>
</head>
<body>
  ${conteudo.outerHTML}
</body>
</html>`);
    janela.document.close();

    janela.onload = () => {
      janela.focus();
      setTimeout(() => {
        janela.print();
        janela.close();
      }, 350);
    };
  }


  function abrirPreviaExcel() {
    setTipoPrevia("excel");
  }

  function abrirPreviaPdf() {
    setTipoPrevia("pdf");
  }

  function fecharPrevia() {
    setTipoPrevia(null);
  }

  async function exportarExcel() {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "XAMA Comissões";
      workbook.lastModifiedBy = "XAMA Comissões";

      const sheet = workbook.addWorksheet("Relatório", {
        pageSetup: {
          orientation: "landscape",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
        },
      });

      const orange = "F97316";
      const blue = "2563EB";
      const light = "F8FAFC";
      const border = "E2E8F0";

      sheet.mergeCells("A1:H1");
      sheet.getCell("A1").value = "XAMA COMISSÕES";
      sheet.getCell("A1").font = {
        bold: true, size: 18, color: { argb: "FFFFFFFF" },
      };
      sheet.getCell("A1").fill = {
        type: "pattern", pattern: "solid",
        fgColor: { argb: orange },
      };
      sheet.getCell("A1").alignment = {
        vertical: "middle", horizontal: "left",
      };
      sheet.getRow(1).height = 30;

      sheet.mergeCells("A2:H2");
      sheet.getCell("A2").value = tituloRelatorio;
      sheet.getCell("A2").font = { bold: true, size: 14 };

      sheet.mergeCells("A3:H3");
      sheet.getCell("A3").value =
        `Competência: ${competencia}`;
      sheet.getCell("A3").font = {
        size: 10, color: { argb: "64748B" },
      };

      sheet.mergeCells("A4:H4");
      sheet.getCell("A4").value =
        `Colaborador: ${
          colaboradorFiltro === "todos"
            ? "Todos os colaboradores"
            : colaboradorPorId.get(colaboradorFiltro)?.nome || "—"
        } | Situação: ${
          situacaoFiltro === "todas"
            ? "Todas"
            : situacaoFiltro
        }`;
      sheet.getCell("A4").font = {
        size: 10, color: { argb: "64748B" },
      };

      let row = 6;

      const styleHeader = (rowNumber: number, count: number) => {
        const header = sheet.getRow(rowNumber);
        header.height = 24;
        for (let col = 1; col <= count; col++) {
          const cell = header.getCell(col);
          cell.font = {
            bold: true, size: 10,
            color: { argb: "FFFFFFFF" },
          };
          cell.fill = {
            type: "pattern", pattern: "solid",
            fgColor: { argb: blue },
          };
          cell.border = {
            bottom: { style: "thin", color: { argb: border } },
          };
        }
      };

      const styleData = (rowNumber: number, count: number) => {
        for (let col = 1; col <= count; col++) {
          sheet.getRow(rowNumber).getCell(col).border = {
            bottom: { style: "hair", color: { argb: border } },
          };
        }
      };

      const moneyColumns = (
        rowNumber: number,
        columns: number[]
      ) => {
        for (const col of columns) {
          sheet.getCell(rowNumber, col).numFmt =
            '"R$" #,##0.00';
        }
      };

      if (tipoRelatorio === "resumo") {
        sheet.addRow(["Indicador", "Valor"]);
        styleHeader(row, 2);
        row++;

        const dados = [
          ["Produtividade", resumo.producao],
          ["Comissões", resumo.comissao],
          ["Bonificações", resumo.bonificacao],
          ["Total a pagar", resumo.totalPagar],
          ["Total pago", resumo.totalPago],
          ["Total fechado", resumo.totalFechado],
          ["Total pendente", resumo.totalPendente],
        ];

        for (const [nome, valor] of dados) {
          sheet.addRow([nome, valor]);
          styleData(row, 2);
          moneyColumns(row, [2]);
          row++;
        }

        sheet.addRow([]);
        row++;
        sheet.addRow(["Indicador", "Quantidade"]);
        styleHeader(row, 2);
        row++;

        const quantidades = [
          ["Linhas no relatório", linhasFiltradas.length],
          [
            "Colaboradores",
            new Set(linhasFiltradas.map((l) => l.colaboradorId)).size,
          ],
          [
            "Fechamentos",
            linhasFiltradas.filter((l) => l.tipo === "fechamento").length,
          ],
          [
            "Resultados pendentes",
            linhasFiltradas.filter((l) => l.tipo === "pendente").length,
          ],
        ];

        for (const item of quantidades) {
          sheet.addRow(item);
          styleData(row, 2);
          row++;
        }

        sheet.columns = [
          { width: 30 },
          { width: 22 },
        ];
      } else if (tipoRelatorio === "colaboradores") {
        sheet.addRow([
          "Colaborador", "Produtividade", "Comissão",
          "Bonificação", "Total a pagar", "Situação",
        ]);
        styleHeader(row, 6);
        row++;

        for (const linha of linhasPorColaborador) {
          sheet.addRow([
            linha.colaboradorNome,
            linha.producao,
            linha.comissao,
            linha.bonificacao,
            linha.totalPagar,
            linha.situacao,
          ]);
          styleData(row, 6);
          moneyColumns(row, [2, 3, 4, 5]);
          row++;
        }

        sheet.columns = [
          { width: 30 }, { width: 18 }, { width: 18 },
          { width: 18 }, { width: 20 }, { width: 16 },
        ];
      } else if (tipoRelatorio === "lancamentos") {
        sheet.addRow([
          "Colaborador", "Cliente / Grupo", "Competência",
          "Clientes", "Produtividade", "Seguro Finsol",
          "Prestamista", "Assistência", "Situação",
        ]);
        styleHeader(row, 9);
        row++;

        for (const linha of linhasFiltradas) {
          for (const resultado of linha.resultados) {
            sheet.addRow([
              linha.colaboradorNome,
              resultado.nomeCliente || "—",
              resultado.competencia,
              resultado.quantidadeClientes,
              resultado.produtividade || 0,
              resultado.seguroFinsol || 0,
              resultado.seguroPrestamista || 0,
              resultado.seguroAssistencia || 0,
              linha.situacao,
            ]);
            styleData(row, 9);
            moneyColumns(row, [5, 6, 7]);
            row++;
          }
        }

        sheet.columns = [
          { width: 30 }, { width: 18 }, { width: 18 },
          { width: 12 }, { width: 18 }, { width: 18 },
          { width: 16 }, { width: 14 }, { width: 16 },
        ];
      } else if (tipoRelatorio === "pagamentos") {
        sheet.addRow([
          "Colaborador", "Total", "Data do fechamento",
          "Data do pagamento", "Situação",
        ]);
        styleHeader(row, 5);
        row++;

        for (const linha of linhasFiltradas.filter(
          (item) => item.tipo === "fechamento"
        )) {
          sheet.addRow([
            linha.colaboradorNome,
            linha.totalPagar,
            linha.dataFechamento || "",
            linha.dataPagamento || "",
            linha.situacao,
          ]);
          styleData(row, 5);
          moneyColumns(row, [2]);
          row++;
        }

        sheet.columns = [
          { width: 30 }, { width: 20 }, { width: 22 },
          { width: 22 }, { width: 16 },
        ];
      } else {
        sheet.addRow([
          "Colaborador", "Liberação", "Reembolso", "Seguros",
          "Assistência", "Comissão", "Bonificação", "Total",
        ]);
        styleHeader(row, 8);
        row++;

        for (const linha of linhasFiltradas) {
          sheet.addRow([
            linha.colaboradorNome,
            linha.comissaoLiberacao,
            linha.comissaoReembolso,
            linha.comissaoSeguro,
            linha.comissaoAssistencia,
            linha.comissao,
            linha.bonificacao,
            linha.totalPagar,
          ]);
          styleData(row, 8);
          moneyColumns(row, [2, 3, 4, 5, 6, 7, 8]);
          row++;
        }

        sheet.columns = [
          { width: 30 }, { width: 18 }, { width: 18 },
          { width: 18 }, { width: 18 }, { width: 18 },
          { width: 18 }, { width: 18 },
        ];
      }

      sheet.views = [{ state: "frozen", ySplit: 5 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        `relatorio-${tipoRelatorio}-${competencia}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      window.alert(
        "Não foi possível gerar o arquivo Excel."
      );
    }
  }

  const tituloRelatorio =
    tipoRelatorio === "resumo"
      ? "Resumo financeiro"
      : tipoRelatorio ===
          "colaboradores"
        ? "Relatório por colaborador"
        : tipoRelatorio ===
            "lancamentos"
          ? "Relatório de lançamentos"
          : tipoRelatorio ===
              "pagamentos"
            ? "Relatório de pagamentos"
            : "Relatório de comissões";

  if (carregando) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-sm text-slate-500">
          Carregando relatórios...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#f97316]">
            Financeiro
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Relatórios
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Consulte os resultados, comissões,
            fechamentos e pagamentos da empresa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={abrirPreviaExcel}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Download size={16} />
            Exportar Excel
          </button>

          <button
            type="button"
            onClick={abrirPreviaPdf}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ea580c]"
          >
            <Printer size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <Filter
            size={17}
            className="text-[#f97316]"
          />

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Filtros
            </h2>

            <p className="text-xs text-slate-400">
              Defina o período e o tipo de
              informação que deseja consultar.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              Situação
            </label>

            <select
              value={situacaoFiltro}
              onChange={(event) =>
                setSituacaoFiltro(
                  event.target
                    .value as SituacaoFiltro
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
            >
              <option value="todas">
                Todas
              </option>
              <option value="pendente">
                Pendente
              </option>
              <option value="fechado">
                Fechado
              </option>
              <option value="pago">
                Pago
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-500">
              Tipo de relatório
            </label>

            <select
              value={tipoRelatorio}
              onChange={(event) =>
                setTipoRelatorio(
                  event.target
                    .value as TipoRelatorio
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
            >
              <option value="resumo">
                Resumo financeiro
              </option>
              <option value="colaboradores">
                Por colaborador
              </option>
              <option value="lancamentos">
                Lançamentos
              </option>
              <option value="pagamentos">
                Pagamentos
              </option>
              <option value="comissoes">
                Comissões
              </option>
            </select>
          </div>
        </div>
      </section>

      <section className="hidden print:block">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Financeiro
        </p>

        <h2 className="mt-1 text-xl font-bold text-slate-900">
          {tituloRelatorio}
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Competência: {competencia}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          icon={<BarChart3 size={19} />}
          label="Produtividade"
          valor={formatarMoeda(
            resumo.producao
          )}
          estilo="orange"
        />

        <ResumoCard
          icon={<FileBarChart size={19} />}
          label="Comissões"
          valor={formatarMoeda(
            resumo.comissao
          )}
          estilo="blue"
        />

        <ResumoCard
          icon={<CircleDollarSign size={19} />}
          label="Bonificações"
          valor={formatarMoeda(
            resumo.bonificacao
          )}
          estilo="green"
        />

        <ResumoCard
          icon={<Wallet size={19} />}
          label="Total a pagar"
          valor={formatarMoeda(
            resumo.totalPagar
          )}
          estilo="purple"
        />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-400">
            Total pago
          </p>
          <p className="mt-1 text-lg font-bold text-green-700">
            {formatarMoeda(
              resumo.totalPago
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-400">
            Total fechado
          </p>
          <p className="mt-1 text-lg font-bold text-blue-700">
            {formatarMoeda(
              resumo.totalFechado
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-400">
            Total pendente
          </p>
          <p className="mt-1 text-lg font-bold text-orange-600">
            {formatarMoeda(
              resumo.totalPendente
            )}
          </p>
        </div>
      </section>

      {tipoRelatorio === "resumo" && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center gap-2">
              <FileText
                size={18}
                className="text-[#f97316]"
              />

              <div>
                <h2 className="font-semibold text-slate-900">
                  Resumo financeiro
                </h2>

                <p className="text-xs text-slate-400">
                  Visão geral da competência
                  selecionada.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">
                Linhas no relatório
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {linhasFiltradas.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">
                Colaboradores
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {
                  new Set(
                    linhasFiltradas.map(
                      (linha) =>
                        linha.colaboradorId
                    )
                  ).size
                }
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">
                Fechamentos
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {
                  linhasFiltradas.filter(
                    (linha) =>
                      linha.tipo ===
                      "fechamento"
                  ).length
                }
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">
                Resultados pendentes
              </p>
              <p className="mt-1 text-xl font-bold text-orange-600">
                {
                  linhasFiltradas.filter(
                    (linha) =>
                      linha.tipo ===
                      "pendente"
                  ).length
                }
              </p>
            </div>
          </div>
        </section>
      )}

      {tipoRelatorio ===
        "colaboradores" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center gap-2">
              <Users
                size={18}
                className="text-[#f97316]"
              />

              <div>
                <h2 className="font-semibold text-slate-900">
                  Relatório por colaborador
                </h2>
                <p className="text-xs text-slate-400">
                  Consolidado de todas as
                  linhas da competência.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Colaborador
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Produtividade
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Comissão
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Bonificação
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Total
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Situação
                  </th>
                </tr>
              </thead>

              <tbody>
                {linhasPorColaborador.map(
                  (linha) => (
                    <tr
                      key={linha.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {
                            linha.colaboradorNome
                          }
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {
                            linha.resultados
                              .length
                          }{" "}
                          lançamento(s)
                        </p>
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
                        <SituacaoBadge
                          situacao={
                            linha.situacao
                          }
                        />
                      </td>
                    </tr>
                  )
                )}

                {linhasPorColaborador.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-slate-400"
                    >
                      Nenhum dado encontrado
                      para os filtros
                      selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tipoRelatorio ===
        "lancamentos" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900">
              Relatório de lançamentos
            </h2>
            <p className="text-xs text-slate-400">
              Detalhamento dos resultados
              registrados na competência.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Colaborador
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Cliente / Grupo
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Competência
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Clientes
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Produtividade
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Seguro Finsol
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Prestamista
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Assistência
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Situação
                  </th>
                </tr>
              </thead>

              <tbody>
                {linhasFiltradas.flatMap(
                  (linha) =>
                    linha.resultados.map(
                      (resultado) => (
                        <tr
                          key={`${linha.id}-${resultado.id}`}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                            {
                              linha.colaboradorNome
                            }
                          </td>

                          <td className="px-5 py-4 text-sm font-medium text-slate-700">
                            {resultado.nomeCliente || "—"}
                          </td>

                  <td className="px-5 py-4 text-xs text-slate-500">
                    {resultado.competencia}
                  </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {
                              resultado.quantidadeClientes
                            }
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                            {formatarMoeda(
                              resultado.produtividade ||
                                0
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {formatarMoeda(
                              resultado.seguroFinsol || 0
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {formatarMoeda(
                              resultado.seguroPrestamista || 0
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {resultado.seguroAssistencia ?? 0}
                          </td>

                          <td className="px-5 py-4">
                            <SituacaoBadge
                              situacao={
                                linha.situacao
                              }
                            />
                          </td>
                        </tr>
                      )
                    )
                )}

                {linhasFiltradas.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm text-slate-400"
                    >
                      Nenhum lançamento
                      encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tipoRelatorio ===
        "pagamentos" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900">
              Relatório de pagamentos
            </h2>
            <p className="text-xs text-slate-400">
              Controle dos fechamentos e das
              datas em que foram pagos.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Colaborador
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Total
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Data fechamento
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Data pagamento
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Situação
                  </th>
                </tr>
              </thead>

              <tbody>
                {linhasFiltradas
                  .filter(
                    (linha) =>
                      linha.tipo ===
                      "fechamento"
                  )
                  .map((linha) => (
                    <tr
                      key={linha.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {
                          linha.colaboradorNome
                        }
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-slate-900">
                        {formatarMoeda(
                          linha.totalPagar
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatarData(
                          linha.dataFechamento
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatarData(
                          linha.dataPagamento
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <SituacaoBadge
                          situacao={
                            linha.situacao
                          }
                        />
                      </td>
                    </tr>
                  ))}

                {linhasFiltradas.filter(
                  (linha) =>
                    linha.tipo ===
                    "fechamento"
                ).length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm text-slate-400"
                    >
                      Nenhum fechamento
                      encontrado para os
                      filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tipoRelatorio ===
        "comissoes" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900">
              Relatório de comissões
            </h2>
            <p className="text-xs text-slate-400">
              Detalhamento dos componentes da
              comissão calculada.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Colaborador
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Liberação
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Reembolso
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Seguros
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Assistência
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Comissão
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Bonificação
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {linhasFiltradas.map(
                  (linha) => (
                    <tr
                      key={linha.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {
                          linha.colaboradorNome
                        }
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatarMoeda(
                          linha.comissaoLiberacao
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatarMoeda(
                          linha.comissaoReembolso
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatarMoeda(
                          linha.comissaoSeguro
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatarMoeda(
                          linha.comissaoAssistencia
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
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
                    </tr>
                  )
                )}

                {linhasFiltradas.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-sm text-slate-400"
                    >
                      Nenhuma comissão
                      encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="hidden print:block">
        <p className="mt-6 text-[10px] text-slate-400">
          Relatório emitido pelo sistema.
        </p>
      </div>

      {tipoPrevia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-previa-relatorio"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharPrevia();
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#f97316]">
                  {tipoPrevia === "pdf"
                    ? "Prévia do PDF"
                    : "Prévia para Excel"}
                </p>
                <h2
                  id="titulo-previa-relatorio"
                  className="mt-1 text-lg font-bold text-slate-900"
                >
                  {tituloRelatorio}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Competência: {competencia}
                  {" · "}
                  {tipoRelatorio === "colaboradores"
                    ? `${linhasPorColaborador.length} colaborador(es)`
                    : `${linhasFiltradas.length} linha(s)`}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharPrevia}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-50"
                aria-label="Fechar prévia"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4 sm:p-6">
              <div
                className={
                  `print-preview-sheet ${
                    tipoPrevia === "pdf"
                    ? tipoRelatorio === "comissoes" ||
                      tipoRelatorio === "lancamentos"
                      ? "mx-auto min-h-[794px] w-full max-w-[1123px] bg-white px-6 py-7 shadow-md sm:px-8"
                      : "mx-auto min-h-[1123px] w-full max-w-[794px] bg-white px-7 py-8 shadow-md sm:px-10"
                    : "mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  }`
                }
              >
                {tipoPrevia === "pdf" && (
                  <div className="mb-6 border-b border-slate-200 pb-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Relatório financeiro
                        </p>
                        <h3 className="mt-1 text-xl font-bold text-slate-900">
                          {tituloRelatorio}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Competência: {competencia}
                        </p>
                      </div>

                      <div className="text-right text-[10px] text-slate-400">
                        <p>Documento para impressão</p>
                        <p className="mt-1">
                          Gerado pelo sistema
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {tipoRelatorio === "resumo" && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-[10px] text-slate-400">Produtividade</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {formatarMoeda(resumo.producao)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-[10px] text-slate-400">Comissões</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {formatarMoeda(resumo.comissao)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-[10px] text-slate-400">Bonificações</p>
                        <p className="mt-1 text-sm font-bold text-green-600">
                          {formatarMoeda(resumo.bonificacao)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-[10px] text-slate-400">Total a pagar</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {formatarMoeda(resumo.totalPagar)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border border-slate-100 p-3">
                        <p className="text-[10px] text-slate-400">Total pago</p>
                        <p className="mt-1 text-sm font-bold text-green-700">
                          {formatarMoeda(resumo.totalPago)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-100 p-3">
                        <p className="text-[10px] text-slate-400">Total fechado</p>
                        <p className="mt-1 text-sm font-bold text-blue-700">
                          {formatarMoeda(resumo.totalFechado)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-100 p-3">
                        <p className="text-[10px] text-slate-400">Total pendente</p>
                        <p className="mt-1 text-sm font-bold text-orange-600">
                          {formatarMoeda(resumo.totalPendente)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-100 p-3">
                        <p className="text-[10px] text-slate-400">Linhas</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {linhasFiltradas.length}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {tipoRelatorio === "colaboradores" && (
                  <div className="w-full overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full table-fixed text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          {["Colaborador", "Produtividade", "Comissão", "Bonificação", "Total", "Situação"].map((titulo) => (
                            <th key={titulo} className="px-2 py-2 text-[9px] font-semibold break-words text-slate-500">
                              {titulo}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {linhasPorColaborador.map((linha) => (
                          <tr key={`previa-col-${linha.id}`} className="border-b border-slate-100 last:border-0">
                            <td className="px-4 py-3">
                              <p className="text-xs font-semibold text-slate-900">{linha.colaboradorNome}</p>
                              <p className="text-[10px] text-slate-400">{linha.resultados.length} lançamento(s)</p>
                            </td>
                            <td className="px-2 py-2 text-[9px] break-words">{formatarMoeda(linha.producao)}</td>
                            <td className="px-2 py-2 text-[9px] break-words">{formatarMoeda(linha.comissao)}</td>
                            <td className="px-2 py-2 text-[9px] font-semibold break-words text-green-600">{formatarMoeda(linha.bonificacao)}</td>
                            <td className="px-2 py-2 text-[9px] font-bold break-words">{formatarMoeda(linha.totalPagar)}</td>
                            <td className="px-4 py-3"><SituacaoBadge situacao={linha.situacao} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {tipoRelatorio === "lancamentos" && (
                  <div className="w-full overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full table-fixed text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          {["Colaborador", "Cliente / Grupo", "Competência", "Clientes", "Produtividade", "Seguro Finsol", "Prestamista", "Assistência", "Situação"].map((titulo) => (
                            <th key={titulo} className="px-2 py-2 text-[9px] font-semibold break-words text-slate-500">{titulo}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {linhasFiltradas.flatMap((linha) =>
                          linha.resultados.map((resultado) => (
                            <tr key={`previa-lanc-${linha.id}-${resultado.id}`} className="border-b border-slate-100 last:border-0">
                              <td className="px-2 py-2 text-[9px] font-semibold break-words">{linha.colaboradorNome}</td>
                              <td className="px-2 py-2 text-[9px] break-words text-slate-700">{resultado.nomeCliente || "—"}</td>
                              <td className="px-2 py-2 text-[9px] break-words">{resultado.competencia}</td>
                              <td className="px-2 py-2 text-[9px] break-words">{resultado.quantidadeClientes ?? 0}</td>
                              <td className="px-2 py-2 text-[9px] break-words">{formatarMoeda(resultado.produtividade || 0)}</td>
                              <td className="px-2 py-2 text-[9px] break-words">{formatarMoeda(resultado.seguroFinsol || 0)}</td>
                              <td className="px-2 py-2 text-[9px] break-words">{formatarMoeda(resultado.seguroPrestamista || 0)}</td>
                              <td className="px-2 py-2 text-[9px] break-words">{resultado.seguroAssistencia ?? 0}</td>
                              <td className="px-4 py-3"><SituacaoBadge situacao={linha.situacao} /></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {tipoRelatorio === "pagamentos" && (
                  <div className="w-full overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full table-fixed text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          {["Colaborador", "Total", "Data fechamento", "Data pagamento", "Situação"].map((titulo) => (
                            <th key={titulo} className="px-2 py-2 text-[9px] font-semibold break-words text-slate-500">{titulo}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {linhasFiltradas.filter((linha) => linha.tipo === "fechamento").map((linha) => (
                          <tr key={`previa-pag-${linha.id}`} className="border-b border-slate-100 last:border-0">
                            <td className="px-2 py-2 text-[9px] font-semibold break-words">{linha.colaboradorNome}</td>
                            <td className="px-2 py-2 text-[9px] font-bold break-words">{formatarMoeda(linha.totalPagar)}</td>
                            <td className="px-2 py-2 text-[9px] break-words">{formatarData(linha.dataFechamento)}</td>
                            <td className="px-2 py-2 text-[9px] break-words">{formatarData(linha.dataPagamento)}</td>
                            <td className="px-4 py-3"><SituacaoBadge situacao={linha.situacao} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {tipoRelatorio === "comissoes" && (
                  <div className="w-full overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full table-fixed text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          {["Colaborador", "Liberação", "Reembolso", "Seguros", "Assistência", "Comissão", "Bonificação", "Total", "Situação"].map((titulo) => (
                            <th key={titulo} className="px-2 py-2 text-[9px] font-semibold break-words text-slate-500">{titulo}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {linhasFiltradas.map((linha) => (
                          <tr key={`previa-com-${linha.id}`} className="border-b border-slate-100 last:border-0">
                            <td className="px-2 py-2 text-[9px] font-semibold break-words">{linha.colaboradorNome}</td>
                            <td className="px-2 py-2 text-[9px] break-words">{formatarMoeda(linha.comissaoLiberacao)}</td>
                            <td className="px-2 py-2 text-[9px] break-words">{formatarMoeda(linha.comissaoReembolso)}</td>
                            <td className="px-2 py-2 text-[9px] break-words">{formatarMoeda(linha.comissaoSeguro)}</td>
                            <td className="px-2 py-2 text-[9px] break-words">{formatarMoeda(linha.comissaoAssistencia)}</td>
                            <td className="px-2 py-2 text-[9px] break-words">{formatarMoeda(linha.comissao)}</td>
                            <td className="px-2 py-2 text-[9px] font-semibold break-words text-green-600">{formatarMoeda(linha.bonificacao)}</td>
                            <td className="px-2 py-2 text-[9px] font-bold break-words">{formatarMoeda(linha.totalPagar)}</td>
                            <td className="px-4 py-3"><SituacaoBadge situacao={linha.situacao} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={fecharPrevia}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Voltar
              </button>

              <div className="flex flex-wrap justify-end gap-2">
                {tipoPrevia === "excel" ? (
                  <button
                    type="button"
                    onClick={exportarExcel}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-4 text-sm font-semibold text-white hover:bg-[#ea580c]"
                  >
                    <Download size={16} />
                    Baixar Excel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={imprimirRelatorio}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-4 text-sm font-semibold text-white hover:bg-[#ea580c]"
                  >
                    <Printer size={16} />
                    Baixar PDF
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
