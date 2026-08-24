"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

import {
  Colaborador,
  atualizarColaborador,
  observarColaborador,
} from "@/lib/colaboradores";

function formatarCPF(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 3) return numeros;

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

  if (!numeros) return "";

  if (numeros.length <= 2) {
    return `(${numeros}`;
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

  if (!numeros) return "";

  const numero = Number(numeros) / 100;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function converterMoedaParaNumero(valor: string) {
  const numeros = valor.replace(/\D/g, "");

  if (!numeros) return 0;

  return Number(numeros) / 100;
}

function validarCPF(cpf: string) {
  const numeros = cpf.replace(/\D/g, "");

  if (numeros.length !== 11) {
    return false;
  }

  if (/^(\d)\1+$/.test(numeros)) {
    return false;
  }

  let soma = 0;

  for (let i = 0; i < 9; i++) {
    soma += Number(numeros[i]) * (10 - i);
  }

  let resto = (soma * 10) % 11;

  if (resto === 10) {
    resto = 0;
  }

  if (resto !== Number(numeros[9])) {
    return false;
  }

  soma = 0;

  for (let i = 0; i < 10; i++) {
    soma += Number(numeros[i]) * (11 - i);
  }

  resto = (soma * 10) % 11;

  if (resto === 10) {
    resto = 0;
  }

  return resto === Number(numeros[10]);
}

export default function EditarColaboradorPage() {
  const params = useParams();
  const router = useRouter();

  const id = String(params.id);

  const [colaborador, setColaborador] =
    useState<Colaborador | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [primeiroNome, setPrimeiroNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState("");
  const [cargo, setCargo] = useState("");
  const [metaMensal, setMetaMensal] = useState("");
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = observarColaborador(
      id,
      (dados) => {
        setColaborador(dados);

        if (dados) {
          const nomeCompleto = dados.nome?.trim() || "";
          const partesNome = nomeCompleto.split(/\s+/).filter(Boolean);

          setPrimeiroNome(
            dados.primeiroNome?.trim() ||
              partesNome[0] ||
              ""
          );

          setSobrenome(
            dados.sobrenome?.trim() ||
              partesNome.slice(1).join(" ") ||
              ""
          );

          setEmail(dados.email);
          setTelefone(dados.telefone);
          setCpf(dados.cpf);
          setDataAdmissao(dados.dataAdmissao);
          setCargo(dados.cargo);
          setMetaMensal(
            dados.metaMensal
              ? dados.metaMensal.toLocaleString(
                  "pt-BR",
                  {
                    style: "currency",
                    currency: "BRL",
                  }
                )
              : ""
          );
          setAtivo(dados.ativo);
        }

        setCarregando(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");

    if (!primeiroNome.trim()) {
      setErro("Informe o primeiro nome do colaborador.");
      return;
    }

    if (cpf && !validarCPF(cpf)) {
      setErro("Informe um CPF válido.");
      return;
    }

    const meta = converterMoedaParaNumero(
      metaMensal
    );

    if (meta <= 0) {
      setErro("Informe uma meta mensal válida.");
      return;
    }

    try {
      setSalvando(true);

      const nomeCompleto = [primeiroNome.trim(), sobrenome.trim()]
        .filter(Boolean)
        .join(" ");

      await atualizarColaborador(id, {
        nome: nomeCompleto,
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

      router.push(
        `/admin/colaboradores/${id}`
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar colaborador:",
        error
      );

      setErro(
        "Não foi possível atualizar o colaborador."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-400">
          Carregando colaborador...
        </p>
      </div>
    );
  }

  if (!colaborador) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-slate-500">
          Colaborador não encontrado.
        </p>

        <Link
          href="/admin/colaboradores"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#ea580c]"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/admin/colaboradores/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#ea580c]"
        >
          <ArrowLeft size={17} />
          Voltar para o colaborador
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-[#f97316]">
            Equipe
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Editar colaborador
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Atualize os dados de {colaborador.nome}.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Dados pessoais
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Informações básicas.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Primeiro nome */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Primeiro nome *
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={primeiroNome}
                  onChange={(e) =>
                    setPrimeiroNome(e.target.value)
                  }
                  placeholder="Ex.: João"
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>

            {/* Sobrenome */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Sobrenome
              </label>

              <input
                value={sobrenome}
                onChange={(e) =>
                  setSobrenome(e.target.value)
                }
                placeholder="Ex.: da Silva"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            {/* CPF */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                CPF
              </label>

              <input
                value={cpf}
                inputMode="numeric"
                maxLength={14}
                onChange={(e) =>
                  setCpf(
                    formatarCPF(e.target.value)
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            {/* Data de admissão */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Data de admissão
              </label>

              <div className="relative">
                <CalendarDays
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="date"
                  value={dataAdmissao}
                  onChange={(e) =>
                    setDataAdmissao(
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Contato e função
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                E-mail
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Telefone
              </label>

              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={telefone}
                  inputMode="numeric"
                  maxLength={15}
                  onChange={(e) =>
                    setTelefone(
                      formatarTelefone(
                        e.target.value
                      )
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Cargo / função
              </label>

              <div className="relative">
                <BriefcaseBusiness
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={cargo}
                  onChange={(e) =>
                    setCargo(e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Meta mensal
              </label>

              <div className="relative">
                <Target
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={metaMensal}
                  inputMode="decimal"
                  onChange={(e) =>
                    setMetaMensal(
                      formatarMoeda(
                        e.target.value
                      )
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Status
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Define se o colaborador está ativo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAtivo(!ativo)}
              className={`relative h-6 w-11 rounded-full ${
                ativo
                  ? "bg-[#f97316]"
                  : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow ${
                  ativo ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <span
            className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              ativo
                ? "bg-green-50 text-green-600"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {ativo
              ? "Colaborador ativo"
              : "Colaborador inativo"}
          </span>
        </section>

        {erro && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {erro}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href={`/admin/colaboradores/${id}`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={salvando}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-[#ea580c] disabled:opacity-60"
          >
            <Save size={18} />

            {salvando
              ? "Salvando..."
              : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}