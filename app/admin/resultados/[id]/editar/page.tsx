"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Save,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

import {
  atualizarResultado,
  buscarResultado,
  NovoResultado,
  Resultado,
  SituacaoResultado,
} from "@/lib/resultados";

import {
  Colaborador,
  observarColaboradores,
} from "@/lib/colaboradores";

function formatarMoedaInput(valor: number) {
  if (!valor) return "";

  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function moedaParaNumero(valor: string) {
  if (!valor) return 0;

  const limpo = valor
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const numero = Number(limpo);

  return Number.isNaN(numero) ? 0 : numero;
}

function aplicarMascaraMoeda(
  valor: string
) {
  const somenteNumeros = valor.replace(
    /\D/g,
    ""
  );

  if (!somenteNumeros) {
    return "";
  }

  const numero =
    Number(somenteNumeros) / 100;

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function aplicarMascaraNumero(
  valor: string
) {
  return valor.replace(/\D/g, "");
}

export default function EditarResultadoPage() {
  const params = useParams();
  const router = useRouter();

  const id =
    typeof params.id === "string"
      ? params.id
      : "";

  const [colaboradores, setColaboradores] =
    useState<Colaborador[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] = useState("");

  const [formulario, setFormulario] =
    useState({
      colaboradorId: "",
      competencia: "",
      situacao:
        "Grupo Desembolsado" as SituacaoResultado,

      dataDesembolso: "",
      vencimento: "",

      nomeCliente: "",

      quantidadeClientes: "0",
      renovados: "0",
      retorno: "0",
      novos: "0",
      evasao: "0",

      producaoFinsol: "",
      seguroFinsol: "",
      seguroAssistencia: "",

      previsaoReembolso: "",

      propostaFormalizada: "0",
      segurosVendidos: "0",

      observacoes: "",
    });

  useEffect(() => {
    if (!id) return;

    let cancelado = false;

    async function carregar() {
      try {
        setCarregando(true);
        setErro("");

        const resultado =
          await buscarResultado(id);

        if (cancelado) return;

        if (!resultado) {
          setErro(
            "Resultado não encontrado."
          );

          setCarregando(false);
          return;
        }

        setFormulario({
          colaboradorId:
            resultado.colaboradorId || "",

          competencia:
            resultado.competencia || "",

          situacao:
            resultado.situacao ||
            "Grupo Desembolsado",

          dataDesembolso:
            resultado.dataDesembolso || "",

          vencimento:
            resultado.vencimento || "",

          nomeCliente:
            resultado.nomeCliente || "",

          quantidadeClientes: String(
            resultado.quantidadeClientes || 0
          ),

          renovados: String(
            resultado.renovados || 0
          ),

          retorno: String(
            resultado.retorno || 0
          ),

          novos: String(
            resultado.novos || 0
          ),

          evasao: String(
            resultado.evasao || 0
          ),

          producaoFinsol:
            formatarMoedaInput(
              resultado.producaoFinsol
            ),

          seguroFinsol:
            formatarMoedaInput(
              resultado.seguroFinsol
            ),

          seguroAssistencia:
            formatarMoedaInput(
              resultado.seguroAssistencia
            ),

          previsaoReembolso:
            formatarMoedaInput(
              resultado.previsaoReembolso
            ),

          propostaFormalizada: String(
            resultado.propostaFormalizada || 0
          ),

          segurosVendidos: String(
            resultado.segurosVendidos || 0
          ),

          observacoes:
            resultado.observacoes || "",
        });

        setCarregando(false);
      } catch (error) {
        console.error(
          "Erro ao carregar resultado:",
          error
        );

        if (!cancelado) {
          setErro(
            "Não foi possível carregar o resultado."
          );

          setCarregando(false);
        }
      }
    }

    carregar();

    const unsubscribe =
      observarColaboradores((dados) => {
        if (!cancelado) {
          setColaboradores(dados);
        }
      });

    return () => {
      cancelado = true;
      unsubscribe();
    };
  }, [id]);

  function atualizarCampo(
    campo: string,
    valor: string
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function salvar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!id) return;

    try {
      setSalvando(true);
      setErro("");

      if (!formulario.colaboradorId) {
        setErro(
          "Selecione o colaborador."
        );

        setSalvando(false);
        return;
      }

      if (!formulario.nomeCliente.trim()) {
        setErro(
          "Informe o nome do cliente ou grupo."
        );

        setSalvando(false);
        return;
      }

      const dados: NovoResultado = {
        colaboradorId:
          formulario.colaboradorId,

        competencia:
          formulario.competencia,

        situacao:
          formulario.situacao,

        dataDesembolso:
          formulario.dataDesembolso,

        vencimento:
          formulario.vencimento,

        nomeCliente:
          formulario.nomeCliente.trim(),

        quantidadeClientes:
          Number(
            formulario.quantidadeClientes
          ) || 0,

        renovados:
          Number(formulario.renovados) || 0,

        retorno:
          Number(formulario.retorno) || 0,

        novos:
          Number(formulario.novos) || 0,

        evasao:
          Number(formulario.evasao) || 0,

        producaoFinsol:
          moedaParaNumero(
            formulario.producaoFinsol
          ),

        seguroFinsol:
          moedaParaNumero(
            formulario.seguroFinsol
          ),

        seguroAssistencia:
          moedaParaNumero(
            formulario.seguroAssistencia
          ),

        previsaoReembolso:
          moedaParaNumero(
            formulario.previsaoReembolso
          ),

        propostaFormalizada:
          Number(
            formulario.propostaFormalizada
          ) || 0,

        segurosVendidos:
          Number(
            formulario.segurosVendidos
          ) || 0,

        observacoes:
          formulario.observacoes.trim(),
      };

      await atualizarResultado(
        id,
        dados
      );

      router.push(
        `/admin/resultados/${id}`
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar resultado:",
        error
      );

      setErro(
        "Não foi possível salvar as alterações."
      );

      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#f97316]" />

          <p className="mt-3 text-sm text-slate-500">
            Carregando resultado...
          </p>
        </div>
      </div>
    );
  }

  if (erro && !formulario.nomeCliente) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin/resultados"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#ea580c]"
        >
          <ArrowLeft size={17} />
          Voltar para resultados
        </Link>

        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-700">
            {erro}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={salvar}
      className="mx-auto max-w-5xl space-y-6 pb-8"
    >
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/admin/resultados/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#ea580c]"
          >
            <ArrowLeft size={17} />
            Voltar para resultado
          </Link>

          <div className="mt-5">
            <p className="text-sm font-semibold text-[#f97316]">
              Desempenho
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Editar resultado
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Altere os dados deste lançamento.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={salvando}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={18} />

          {salvando
            ? "Salvando..."
            : "Salvar alterações"}
        </button>
      </div>

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {erro}
        </div>
      )}

      {/* Identificação */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionTitle
          icon={<UserRound size={18} />}
          title="Identificação"
          description="Defina o colaborador e a competência do resultado."
        />

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Colaborador" required>
            <select
              value={formulario.colaboradorId}
              onChange={(event) =>
                atualizarCampo(
                  "colaboradorId",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="">
                Selecione o colaborador
              </option>

              {colaboradores
                .filter(
                  (colaborador) =>
                    colaborador.ativo ||
                    colaborador.id ===
                      formulario.colaboradorId
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
          </Field>

          <Field label="Competência" required>
            <input
              type="month"
              value={formulario.competencia}
              onChange={(event) =>
                atualizarCampo(
                  "competencia",
                  event.target.value
                )
              }
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Operação */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionTitle
          icon={<CalendarDays size={18} />}
          title="Operação"
          description="Informações principais da operação realizada."
        />

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Situação" required>
            <select
              value={formulario.situacao}
              onChange={(event) =>
                atualizarCampo(
                  "situacao",
                  event.target.value
                )
              }
              className={inputClass}
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
          </Field>

          <Field
            label="Nome do cliente / grupo"
            required
          >
            <input
              type="text"
              value={formulario.nomeCliente}
              onChange={(event) =>
                atualizarCampo(
                  "nomeCliente",
                  event.target.value
                )
              }
              placeholder="Nome do cliente ou grupo"
              className={inputClass}
            />
          </Field>

          <Field
            label="Data do desembolso"
            required
          >
            <input
              type="date"
              value={formulario.dataDesembolso}
              onChange={(event) =>
                atualizarCampo(
                  "dataDesembolso",
                  event.target.value
                )
              }
              className={inputClass}
            />
          </Field>

          <Field
            label="Vencimento"
            required
          >
            <input
              type="date"
              value={formulario.vencimento}
              onChange={(event) =>
                atualizarCampo(
                  "vencimento",
                  event.target.value
                )
              }
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Indicadores */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionTitle
          icon={<Users size={18} />}
          title="Indicadores de clientes"
          description="Informe os números relacionados aos clientes."
        />

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <NumberField
            label="Clientes"
            value={
              formulario.quantidadeClientes
            }
            onChange={(value) =>
              atualizarCampo(
                "quantidadeClientes",
                aplicarMascaraNumero(value)
              )
            }
          />

          <NumberField
            label="Renovados"
            value={formulario.renovados}
            onChange={(value) =>
              atualizarCampo(
                "renovados",
                aplicarMascaraNumero(value)
              )
            }
          />

          <NumberField
            label="Retorno"
            value={formulario.retorno}
            onChange={(value) =>
              atualizarCampo(
                "retorno",
                aplicarMascaraNumero(value)
              )
            }
          />

          <NumberField
            label="Novos"
            value={formulario.novos}
            onChange={(value) =>
              atualizarCampo(
                "novos",
                aplicarMascaraNumero(value)
              )
            }
          />

          <NumberField
            label="Evasão"
            value={formulario.evasao}
            onChange={(value) =>
              atualizarCampo(
                "evasao",
                aplicarMascaraNumero(value)
              )
            }
          />
        </div>
      </section>

      {/* Produção */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionTitle
          icon={<Wallet size={18} />}
          title="Produção e valores"
          description="Valores financeiros registrados no resultado."
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MoneyField
            label="Produção Finsol"
            value={
              formulario.producaoFinsol
            }
            onChange={(value) =>
              atualizarCampo(
                "producaoFinsol",
                aplicarMascaraMoeda(value)
              )
            }
          />

          <MoneyField
            label="Seguro Finsol"
            value={formulario.seguroFinsol}
            onChange={(value) =>
              atualizarCampo(
                "seguroFinsol",
                aplicarMascaraMoeda(value)
              )
            }
          />

          <MoneyField
            label="Seguro assistência"
            value={
              formulario.seguroAssistencia
            }
            onChange={(value) =>
              atualizarCampo(
                "seguroAssistencia",
                aplicarMascaraMoeda(value)
              )
            }
          />

          <MoneyField
            label="Previsão de reembolso"
            value={
              formulario.previsaoReembolso
            }
            onChange={(value) =>
              atualizarCampo(
                "previsaoReembolso",
                aplicarMascaraMoeda(value)
              )
            }
          />
        </div>
      </section>

      {/* Outros indicadores */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionTitle
          icon={<FileText size={18} />}
          title="Outros indicadores"
          description="Informações complementares do lançamento."
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Propostas formalizadas"
            value={
              formulario.propostaFormalizada
            }
            onChange={(value) =>
              atualizarCampo(
                "propostaFormalizada",
                aplicarMascaraNumero(value)
              )
            }
          />

          <NumberField
            label="Seguros vendidos"
            value={
              formulario.segurosVendidos
            }
            onChange={(value) =>
              atualizarCampo(
                "segurosVendidos",
                aplicarMascaraNumero(value)
              )
            }
          />
        </div>
      </section>

      {/* Observações */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionTitle
          icon={<FileText size={18} />}
          title="Observações"
          description="Informações adicionais do lançamento."
        />

        <textarea
          value={formulario.observacoes}
          onChange={(event) =>
            atualizarCampo(
              "observacoes",
              event.target.value
            )
          }
          rows={5}
          placeholder="Digite observações..."
          className="mt-5 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
        />
      </section>

      {/* Ações */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/admin/resultados/${id}`}
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
            : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10";

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-500">
        {label}

        {required && (
          <span className="ml-1 text-[#f97316]">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-500">
        {label}
      </label>

      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={inputClass}
      />
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-500">
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
          R$
        </span>

        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder="0,00"
          className={`${inputClass} pl-10`}
        />
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#f97316]">
        {icon}
      </div>

      <div>
        <h2 className="font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}