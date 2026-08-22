"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  Target,
  UserRound,
} from "lucide-react";

import {
  Colaborador,
  observarColaboradores,
} from "@/lib/colaboradores";

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = observarColaboradores((dados) => {
      setColaboradores(dados);
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  const colaboradoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return colaboradores;
    }

    return colaboradores.filter((colaborador) => {
      return (
        colaborador.nome.toLowerCase().includes(termo) ||
        colaborador.email.toLowerCase().includes(termo) ||
        colaborador.cpf.toLowerCase().includes(termo)
      );
    });
  }, [colaboradores, busca]);

  const ativos = colaboradores.filter(
    (colaborador) => colaborador.ativo
  ).length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#f97316]">
            Equipe
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Colaboradores
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Cadastre e acompanhe os colaboradores da empresa.
          </p>
        </div>

        <Link
          href="/admin/colaboradores/novo"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#ea580c]"
        >
          <Plus size={18} />
          Novo colaborador
        </Link>
      </div>

      {/* Indicadores */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#f97316]">
              <Users size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Total de colaboradores
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {colaboradores.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <UserRound size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Colaboradores ativos
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {ativos}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Barra de pesquisa */}
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar colaborador..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-[#f97316] focus:bg-white focus:ring-4 focus:ring-orange-500/10"
            />
          </div>
        </div>

        {/* Carregando */}
        {carregando && (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-slate-400">
              Carregando colaboradores...
            </p>
          </div>
        )}

        {/* Nenhum colaborador */}
        {!carregando && colaboradoresFiltrados.length === 0 && (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users size={26} />
            </div>

            <h2 className="mt-4 text-sm font-semibold text-slate-700">
              {busca
                ? "Nenhum colaborador encontrado"
                : "Nenhum colaborador cadastrado"}
            </h2>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
              {busca
                ? "Tente pesquisar usando outro nome, e-mail ou CPF."
                : "Comece cadastrando o primeiro colaborador da empresa."}
            </p>

            {!busca && (
              <Link
                href="/admin/colaboradores/novo"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#f97316] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#ea580c]"
              >
                <Plus size={17} />
                Cadastrar colaborador
              </Link>
            )}
          </div>
        )}

        {/* Desktop */}
        {!carregando && colaboradoresFiltrados.length > 0 && (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Colaborador
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Contato
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Cargo
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Meta mensal
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {colaboradoresFiltrados.map((colaborador) => (
                    <tr
                    key={colaborador.id}
                    onClick={() =>
                      window.location.href = `/admin/colaboradores/${colaborador.id}`
                    }
                    className="cursor-pointer border-b border-slate-100 transition hover:bg-orange-50/30 last:border-0"
                  >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-bold text-[#ea580c]">
                            {colaborador.nome
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {colaborador.nome}
                            </p>

                            <p className="text-xs text-slate-400">
                              {colaborador.cpf || "CPF não informado"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Mail size={13} />
                            {colaborador.email || "Não informado"}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone size={13} />
                            {colaborador.telefone || "Não informado"}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {colaborador.cargo || "Não informado"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Target
                            size={15}
                            className="text-slate-400"
                          />

                          <span className="text-sm font-semibold text-slate-700">
                            {colaborador.metaMensal.toLocaleString(
                              "pt-BR",
                              {
                                style: "currency",
                                currency: "BRL",
                              }
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            colaborador.ativo
                              ? "bg-green-50 text-green-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {colaborador.ativo
                            ? "Ativo"
                            : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-slate-100 md:hidden">
              {colaboradoresFiltrados.map((colaborador) => (
                <div
              key={colaborador.id}
              onClick={() =>
                window.location.href = `/admin/colaboradores/${colaborador.id}`
              }
              className="cursor-pointer p-4 transition hover:bg-orange-50/30"
            >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 font-bold text-[#ea580c]">
                      {colaborador.nome
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {colaborador.nome}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {colaborador.cargo || "Sem cargo"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            colaborador.ativo
                              ? "bg-green-50 text-green-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {colaborador.ativo
                            ? "Ativo"
                            : "Inativo"}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Mail size={13} />
                          <span className="truncate">
                            {colaborador.email ||
                              "E-mail não informado"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Phone size={13} />
                          {colaborador.telefone ||
                            "Telefone não informado"}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Target size={13} />
                          Meta:{" "}
                          <strong className="text-slate-700">
                            {colaborador.metaMensal.toLocaleString(
                              "pt-BR",
                              {
                                style: "currency",
                                currency: "BRL",
                              }
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}