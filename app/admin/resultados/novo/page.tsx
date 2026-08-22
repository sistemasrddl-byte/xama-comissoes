"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Save,
  ShieldCheck,
  Target,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

import {
  criarResultado,
  SituacaoResultado,
} from "@/lib/resultados";

import {
  Colaborador,
  observarColaboradores,
} from "@/lib/colaboradores";

function formatarMoeda(valor: string) {
  const numeros = valor.replace(/\D/g, "");

  if (!numeros) return "";

  return (Number(numeros) / 100).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function converterMoeda(valor: string) {
  const numeros = valor.replace(/\D/g, "");

  if (!numeros) return 0;

  return Number(numeros) / 100;
}

function numero(valor: string) {
  const n = Number(valor);

  if (Number.isNaN(n) || n < 0) {
    return 0;
  }

  return n;
}

export default function NovoResultadoPage() {
  const router = useRouter();

  const [colaboradores, setColaboradores] =
    useState<Colaborador[]>([]);

  const [colaboradorId, setColaboradorId] =
    useState("");

  const [competencia, setCompetencia] =
    useState("2026-08");

  const [situacao, setSituacao] =
    useState<SituacaoResultado>(
      "Grupo Desembolsado"
    );

  const [dataDesembolso, setDataDesembolso] =
    useState("");

  const [vencimento, setVencimento] =
    useState("");

  const [nomeCliente, setNomeCliente] =
    useState("");

  const [quantidadeClientes, setQuantidadeClientes] =
    useState("1");

  const [renovados, setRenovados] =
    useState("0");

  const [retorno, setRetorno] =
    useState("0");

  const [novos, setNovos] =
    useState("0");

  const [evasao, setEvasao] =
    useState("0");

  const [producaoFinsol, setProducaoFinsol] =
    useState("");

  const [seguroFinsol, setSeguroFinsol] =
    useState("");

  const [seguroAssistencia, setSeguroAssistencia] =
    useState("");

  const [previsaoReembolso, setPrevisaoReembolso] =
    useState("");

  const [propostaFormalizada, setPropostaFormalizada] =
    useState("0");

  const [segurosVendidos, setSegurosVendidos] =
    useState("0");

  const [observacoes, setObservacoes] =
    useState("");

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] = useState("");

  useEffect(() => {
    const unsubscribe =
      observarColaboradores((dados) => {
        setColaboradores(
          dados.filter(
            (colaborador) => colaborador.ativo
          )
        );
      });

    return () => unsubscribe();
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");

    if (!colaboradorId) {
      setErro("Selecione o colaborador.");
      return;
    }

    if (!competencia) {
      setErro("Informe a competência.");
      return;
    }

    if (!nomeCliente.trim()) {
      setErro(
        "Informe o nome do cliente ou grupo."
      );
      return;
    }

    try {
      setSalvando(true);

      await criarResultado({
        colaboradorId,
        competencia,

        situacao,

        dataDesembolso,
        vencimento,

        nomeCliente: nomeCliente.trim(),

        quantidadeClientes:
          numero(quantidadeClientes),

        renovados: numero(renovados),

        retorno: numero(retorno),

        novos: numero(novos),

        evasao: numero(evasao),

        producaoFinsol:
          converterMoeda(producaoFinsol),

        seguroFinsol:
          converterMoeda(seguroFinsol),

        seguroAssistencia:
          converterMoeda(
            seguroAssistencia
          ),

        previsaoReembolso:
          converterMoeda(
            previsaoReembolso
          ),

        propostaFormalizada:
          numero(propostaFormalizada),

        segurosVendidos:
          numero(segurosVendidos),

        observacoes:
          observacoes.trim(),
      });

      router.push("/admin/resultados");
    } catch (error) {
      console.error(
        "Erro ao salvar resultado:",
        error
      );

      setErro(
        "Não foi possível salvar o resultado."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Cabeçalho */}
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
            Desempenho
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Novo resultado
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Registre uma operação do colaborador.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Identificação */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Identificação
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Defina a competência e o colaborador.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Colaborador *
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={colaboradorId}
                  onChange={(event) =>
                    setColaboradorId(
                      event.target.value
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                >
                  <option value="">
                    Selecione o colaborador
                  </option>

                  {colaboradores.map(
                    (colaborador) => (
                      <option
                        key={colaborador.id}
                        value={colaborador.id}
                      >
                        {colaborador.nome}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Competência *
              </label>

              <div className="relative">
                <CalendarDays
                  size={18}
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
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Operação */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Operação
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Informações do grupo ou cliente.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Situação
              </label>

              <select
                value={situacao}
                onChange={(event) =>
                  setSituacao(
                    event.target
                      .value as SituacaoResultado
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
              >
                <option value="Grupo Desembolsado">
                  Grupo Desembolsado
                </option>

                <option value="Grupo em Atraso">
                  Grupo em Atraso
                </option>

                <option value="Grupo Evadido">
                  Grupo Evadido
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nome do cliente / grupo *
              </label>

              <div className="relative">
                <Users
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={nomeCliente}
                  onChange={(event) =>
                    setNomeCliente(
                      event.target.value
                    )
                  }
                  placeholder="Nome do cliente ou grupo"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Data do desembolso
              </label>

              <input
                type="date"
                value={dataDesembolso}
                onChange={(event) =>
                  setDataDesembolso(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Vencimento
              </label>

              <input
                type="date"
                value={vencimento}
                onChange={(event) =>
                  setVencimento(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
              />
            </div>
          </div>
        </section>

        {/* Indicadores de clientes */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Indicadores de clientes
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Quantidades utilizadas nos indicadores.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <CampoNumero
              label="Nº clientes"
              value={quantidadeClientes}
              setValue={setQuantidadeClientes}
            />

            <CampoNumero
              label="Renovados"
              value={renovados}
              setValue={setRenovados}
            />

            <CampoNumero
              label="Retorno"
              value={retorno}
              setValue={setRetorno}
            />

            <CampoNumero
              label="Novos"
              value={novos}
              setValue={setNovos}
            />

            <CampoNumero
              label="Evasão"
              value={evasao}
              setValue={setEvasao}
            />
          </div>

          <div className="mt-5 rounded-xl bg-orange-50 p-4">
            <p className="text-xs font-medium text-orange-700">
              Incremento de clientes
            </p>

            <p className="mt-1 text-lg font-bold text-orange-800">
              {numero(retorno) +
                numero(novos) -
                numero(evasao)}
            </p>

            <p className="mt-1 text-[11px] text-orange-600">
              Retorno + Novos − Evasão
            </p>
          </div>
        </section>

        {/* Produção */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Produção e seguros
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Valores financeiros da operação.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <CampoMoeda
              label="Produção Finsol"
              value={producaoFinsol}
              setValue={setProducaoFinsol}
              icon={<Target size={18} />}
            />

            <CampoMoeda
              label="Seguro Finsol"
              value={seguroFinsol}
              setValue={setSeguroFinsol}
              icon={<ShieldCheck size={18} />}
            />

            <CampoMoeda
              label="Seguro assistência"
              value={seguroAssistencia}
              setValue={setSeguroAssistencia}
              icon={<ShieldCheck size={18} />}
            />

            <CampoMoeda
              label="Previsão de reembolso"
              value={previsaoReembolso}
              setValue={setPrevisaoReembolso}
              icon={<Wallet size={18} />}
            />

            <CampoNumero
              label="Proposta formalizada"
              value={propostaFormalizada}
              setValue={setPropostaFormalizada}
            />

            <CampoNumero
              label="Seguros vendidos"
              value={segurosVendidos}
              setValue={setSegurosVendidos}
            />
          </div>
        </section>

        {/* Observações */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Observações
          </label>

          <textarea
            value={observacoes}
            onChange={(event) =>
              setObservacoes(
                event.target.value
              )
            }
            rows={4}
            placeholder="Observações sobre a operação..."
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
          />
        </section>

        {erro && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {erro}
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/admin/resultados"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={salvando}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />

            {salvando
              ? "Salvando..."
              : "Salvar resultado"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CampoNumero({
  label,
  value,
  setValue,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-600">
        {label}
      </label>

      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(event) =>
          setValue(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
      />
    </div>
  );
}

function CampoMoeda({
  label,
  value,
  setValue,
  icon,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-600">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}

        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) =>
            setValue(
              formatarMoeda(
                event.target.value
              )
            )
          }
          placeholder="R$ 0,00"
          className={`h-11 w-full rounded-xl border border-slate-200 bg-white pr-3 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10 ${
            icon ? "pl-10" : "pl-3"
          }`}
        />
      </div>
    </div>
  );
}