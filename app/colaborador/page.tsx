"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  CircleDollarSign,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  FileText,
  LogOut,
  Users,
  Wallet,
} from "lucide-react";


import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth } from "@/lib/firebase";
import { getUserProfile, UserProfile } from "@/lib/user";
import {
  observarResultadosDoColaborador,
  Resultado,
} from "@/lib/resultados";
import {
  observarFechamentosDoColaborador,
  Fechamento,
} from "@/lib/fechamentos";
import {
  buscarRegrasComissao,
  regrasComissaoPadrao,
  RegrasComissao,
} from "@/lib/configuracoes-comissoes";

function obterCompetenciaAtual() {
  const hoje = new Date();

  return new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    1
  );
}

function formatarCompetencia(data: Date) {
  const texto = data.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function obterChaveCompetencia(data: Date) {
  return `${data.getFullYear()}-${String(
    data.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data?: string) {
  if (!data) return "—";

  const partes = data.split("-");

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
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
    (resultado.quantidadeClientes || 0) *
    regras.assistenciaValorPorCliente;

  const totalComissao =
    comissaoLiberacao +
    comissaoReembolso +
    comissaoSeguro +
    comissaoAssistencia;

    

  return {
    comissaoSeguroFinsol,
    comissaoSeguroPrestamista,
    comissaoSeguro,
    totalComissao,
    bonificacaoLiberacao,
    totalPagar:
      totalComissao + bonificacaoLiberacao,
  };
}

function obterSituacao(fechamento?: Fechamento) {
  if (!fechamento) {
    return {
      label: "Pendente",
      className:
        "bg-amber-50 text-amber-700",
      icon: Clock3,
    };
  }

  if (fechamento.situacao === "Pago") {
    return {
      label: "Pago",
      className:
        "bg-green-50 text-green-700",
      icon: CheckCircle2,
    };
  }

  return {
    label: "Fechado",
    className:
      "bg-blue-50 text-blue-700",
    icon: CheckCircle2,
  };
}

const FRASES_MOTIVACIONAIS = [
  "Seu esforço de hoje constrói os resultados de amanhã.",
  "Cada conquista começa com a decisão de continuar.",
  "Pequenos avanços também são grandes conquistas.",
  "Disciplina transforma metas em resultados.",
  "Seu trabalho faz a diferença todos os dias.",
  "Persistência é o caminho entre o objetivo e a conquista.",
  "Acredite no seu potencial e continue avançando!",
  "Um bom resultado começa com uma atitude positiva.",
];

function obterSaudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function obterFraseDoDia() {
  const hoje = new Date();
  const inicioDoAno = new Date(hoje.getFullYear(), 0, 1);
  const diaDoAno = Math.floor(
    (hoje.getTime() - inicioDoAno.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return FRASES_MOTIVACIONAIS[
    diaDoAno % FRASES_MOTIVACIONAIS.length
  ];
}

export default function ColaboradorPage() {
  const router = useRouter();

  const [menuUsuarioAberto, setMenuUsuarioAberto] =
    useState(false);

  const perfilMenuRef = useRef<HTMLDivElement | null>(null);

  const [perfil, setPerfil] =
    useState<UserProfile | null>(null);

  const [resultados, setResultados] =
    useState<Resultado[]>([]);

  const [fechamentos, setFechamentos] =
    useState<Fechamento[]>([]);

  const [regras, setRegras] =
    useState<RegrasComissao>(
      regrasComissaoPadrao
    );

  const [carregando, setCarregando] =
    useState(true);

  // A competência começa no mês atual e pode ser navegada
  // livremente para meses anteriores ou posteriores.
  const [competenciaSelecionada, setCompetenciaSelecionada] =
    useState<Date>(() => obterCompetenciaAtual());

    const cancelarResultadosRef =
  useRef<(() => void) | null>(null);

const cancelarFechamentosRef =
  useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!menuUsuarioAberto) return;

    function fecharAoClicarFora(event: MouseEvent) {
      const alvo = event.target as Node;

      if (
        perfilMenuRef.current &&
        !perfilMenuRef.current.contains(alvo)
      ) {
        setMenuUsuarioAberto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      fecharAoClicarFora
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharAoClicarFora
      );
    };
  }, [menuUsuarioAberto]);

  useEffect(() => {
    if (!menuUsuarioAberto) return;

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuUsuarioAberto(false);
      }
    }

    document.addEventListener(
      "keydown",
      fecharComEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        fecharComEscape
      );
    };
  }, [menuUsuarioAberto]);

  useEffect(() => {
    

    const cancelarAuth =
      onAuthStateChanged(
        auth,
        async (usuario) => {
          if (!usuario) {
            setPerfil(null);
            setCarregando(false);
            return;
          }

          try {
            const perfilAtual =
              await getUserProfile(
                usuario.uid
              );

            if (
              !perfilAtual ||
              perfilAtual.role !==
                "colaborador" ||
              !perfilAtual.ativo ||
              !perfilAtual.colaboradorId
            ) {
              setPerfil(null);
              setCarregando(false);
              return;
            }

            setPerfil(perfilAtual);

            // Os dados são filtrados imediatamente pelo
            // colaborador vinculado ao usuário.
            cancelarResultadosRef.current =
  observarResultadosDoColaborador(
    perfilAtual.colaboradorId,
    (dados) => {
      setResultados(dados);
      setCarregando(false);
    }
  );

cancelarFechamentosRef.current =
  observarFechamentosDoColaborador(
    perfilAtual.colaboradorId,
    (dados) => {
      setFechamentos(dados);
    }
  );

            try {
              const regrasSalvas =
                await buscarRegrasComissao();

              setRegras(regrasSalvas);
            } catch {
              setRegras(
                regrasComissaoPadrao
              );
            }
          } catch (error) {
            console.error(
              "Erro ao carregar área do colaborador:",
              error
            );

            setPerfil(null);
            setCarregando(false);
          }
        }
      );

    return () => {
  cancelarAuth();

  cancelarResultadosRef.current?.();
  cancelarFechamentosRef.current?.();

  cancelarResultadosRef.current = null;
  cancelarFechamentosRef.current = null;
};
  }, []);

  const competenciaAtual = useMemo(
    () => obterChaveCompetencia(competenciaSelecionada),
    [competenciaSelecionada]
  );

  const resultadosDaCompetencia =
    useMemo(() => {
      return resultados.filter(
        (resultado) =>
          resultado.competencia ===
          competenciaAtual
      );
    }, [resultados, competenciaAtual]);

  const fechamentosDaCompetencia =
    useMemo(() => {
      return fechamentos.filter(
        (fechamento) =>
          fechamento.competencia ===
          competenciaAtual
      );
    }, [fechamentos, competenciaAtual]);

  const fechamentoPorResultadoId =
    useMemo(() => {
      const mapa = new Map<
        string,
        Fechamento
      >();

      fechamentosDaCompetencia.forEach(
        (fechamento) => {
          const ids =
            Array.isArray(
              fechamento.resultadoIds
            )
              ? fechamento.resultadoIds
              : [];

          ids.forEach((resultadoId) => {
            mapa.set(
              resultadoId,
              fechamento
            );
          });
        }
      );

      return mapa;
    }, [fechamentosDaCompetencia]);

  const resumo =
    useMemo(() => {
      let producao = 0;
      let comissao = 0;
      let bonificacao = 0;
      let totalPagar = 0;
      let totalPago = 0;
      let totalFechado = 0;
      let totalPendente = 0;

      resultadosDaCompetencia.forEach(
        (resultado) => {
          producao +=
            resultado.produtividade || 0;

          const calculo =
            calcularComissao(
              resultado,
              regras
            );

          const fechamento =
            fechamentoPorResultadoId.get(
              resultado.id
            );

          if (fechamento) {
            comissao +=
              fechamento.totalComissao || 0;

            bonificacao +=
              fechamento.totalBonificacao ||
              0;

            totalPagar +=
              fechamento.totalPagar || 0;

            if (
              fechamento.situacao ===
              "Pago"
            ) {
              totalPago +=
                fechamento.totalPagar || 0;
            } else {
              totalFechado +=
                fechamento.totalPagar || 0;
            }

            return;
          }

          comissao +=
            calculo.totalComissao;

          bonificacao +=
            calculo.bonificacaoLiberacao;

          totalPagar +=
            calculo.totalPagar;

          totalPendente +=
            calculo.totalPagar;
        }
      );

      return {
        producao,
        comissao,
        bonificacao,
        totalPagar,
        totalPago,
        totalFechado,
        totalPendente,
      };
    }, [
      resultadosDaCompetencia,
      fechamentoPorResultadoId,
      regras,
    ]);

  if (carregando) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-[#f97316]">
            Área do colaborador
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Meu Dashboard
          </h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-400">
            Carregando seus dados...
          </p>
        </div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-[#f97316]">
            Área do colaborador
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Acesso não configurado
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Seu usuário ainda não está vinculado a um colaborador.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
          Entre em contato com o administrador para verificar seu acesso.
        </div>
      </div>
    );
  }

  const nomeExibicao =
    perfil.nome?.trim() || "Colaborador";
  const primeiroNome = nomeExibicao.split(" ")[0];
  const inicial = primeiroNome.charAt(0).toUpperCase() || "C";
  const fraseDoDia = obterFraseDoDia();

  function irParaCompetenciaAnterior() {
    setCompetenciaSelecionada(
      (atual) =>
        new Date(
          atual.getFullYear(),
          atual.getMonth() - 1,
          1
        )
    );
  }

  function irParaProximaCompetencia() {
    setCompetenciaSelecionada(
      (atual) =>
        new Date(
          atual.getFullYear(),
          atual.getMonth() + 1,
          1
        )
    );
  }

  async function sairDoSistema() {
  try {
    // Cancela os listeners do Firestore antes de remover a autenticação.
    cancelarResultadosRef.current?.();
    cancelarFechamentosRef.current?.();

    cancelarResultadosRef.current = null;
    cancelarFechamentosRef.current = null;

    await signOut(auth);

    router.replace("/");
  } catch (error) {
    console.error(
      "Erro ao sair do sistema:",
      error
    );
  }
}

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1500px] overflow-x-hidden bg-slate-50 dark:bg-slate-950 px-3 py-3 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      {/* Cabeçalho / Perfil */}
        <header className="sticky top-3 z-40 mb-8 flex min-h-[68px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:top-5 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f97316]">
            XAMA Comissões
          </p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Área do colaborador
          </p>
        </div>

        <div ref={perfilMenuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuUsuarioAberto((aberto) => !aberto)}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-200 sm:gap-3"
            aria-label="Abrir perfil"
            aria-expanded={menuUsuarioAberto}
          >
            <div className="min-w-0 max-w-[90px] text-right sm:max-w-[180px]">
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100 sm:text-sm">
                {nomeExibicao}
              </p>
              <p className="truncate text-[9px] text-slate-400 sm:text-[11px]">Colaborador</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-[#ea580c] ring-2 ring-white dark:bg-orange-950/60 dark:text-orange-300 dark:ring-slate-950 transition hover:ring-orange-200 sm:h-11 sm:w-11">
              {inicial}
            </div>
          </button>

          {menuUsuarioAberto && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
              <div className="border-b border-slate-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-[#ea580c]">
                    {inicial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {nomeExibicao}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {auth.currentUser?.email || "—"}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Colaborador
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={sairDoSistema}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                    <LogOut size={17} />
                  </span>
                  <span>
                    <span className="block">Sair do sistema</span>
                    <span className="mt-0.5 block text-[10px] font-normal text-red-400">
                      Encerrar esta sessão
                    </span>
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="space-y-6">
        {/* Saudação + frase motivacional */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#f97316]">
              {obterSaudacao()}, {primeiroNome}!
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Olá, {nomeExibicao}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Acompanhe sua produtividade, comissões e pagamentos.
            </p>
          </div>

            <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white px-5 py-4 shadow-sm dark:border-orange-800/60 dark:from-orange-950/50 dark:to-slate-900 lg:max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#f97316]">
              ✦ Mensagem do dia
            </p>
            <p className="mt-1 text-sm font-medium leading-5 text-slate-300">
              “{fraseDoDia}”
            </p>
          </div>
        </div>

        {/* Competência */}
        <div className="flex w-full max-w-md items-center justify-between rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <button
            type="button"
            onClick={irParaCompetenciaAnterior}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Ir para a competência anterior"
            title="Competência anterior"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="min-w-0 px-3 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Competência
            </p>
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {formatarCompetencia(competenciaSelecionada)}
            </p>
          </div>

          <button
            type="button"
            onClick={irParaProximaCompetencia}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Ir para a próxima competência"
            title="Próxima competência"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Resultados da competência */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Resultados da competência
          </h2>
          <p className="mt-1 text-[11px] text-slate-400">
            Acompanhe sua produtividade e os resultados registrados no período.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ResumoCard
            icon={<BarChart3 size={18} />}
            label="Produtividade"
            valor={formatarMoeda(resumo.producao)}
            estilo="orange"
          />

          <ResumoCard
            icon={<ShieldCheck size={18} />}
            label="Seguro Finsol"
            valor={formatarMoeda(
              resultadosDaCompetencia.reduce(
                (total, resultado) =>
                  total + (resultado.seguroFinsol || 0),
                0
              )
            )}
            estilo="blue"
          />

          <ResumoCard
            icon={<ShieldCheck size={18} />}
            label="Seguro PRESTAMISTA"
            valor={formatarMoeda(
              resultadosDaCompetencia.reduce(
                (total, resultado) =>
                  total + (resultado.seguroPrestamista || 0),
                0
              )
            )}
            estilo="purple"
          />

          <ResumoCard
            icon={<Users size={18} />}
            label="Assistências"
            valor={String(
              resultadosDaCompetencia.reduce(
                (total, resultado) =>
                  total + (resultado.seguroAssistencia || 0),
                0
              )
            )}
            estilo="green"
          />
        </div>
      </section>

      {/* Minha remuneração */}
      <section className="mt-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Minha remuneração
          </h2>
          <p className="mt-1 text-[11px] text-slate-400">
            Valores calculados de acordo com os resultados e as regras vigentes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ResumoCard
            icon={<CircleDollarSign size={18} />}
            label="Comissões"
            valor={formatarMoeda(resumo.comissao)}
            estilo="blue"
          />

          <ResumoCard
            icon={<Wallet size={18} />}
            label="Bonificações"
            valor={formatarMoeda(resumo.bonificacao)}
            estilo="green"
          />

          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-sm sm:p-5 dark:border-orange-800/60 dark:bg-orange-950/50">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                <CircleDollarSign size={18} />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">
                  Total a receber
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                  {formatarMoeda(resumo.totalPagar)}
                </p>
              </div>
            </div>

            <p className="mt-3 text-[10px] text-slate-500 dark:text-slate-400">
              Comissões + bonificações da competência.
            </p>
          </div>
        </div>
      </section>

      {/* Situação financeira */}
      <section className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm ">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900">
            Situação da remuneração
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Acompanhe o que já foi pago e o que ainda está em processamento.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <StatusCard
            label="Pago"
            valor={formatarMoeda(
              resumo.totalPago
            )}
            className="text-green-700 bg-green-50"
          />

          <StatusCard
            label="Fechado"
            valor={formatarMoeda(
              resumo.totalFechado
            )}
            className="text-blue-700 bg-blue-50"
          />

          <StatusCard
            label="Pendente"
            valor={formatarMoeda(
              resumo.totalPendente
            )}
            className="text-amber-700 bg-amber-50"
          />
        </div>
      </section>

      {/* Resultados */}
      <section className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#f97316]">
              <FileText size={18} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Meus lançamentos
              </h2>

              <p className="text-xs text-slate-400">
                Resultados registrados em {formatarCompetencia(competenciaSelecionada)}.
              </p>
            </div>
          </div>
        </div>

        {resultadosDaCompetencia.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FileText
              size={26}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-600">
              Nenhum resultado nesta competência
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Quando houver resultados vinculados ao seu cadastro, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                    Cliente / Grupo
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                    Data
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                    Produtividade
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                    Finsol
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                    Prestamista
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">
                    Assistência
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                    Comissão
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                    Total
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                    Situação
                  </th>
                </tr>
              </thead>

              <tbody>
                {resultadosDaCompetencia.map(
                  (resultado) => {
                    const fechamento =
                      fechamentoPorResultadoId.get(
                        resultado.id
                      );

                    const calculo =
                      calcularComissao(
                        resultado,
                        regras
                      );

                    const situacao =
                      obterSituacao(
                        fechamento
                      );

                    const Icon =
                      situacao.icon;

                    return (
                      <tr
                        key={resultado.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {resultado.nomeCliente}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {resultado.quantidadeClientes} cliente(s)
                          </p>
                        </td>

                        <td className="px-4 py-4 text-xs text-slate-500">
                          {formatarData(
                            resultado.dataDesembolso
                          )}
                        </td>

                        <td className="px-4 py-4 text-right text-sm font-semibold text-slate-700">
                          {formatarMoeda(
                            resultado.produtividade
                          )}
                        </td>

                        <td className="px-4 py-4 text-right text-sm text-slate-600">
                          {formatarMoeda(
                            resultado.seguroFinsol
                          )}
                        </td>

                        <td className="px-4 py-4 text-right text-sm text-slate-600">
                          {formatarMoeda(
                            resultado.seguroPrestamista
                          )}
                        </td>

                        <td className="px-4 py-4 text-center text-sm font-medium text-slate-700">
                          {resultado.seguroAssistencia || 0}
                        </td>

                        <td className="px-4 py-4 text-right text-sm text-slate-600">
                          {formatarMoeda(
                            fechamento?.totalComissao ??
                              calculo.totalComissao
                          )}
                        </td>

                        <td className="px-4 py-4 text-right text-sm font-bold text-slate-900">
                          {formatarMoeda(
                            fechamento?.totalPagar ??
                              calculo.totalPagar
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${situacao.className}`}
                          >
                            <Icon size={13} />
                            {situacao.label}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </div>
    
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
  estilo:
    | "orange"
    | "blue"
    | "green"
    | "purple";
}) {
  const estilos = {
    orange:
      "bg-orange-50 text-[#f97316]",
    blue:
      "bg-blue-50 text-blue-600",
    green:
      "bg-green-50 text-green-600",
    purple:
      "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${estilos[estilo]}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-900">
        {valor}
      </p>
    </div>
  );
}

function StatusCard({
  label,
  valor,
  className,
}: {
  label: string;
  valor: string;
  className: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <span
        className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${className}`}
      >
        {label}
      </span>

      <p className="mt-3 text-lg font-bold text-slate-900">
        {valor}
      </p>
    </div>
  );
}
