"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  X,
} from "lucide-react";

interface FecharComissaoDialogProps {
  aberto: boolean;
  onClose: () => void;
  onConfirmar: () => void;
  nomeColaborador: string;
  competencia: string;
  producao: number;
  totalComissao: number;
  totalBonificacao: number;
  totalPagar: number;
  salvando?: boolean;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function FecharComissaoDialog({
  aberto,
  onClose,
  onConfirmar,
  nomeColaborador,
  competencia,
  producao,
  totalComissao,
  totalBonificacao,
  totalPagar,
  salvando = false,
}: FecharComissaoDialogProps) {
  if (!aberto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Fundo */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={salvando ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#f97316]">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Fechar comissão
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Confira os valores antes de confirmar o fechamento.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Identificação */}
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
          <p className="text-sm font-bold text-slate-800">
            {nomeColaborador}
          </p>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <CalendarDays size={13} />

            <span>
              Competência: {competencia}
            </span>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {/* Aviso */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Confirme o fechamento
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  Ao confirmar, os valores atuais serão registrados no fechamento desta competência.
                </p>
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="mt-5 space-y-3">
            <ResumoLinha
              titulo="Produção Finsol"
              valor={formatarMoeda(producao)}
            />

            <ResumoLinha
              titulo="Total de comissões"
              valor={formatarMoeda(
                totalComissao
              )}
            />

            <ResumoLinha
              titulo="Bonificação"
              valor={formatarMoeda(
                totalBonificacao
              )}
              destaque
            />
          </div>

          {/* Total */}
          <div className="mt-5 rounded-2xl bg-[#f97316] p-5 text-white shadow-lg shadow-orange-500/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <CircleDollarSign size={21} />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Total a fechar
                  </p>

                  <p className="mt-1 text-xs text-orange-100">
                    Comissão + bonificação
                  </p>
                </div>
              </div>

              <p className="text-xl font-bold sm:text-2xl">
                {formatarMoeda(totalPagar)}
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            className="h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={salvando}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Fechando...
              </>
            ) : (
              <>
                <CheckCircle2 size={17} />
                Confirmar fechamento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResumoLinha({
  titulo,
  valor,
  destaque = false,
}: {
  titulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <span
        className={`text-sm ${
          destaque
            ? "font-semibold text-green-700"
            : "text-slate-500"
        }`}
      >
        {titulo}
      </span>

      <span
        className={`text-sm font-bold ${
          destaque
            ? "text-green-700"
            : "text-slate-800"
        }`}
      >
        {valor}
      </span>
    </div>
  );
}