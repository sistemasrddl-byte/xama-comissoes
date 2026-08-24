"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Mail,
  Phone,
  Save,
  Target,
  UserRound,
} from "lucide-react";

import { criarColaborador } from "@/lib/colaboradores";

function formatarCPF(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 3) {
    return numeros;
  }

  if (numeros.length <= 6) {
    return numeros.replace(
      /(\d{3})(\d+)/,
      "$1.$2"
    );
  }

  if (numeros.length <= 9) {
    return numeros.replace(
      /(\d{3})(\d{3})(\d+)/,
      "$1.$2.$3"
    );
  }

  return numeros.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    "$1.$2.$3-$4"
  );
}

function formatarTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 2) {
    return numeros.length > 0
      ? `(${numeros}`
      : "";
  }

  if (numeros.length <= 7) {
    return numeros.replace(
      /(\d{2})(\d+)/,
      "($1) $2"
    );
  }

  return numeros.replace(
    /(\d{2})(\d{5})(\d{1,4})/,
    "($1) $2-$3"
  );
}

function formatarMoeda(valor: string) {
  const numeros = valor.replace(/\D/g, "");

  if (!numeros) {
    return "";
  }

  const numero = Number(numeros) / 100;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function converterMoedaParaNumero(valor: string) {
  const numeros = valor.replace(/\D/g, "");

  if (!numeros) {
    return 0;
  }

  return Number(numeros) / 100;
}

export default function NovoColaboradorPage() {
  const router = useRouter();

  const [primeiroNome, setPrimeiroNome] =
    useState("");
  const [sobrenome, setSobrenome] =
    useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState("");
  const [cargo, setCargo] = useState("");
  const [metaMensal, setMetaMensal] = useState("");
  const [ativo, setAtivo] = useState(true);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");

    if (!primeiroNome.trim()) {
      setErro("Informe o primeiro nome do colaborador.");
      return;
    }

    if (!sobrenome.trim()) {
      setErro("Informe o sobrenome do colaborador.");
      return;
    }

    const meta = converterMoedaParaNumero(metaMensal);

    if (meta <= 0) {
      setErro("Informe uma meta mensal válida.");
      return;
    }

    try {
      setSalvando(true);

      await criarColaborador({
        nome: `${primeiroNome.trim()} ${sobrenome.trim()}`.trim(),
        primeiroNome: primeiroNome.trim(),
        sobrenome: sobrenome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        cpf: cpf.trim(),
        dataAdmissao,
        cargo: cargo.trim(),
        metaMensal: meta,
        ativo,
      });

      router.push("/admin/colaboradores");
    } catch (error) {
      console.error(
        "Erro ao cadastrar colaborador:",
        error
      );

      setErro(
        "Não foi possível cadastrar o colaborador. Tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Cabeçalho */}
      <div>
        <Link
          href="/admin/colaboradores"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#ea580c]"
        >
          <ArrowLeft size={17} />
          Voltar para colaboradores
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-[#f97316]">
            Equipe
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Novo colaborador
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Cadastre os dados do colaborador.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Dados pessoais */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Dados pessoais
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Informações básicas do colaborador.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Primeiro nome */}
            <div>
              <label
                htmlFor="primeiroNome"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Primeiro nome *
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="primeiroNome"
                  type="text"
                  value={primeiroNome}
                  onChange={(event) =>
                    setPrimeiroNome(event.target.value)
                  }
                  placeholder="Digite o primeiro nome"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>

            {/* Sobrenome */}
            <div>
              <label
                htmlFor="sobrenome"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Sobrenome *
              </label>

              <input
                id="sobrenome"
                type="text"
                value={sobrenome}
                onChange={(event) =>
                  setSobrenome(event.target.value)
                }
                placeholder="Digite o sobrenome"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            {/* CPF */}
            <div>
              <label
                htmlFor="cpf"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                CPF
              </label>

              <input
                id="cpf"
                type="text"
                inputMode="numeric"
                maxLength={14}
                value={cpf}
                onChange={(event) =>
                  setCpf(formatarCPF(event.target.value))
                }
                placeholder="000.000.000-00"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            {/* Data de admissão */}
            <div>
              <label
                htmlFor="dataAdmissao"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Data de admissão
              </label>

              <div className="relative">
                <CalendarDays
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="dataAdmissao"
                  type="date"
                  value={dataAdmissao}
                  onChange={(event) =>
                    setDataAdmissao(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Contato e função */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Contato e função
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Informações profissionais do colaborador.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* E-mail */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                E-mail
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="colaborador@email.com"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label
                htmlFor="telefone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Telefone
              </label>

              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="telefone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={15}
                  value={telefone}
                  onChange={(event) =>
                    setTelefone(
                      formatarTelefone(
                        event.target.value
                      )
                    )
                  }
                  placeholder="(00) 00000-0000"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>

            {/* Cargo */}
            <div>
              <label
                htmlFor="cargo"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Cargo / função
              </label>

              <div className="relative">
                <BriefcaseBusiness
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="cargo"
                  type="text"
                  value={cargo}
                  onChange={(event) =>
                    setCargo(event.target.value)
                  }
                  placeholder="Ex.: Agente de crédito"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>

            {/* Meta mensal */}
            <div>
              <label
                htmlFor="metaMensal"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Meta mensal
              </label>

              <div className="relative">
                <Target
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="metaMensal"
                  type="text"
                  inputMode="decimal"
                  value={metaMensal}
                  onChange={(event) =>
                    setMetaMensal(
                      formatarMoeda(
                        event.target.value
                      )
                    )
                  }
                  placeholder="R$ 0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>

              <p className="mt-1.5 text-[11px] text-slate-400">
                Informe o valor da meta mensal em reais.
              </p>
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Status do colaborador
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Colaboradores ativos poderão participar dos
                lançamentos e cálculos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAtivo(!ativo)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                ativo
                  ? "bg-[#f97316]"
                  : "bg-slate-300"
              }`}
              aria-label="Alternar status"
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                  ativo ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="mt-4">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                ativo
                  ? "bg-green-50 text-green-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {ativo
                ? "Colaborador ativo"
                : "Colaborador inativo"}
            </span>
          </div>
        </section>

        {/* Erro */}
        {erro && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {erro}
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/admin/colaboradores"
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
              : "Salvar colaborador"}
          </button>
        </div>
      </form>
    </div>
  );
}