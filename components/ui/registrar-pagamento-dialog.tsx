"use client";
import React from "react";

import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  X,
} from "lucide-react";

interface RegistrarPagamentoDialogProps {
  aberto: boolean;
  onClose: () => void;
  onConfirmar: (dataPagamento: string) => void;

  nomeColaborador: string;
  competencia: string;

  totalPagar: number;
  dataFechamento?: string;

  salvando?: boolean;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function RegistrarPagamentoDialog({
  aberto,
  onClose,
  onConfirmar,
  nomeColaborador,
  competencia,
  totalPagar,
  dataFechamento,
  salvando = false,
}: RegistrarPagamentoDialogProps) {
  const hoje = new Date();

  const dataAtual =
    `${hoje.getFullYear()}-${String(
      hoje.getMonth() + 1
    ).padStart(2, "0")}-${String(
      hoje.getDate()
    ).padStart(2, "0")}`;

  const [dataPagamento, setDataPagamento] =
    React.useState(dataAtual);

  React.useEffect(() => {
    if (aberto) {
      setDataPagamento(dataAtual);
    }
  }, [aberto, dataAtual]);

  if (!aberto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Fundo */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={
          salvando ? undefined : onClose
        }
      />

      {/* Dialog */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CircleDollarSign size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Registrar pagamento
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Informe a data em que o pagamento foi realizado.
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
          {/* Total */}
          <div className="rounded-2xl bg-[#f97316] p-5 text-white shadow-lg shadow-orange-500/20">
            <p className="text-xs font-medium text-orange-100">
              Total a pagar
            </p>

            <p className="mt-1 text-2xl font-bold">
              {formatarMoeda(totalPagar)}
            </p>

            <div className="mt-4 border-t border-white/20 pt-3">
              <p className="text-xs text-orange-100">
                Data do fechamento
              </p>

              <p className="mt-1 text-sm font-semibold">
                {dataFechamento
                  ? new Date(
                      `${dataFechamento}T12:00:00`
                    ).toLocaleDateString(
                      "pt-BR"
                    )
                  : "Não informada"}
              </p>
            </div>
          </div>

          {/* Data do pagamento */}
          <div className="mt-5">
            <label
              htmlFor="data-pagamento"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Data do pagamento
            </label>

            <div className="relative">
              <CalendarDays
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="data-pagamento"
                type="date"
                value={dataPagamento}
                onChange={(event) =>
                  setDataPagamento(
                    event.target.value
                  )
                }
                disabled={salvando}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Se o pagamento aconteceu em outra data, altere o campo acima.
            </p>
          </div>

          {/* Aviso */}
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-green-600"
              />

              <div>
                <p className="text-sm font-semibold text-green-800">
                  Pagamento será registrado
                </p>

                <p className="mt-1 text-xs leading-5 text-green-700">
                  Após confirmar, este fechamento passará de{" "}
                  <strong>Fechado</strong> para{" "}
                  <strong>Pago</strong>.
                </p>
              </div>
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
            onClick={() =>
              onConfirmar(dataPagamento)
            }
            disabled={
              salvando || !dataPagamento
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Registrando...
              </>
            ) : (
              <>
                <CheckCircle2 size={17} />
                Registrar pagamento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}