"use client";

import {
  Calculator,
  CircleDollarSign,
  X,
} from "lucide-react";

import {
  RegrasComissao,
} from "@/lib/configuracoes-comissoes";

import {
  Resultado,
} from "@/lib/resultados";

interface ComissaoDialogProps {
  aberto: boolean;
  onClose: () => void;
  nomeColaborador: string;
  competencia: string;
  resultados: Resultado[];
  regras: RegrasComissao;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarPercentual(valor: number) {
  return `${valor
    .toFixed(2)
    .replace(".", ",")}%`;
}

export default function ComissaoDialog({
  aberto,
  onClose,
  nomeColaborador,
  competencia,
  resultados,
  regras,
}: ComissaoDialogProps) {
  if (!aberto) {
    return null;
  }

  const resumo = resultados.reduce(
    (acc, resultado) => {
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

      acc.producao +=
        resultado.producaoFinsol || 0;

      acc.reembolso +=
        resultado.previsaoReembolso || 0;

      acc.seguro +=
        resultado.seguroFinsol || 0;

      acc.clientes +=
        resultado.quantidadeClientes || 0;

      acc.comissaoLiberacao +=
        comissaoLiberacao;

      acc.bonificacaoLiberacao +=
        bonificacaoLiberacao;

      acc.comissaoReembolso +=
        comissaoReembolso;

      acc.comissaoSeguro +=
        comissaoSeguro;

      acc.comissaoAssistencia +=
        comissaoAssistencia;

      return acc;
    },
    {
      producao: 0,
      reembolso: 0,
      seguro: 0,
      clientes: 0,
      comissaoLiberacao: 0,
      bonificacaoLiberacao: 0,
      comissaoReembolso: 0,
      comissaoSeguro: 0,
      comissaoAssistencia: 0,
    }
  );

  const totalComissao =
    resumo.comissaoLiberacao +
    resumo.comissaoReembolso +
    resumo.comissaoSeguro +
    resumo.comissaoAssistencia;

  const totalPagar =
    totalComissao +
    resumo.bonificacaoLiberacao;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Fundo */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#f97316]">
              <Calculator size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Detalhamento da comissão
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Confira como o valor foi calculado.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Informações */}
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
          <p className="text-sm font-bold text-slate-800">
            {nomeColaborador}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Competência: {competencia}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-3">
            {/* Liberação */}
            <DetalheLinha
              titulo="Comissão por liberação"
              descricao={`${formatarMoeda(
                resumo.producao
              )} × ${formatarPercentual(
                regras.liberacaoPercentual
              )}`}
              valor={formatarMoeda(
                resumo.comissaoLiberacao
              )}
            />

            {/* Reembolso */}
            <DetalheLinha
              titulo="Comissão por reembolso"
              descricao={`${formatarMoeda(
                resumo.reembolso
              )} × ${formatarPercentual(
                regras.reembolsoPercentual
              )}`}
              valor={formatarMoeda(
                resumo.comissaoReembolso
              )}
            />

            {/* Seguro */}
            <DetalheLinha
              titulo="Comissão por seguros"
              descricao={`${formatarMoeda(
                resumo.seguro
              )} × ${formatarPercentual(
                regras.seguroPercentual
              )}`}
              valor={formatarMoeda(
                resumo.comissaoSeguro
              )}
            />

            {/* Assistência */}
            <DetalheLinha
              titulo="Comissão por assistência"
              descricao={`${resumo.clientes} cliente(s) × ${formatarMoeda(
                regras.assistenciaValorPorCliente
              )}`}
              valor={formatarMoeda(
                resumo.comissaoAssistencia
              )}
            />
          </div>

          {/* Total das comissões */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Total de comissões
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Soma das quatro comissões.
                </p>
              </div>

              <p className="text-lg font-bold text-slate-900">
                {formatarMoeda(
                  totalComissao
                )}
              </p>
            </div>
          </div>

          {/* Bonificação */}
          <div className="mt-3 rounded-xl border border-green-200 bg-green-50/70 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Bonificação sobre liberação
                </p>

                <p className="mt-1 text-xs text-green-600">
                  {formatarMoeda(
                    resumo.comissaoLiberacao
                  )}{" "}
                  ×{" "}
                  {formatarPercentual(
                    regras.bonificacaoLiberacaoPercentual
                  )}
                </p>
              </div>

              <p className="text-lg font-bold text-green-700">
                {formatarMoeda(
                  resumo.bonificacaoLiberacao
                )}
              </p>
            </div>
          </div>

          {/* Total final */}
          <div className="mt-4 rounded-2xl bg-[#f97316] p-5 text-white shadow-lg shadow-orange-500/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <CircleDollarSign size={21} />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Total a pagar
                  </p>

                  <p className="mt-1 text-xs text-orange-100">
                    Comissões + bonificação
                  </p>
                </div>
              </div>

              <p className="text-xl font-bold sm:text-2xl">
                {formatarMoeda(
                  totalPagar
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function DetalheLinha({
  titulo,
  descricao,
  valor,
}: {
  titulo: string;
  descricao: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700">
            {titulo}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {descricao}
          </p>
        </div>

        <p className="shrink-0 text-sm font-bold text-slate-900">
          {valor}
        </p>
      </div>
    </div>
  );
}