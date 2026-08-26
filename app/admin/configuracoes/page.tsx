"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  Calculator,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Moon,
  Percent,
  Plus,
  Save,
  ShieldCheck,
  Sun,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import {
  buscarRegrasComissao,
  RegrasComissao,
  regrasComissaoPadrao,
  salvarRegrasComissao,
} from "@/lib/configuracoes-comissoes";

import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "@/lib/firebase";
import { getUserProfile } from "@/lib/user";

import {
  criarUsuarioAdmin,
  atualizarUsuarioAdmin,
  atualizarStatusUsuarioAdmin,
} from "./actions";

function formatarMoedaInput(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}


type UsuarioSistema = {
  id: string;
  nome: string;
  email: string;
  role: "admin" | "colaborador";
  ativo: boolean;
  colaboradorId?: string | null;
};

type ColaboradorOpcao = {
  id: string;
  nome: string;
};


export default function ConfiguracoesPage() {
  const [regras, setRegras] =
    useState<RegrasComissao>(
      regrasComissaoPadrao
    );

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [mensagem, setMensagem] =
    useState("");

  const [erro, setErro] = useState("");

  const [aba, setAba] = useState<
    "perfil" | "usuarios" | "aparencia" | "comissoes"
  >("perfil");

  const [perfilAtual, setPerfilAtual] =
    useState<{
      nome: string;
      email: string;
      role: "admin" | "colaborador";
      colaboradorId?: string | null;
    } | null>(null);

  const [usuarios, setUsuarios] =
    useState<UsuarioSistema[]>([]);
  const [colaboradores, setColaboradores] =
    useState<ColaboradorOpcao[]>([]);

  const [usuarioModal, setUsuarioModal] =
    useState(false);

  const [editandoUsuario, setEditandoUsuario] =
    useState<UsuarioSistema | null>(null);

  const [usuarioNome, setUsuarioNome] =
    useState("");
  const [usuarioEmail, setUsuarioEmail] =
    useState("");
  const [usuarioSenha, setUsuarioSenha] =
    useState("");
  const [usuarioRole, setUsuarioRole] =
    useState<"admin" | "colaborador">("colaborador");
  const [usuarioColaboradorId, setUsuarioColaboradorId] =
    useState("");
  const [usuarioAtivo, setUsuarioAtivo] =
    useState(true);
  const [mostrarSenha, setMostrarSenha] =
    useState(false);
  const [tema, setTema] =
    useState<"claro" | "escuro">("claro");
  const [salvandoUsuario, setSalvandoUsuario] =
    useState(false);
  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        setCarregando(true);

        const dados =
          await buscarRegrasComissao();

        if (!cancelado) {
          setRegras(dados);
        }
      } catch (error) {
        console.error(
          "Erro ao carregar configurações:",
          error
        );

        if (!cancelado) {
          setErro(
            "Não foi possível carregar as configurações."
          );
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    carregar();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;
    let cancelarAuth: (() => void) | undefined;
    async function carregarDadosConfiguracoes(
      usuarioAtual: typeof auth.currentUser
    ) {
      try {
        if (!usuarioAtual) {
          setPerfilAtual(null);
          return;
        }

        let perfil =
          await getUserProfile(usuarioAtual.uid);
        // O perfil do usuário é carregado pelo UID.
        // Se ainda não estiver disponível nessa estrutura,
        // fazemos fallback pelo e-mail, que é único no login.
        if (!perfil && usuarioAtual.email) {
          const perfilPorEmail = await getDocs(
            query(
              collection(db, "users"),
              where(
                "email",
                "==",
                usuarioAtual.email.toLowerCase()
              )
            )
          );
          const encontrado =
            perfilPorEmail.docs[0];
          if (encontrado) {
            const dados =
              encontrado.data();
            perfil = {
              nome: String(
                dados.nome ??
                  usuarioAtual.displayName ??
                  "Usuário"
              ),
              email: String(
                dados.email ??
                  usuarioAtual.email
              ),
              role:
                dados.role === "admin"
                  ? "admin"
                  : "colaborador",
              ativo:
                dados.ativo !== false,
              colaboradorId:
                dados.colaboradorId ??
                null,
            };
          }
        }
        if (!cancelado && perfil) {
          setPerfilAtual({
            nome: perfil.nome,
            email:
              perfil.email ||
              usuarioAtual.email ||
              "",
            role: perfil.role,
            colaboradorId:
              perfil.colaboradorId ??
              null,
          });
        }
        const [
          usuariosSnap,
          colaboradoresSnap,
        ] = await Promise.all([
          getDocs(
            query(
              collection(db, "users"),
              orderBy("nome")
            )
          ),
          getDocs(
            query(
              collection(db, "colaboradores"),
              orderBy("nome")
            )
          ),
        ]);

        if (cancelado) return;

        setUsuarios(
          usuariosSnap.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<
              UsuarioSistema,
              "id"
            >),
          }))
        );

        setColaboradores(
          colaboradoresSnap.docs.map((item) => ({
            id: item.id,
            nome: String(
              item.data().nome ?? ""
            ),
          }))
        );
      } catch (error) {
        console.error(
          "Erro ao carregar dados de configurações:",
          error
        );

        if (!cancelado) {
          setErro(
            "Não foi possível carregar todos os dados das configurações. Verifique as permissões do Firebase."
          );
        }
      }
    }

    // Importante: auth.currentUser pode ainda estar null
    // no primeiro render. O listener garante que o perfil
    // seja carregado assim que o Firebase restaurar a sessão.
    cancelarAuth = onAuthStateChanged(
      auth,
      (usuarioAtual) => {
        carregarDadosConfiguracoes(
          usuarioAtual
        );
      }
    );

    const temaSalvo =
      typeof window !== "undefined"
        ? window.localStorage.getItem(
            "xama-tema"
          )
        : null;

    if (
      temaSalvo === "escuro" ||
      temaSalvo === "claro"
    ) {
      setTema(temaSalvo);
      document.documentElement.classList.toggle(
        "dark",
        temaSalvo === "escuro"
      );
      document.documentElement.style.colorScheme =
        temaSalvo === "escuro" ? "dark" : "light";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }

    return () => {
      cancelado = true;
      cancelarAuth?.();
    };
  }, []);

  function aplicarTema(
    novoTema: "claro" | "escuro"
  ) {
    setTema(novoTema);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "xama-tema",
        novoTema
      );
      document.documentElement.classList.toggle(
        "dark",
        novoTema === "escuro"
      );
      document.documentElement.style.colorScheme =
        novoTema === "escuro" ? "dark" : "light";
    }
  }

  function atualizarRegra(
    campo: keyof RegrasComissao,
    valor: string
  ) {
    const numero = Number(
      valor.replace(",", ".")
    );

    setRegras((anterior) => ({
      ...anterior,
      [campo]: Number.isNaN(numero)
        ? 0
        : numero,
    }));

    setMensagem("");
    setErro("");
  }

  function abrirNovoUsuario() {
    setEditandoUsuario(null);
    setUsuarioNome("");
    setUsuarioEmail("");
    setUsuarioSenha("");
    setUsuarioRole("colaborador");
    setUsuarioColaboradorId("");
    setUsuarioAtivo(true);
    setMostrarSenha(false);
    setUsuarioModal(true);
  }

  function editarUsuario(usuario: UsuarioSistema) {
    setEditandoUsuario(usuario);
    setUsuarioNome(usuario.nome);
    setUsuarioEmail(usuario.email);
    setUsuarioSenha("");
    setUsuarioRole(usuario.role);
    setUsuarioColaboradorId(
      usuario.colaboradorId ?? ""
    );
    setUsuarioAtivo(usuario.ativo);
    setMostrarSenha(false);
    setUsuarioModal(true);
  }

  async function salvarUsuario(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!usuarioNome.trim() || !usuarioEmail.trim()) {
      setErro("Informe nome e e-mail.");
      return;
    }

    if (!editandoUsuario && usuarioSenha.length < 6) {
      setErro(
        "A senha inicial deve ter pelo menos 6 caracteres."
      );
      return;
    }

    if (
      usuarioRole === "colaborador" &&
      !usuarioColaboradorId
    ) {
      setErro(
        "Selecione o colaborador vinculado."
      );
      return;
    }

    try {
      setSalvandoUsuario(true);
      setErro("");
      setMensagem("");

      if (editandoUsuario) {
  const usuarioAtual = auth.currentUser;

  if (!usuarioAtual) {
    throw new Error(
      "Usuário administrador não autenticado."
    );
  }

  const idToken =
    await usuarioAtual.getIdToken(true);

  await atualizarUsuarioAdmin({
    uid: editandoUsuario.id,
    nome: usuarioNome.trim(),
    email: usuarioEmail.trim().toLowerCase(),
    role: usuarioRole,
    ativo: usuarioAtivo,
    colaboradorId:
      usuarioRole === "colaborador"
        ? usuarioColaboradorId
        : null,
    idToken,
  });
  setUsuarios((anterior) =>
    anterior.map((item) =>
      item.id === editandoUsuario.id
        ? {
            ...item,
            nome: usuarioNome.trim(),
            email:
              usuarioEmail
                .trim()
                .toLowerCase(),
            role: usuarioRole,
            ativo: usuarioAtivo,
            colaboradorId:
              usuarioRole === "colaborador"
                ? usuarioColaboradorId
                : null,
          }
        : item
    )
  );
  setMensagem(
    "Usuário atualizado com sucesso."
  );
} else {
  const usuarioAtual = auth.currentUser;

  if (!usuarioAtual) {
    throw new Error(
      "Usuário administrador não autenticado."
    );
  }

  const idToken =
    await usuarioAtual.getIdToken(true);

  const resultado =
    await criarUsuarioAdmin({
      nome: usuarioNome.trim(),
      email:
        usuarioEmail.trim().toLowerCase(),
      senha: usuarioSenha,
      role: usuarioRole,
      ativo: usuarioAtivo,
      colaboradorId:
        usuarioRole === "colaborador"
          ? usuarioColaboradorId
          : null,
      idToken,
    });

  const novo: UsuarioSistema = {
    id: resultado.uid,
    nome: usuarioNome.trim(),
    email:
      usuarioEmail.trim().toLowerCase(),
    role: usuarioRole,
    ativo: usuarioAtivo,
    colaboradorId:
      usuarioRole === "colaborador"
        ? usuarioColaboradorId
        : null,
  };
  setUsuarios((anterior) =>
    [...anterior, novo].sort(
      (a, b) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR"
        )
    )
  );
  setMensagem(
    "Usuário criado com sucesso."
  );
}

      setUsuarioModal(false);
    } catch (error: any) {
      console.error(
        "Erro ao salvar usuário:",
        error
      );

      if (
        error?.code ===
        "auth/email-already-in-use"
      ) {
        setErro(
          "Este e-mail já possui um usuário no Firebase Authentication."
        );
      } else if (
        error?.code ===
        "auth/invalid-email"
      ) {
        setErro(
          "Informe um e-mail válido."
        );
      } else if (
        error?.code ===
        "auth/weak-password"
      ) {
        setErro(
          "A senha informada é muito fraca."
        );
      } else {
        setErro(
          "Não foi possível salvar o usuário. Verifique as permissões do Firebase."
        );
      }
    } finally {
      setSalvandoUsuario(false);
    }
  }

  async function alternarUsuario(
  usuario: UsuarioSistema
) {
  try {
    setErro("");
    setMensagem("");

    const usuarioAtual = auth.currentUser;

    if (!usuarioAtual) {
      throw new Error(
        "Usuário administrador não autenticado."
      );
    }

    const novoStatus = !usuario.ativo;

    const idToken =
      await usuarioAtual.getIdToken(true);

    await atualizarStatusUsuarioAdmin({
      uid: usuario.id,
      ativo: novoStatus,
      idToken,
    });
    setUsuarios((anterior) =>
      anterior.map((item) =>
        item.id === usuario.id
          ? {
              ...item,
              ativo: novoStatus,
            }
          : item
      )
    );

    setMensagem(
      novoStatus
        ? "Usuário ativado com sucesso."
        : "Usuário desativado com sucesso."
    );
  } catch (error) {
    console.error(
      "Erro ao alterar usuário:",
      error
    );

    setErro(
      "Não foi possível alterar a situação do usuário."
    );
  }
}


  async function salvar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSalvando(true);
      setMensagem("");
      setErro("");

      await salvarRegrasComissao(regras);

      setMensagem(
        "Regras de comissão salvas com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao salvar regras:",
        error
      );

      setErro(
        "Não foi possível salvar as regras de comissão."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#f97316]" />

          <p className="mt-3 text-sm text-slate-500">
            Carregando configurações...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-[#f97316]">
          Administração
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Gerencie seu perfil, usuários, aparência e regras do sistema.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {[
            ["perfil", "Meu perfil", Users],
            ["usuarios", "Usuários", UserPlus],
            ["aparencia", "Aparência", Moon],
            ["comissoes", "Regras de comissão", Calculator],
          ].map(([id, label, Icon]) => (
            <button
              key={id as string}
              type="button"
              onClick={() => setAba(id as typeof aba)}
              className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                aba === id
                  ? "bg-orange-50 text-[#f97316]"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={18} />
              {label as string}
            </button>
          ))}
        </aside>

        <main className="min-w-0">
          {aba === "perfil" && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Meu perfil
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Dados do usuário atualmente conectado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <InfoBox
                  label="Nome"
                  value={perfilAtual?.nome || "Não identificado"}
                />
                <InfoBox
                  label="E-mail"
                  value={perfilAtual?.email || auth.currentUser?.email || "Não informado"}
                />
                <InfoBox
                  label="Perfil"
                  value={
                    perfilAtual?.role === "admin"
                      ? "Administrador"
                      : perfilAtual?.role ===
                        "colaborador"
                      ? "Colaborador"
                      : "Não identificado"
                  }
                />
                <InfoBox
                  label="Colaborador vinculado"
                  value={
                    colaboradores.find(
                      (item) =>
                        item.id === perfilAtual?.colaboradorId
                    )?.nome || "Não vinculado"
                  }
                />
              </div>
            </section>
          )}

          {aba === "usuarios" && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Usuários do sistema
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      O administrador cria e controla os acessos.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={abrirNovoUsuario}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#ea580c]"
                >
                  <Plus size={17} />
                  Novo usuário
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {usuarios.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-400">
                    Nenhum usuário encontrado.
                  </div>
                ) : (
                  usuarios.map((usuario) => (
                    <div
                      key={usuario.id}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {usuario.nome}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              usuario.ativo
                                ? "bg-green-50 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {usuario.ativo
                              ? "Ativo"
                              : "Inativo"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {usuario.email}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {usuario.role === "admin"
                            ? "Administrador"
                            : "Colaborador"}
                          {usuario.colaboradorId
                            ? ` · ${
                                colaboradores.find(
                                  (item) =>
                                    item.id ===
                                    usuario.colaboradorId
                                )?.nome || "Colaborador vinculado"
                              }`
                            : ""}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            editarUsuario(usuario)
                          }
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          <Edit3 size={15} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            alternarUsuario(usuario)
                          }
                          className={`inline-flex h-9 items-center rounded-lg px-3 text-xs font-semibold ${
                            usuario.ativo
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {usuario.ativo
                            ? "Inativar"
                            : "Ativar"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {aba === "aparencia" && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Moon size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Aparência do sistema
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Escolha como o XAMA será exibido neste dispositivo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <ThemeOption
                  ativo={tema === "claro"}
                  icon={<Sun size={21} />}
                  titulo="Claro"
                  descricao="Mantém a aparência atual do sistema."
                  onClick={() =>
                    aplicarTema("claro")
                  }
                />
                <ThemeOption
                  ativo={tema === "escuro"}
                  icon={<Moon size={21} />}
                  titulo="Escuro"
                  descricao="Reduz o brilho e usa uma interface escura."
                  onClick={() =>
                    aplicarTema("escuro")
                  }
                />
              </div>
            </section>
          )}

          {aba === "comissoes" && (
            <form
              onSubmit={salvar}
              className="space-y-6"
            >
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#f97316]">
                      <Calculator size={20} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        Regras de comissão
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Estes valores serão utilizados automaticamente no cálculo das comissões dos colaboradores.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                  <RegraCard
                    icon={<Wallet size={19} />}
                    titulo="Comissão por liberação"
                    descricao="Percentual aplicado sobre a produção Finsol."
                    unidade="%"
                    valor={regras.liberacaoPercentual}
                    onChange={(valor) =>
                      atualizarRegra(
                        "liberacaoPercentual",
                        valor
                      )
                    }
                  />
                  <RegraCard
                    icon={<Percent size={19} />}
                    titulo="Bonificação sobre liberação"
                    descricao="Percentual aplicado sobre a comissão de liberação."
                    unidade="%"
                    valor={regras.bonificacaoLiberacaoPercentual}
                    onChange={(valor) =>
                      atualizarRegra(
                        "bonificacaoLiberacaoPercentual",
                        valor
                      )
                    }
                  />
                  <RegraCard
                    icon={<Wallet size={19} />}
                    titulo="Comissão por reembolso"
                    descricao="Percentual aplicado sobre a previsão de reembolso."
                    unidade="%"
                    valor={regras.reembolsoPercentual}
                    onChange={(valor) =>
                      atualizarRegra(
                        "reembolsoPercentual",
                        valor
                      )
                    }
                  />
                  <RegraCard
                    icon={<Percent size={19} />}
                    titulo="Comissão por seguros"
                    descricao="Percentual aplicado sobre o valor de seguro Finsol."
                    unidade="%"
                    valor={regras.seguroPercentual}
                    onChange={(valor) =>
                      atualizarRegra(
                        "seguroPercentual",
                        valor
                      )
                    }
                  />
                  <RegraCard
                    icon={<Users size={19} />}
                    titulo="Comissão por assistência"
                    descricao="Valor pago por cada assistência realizada."
                    unidade="R$"
                    valor={regras.assistenciaValorPorCliente}
                    moeda
                    onChange={(valor) =>
                      atualizarRegra(
                        "assistenciaValorPorCliente",
                        valor
                      )
                    }
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Regras atuais
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Confira os valores que serão utilizados no cálculo.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <ResumoRegra titulo="Liberação" valor={`${regras.liberacaoPercentual}%`} />
                  <ResumoRegra titulo="Bonificação sobre liberação" valor={`${regras.bonificacaoLiberacaoPercentual}%`} />
                  <ResumoRegra titulo="Reembolso" valor={`${regras.reembolsoPercentual}%`} />
                  <ResumoRegra titulo="Seguros" valor={`${regras.seguroPercentual}%`} />
                  <ResumoRegra
                    titulo="Assistência"
                    valor={`R$ ${regras.assistenciaValorPorCliente.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} por assistência`}
                  />
                </div>
              </section>

              <div className="flex justify-end pb-6">
                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={18} />
                  {salvando
                    ? "Salvando..."
                    : "Salvar configurações"}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>

      {(mensagem || erro) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            mensagem
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {mensagem || erro}
        </div>
      )}

      {usuarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <form onSubmit={salvarUsuario}>
              <div className="border-b border-slate-100 p-5">
                <h2 className="text-lg font-bold text-slate-900">
                  {editandoUsuario
                    ? "Editar usuário"
                    : "Novo usuário"}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  O e-mail será usado para autenticação e recuperação de senha.
                </p>
              </div>

              <div className="space-y-4 p-5">
                <Campo
                  label="Nome"
                  value={usuarioNome}
                  onChange={setUsuarioNome}
                  placeholder="Nome completo"
                />
                <Campo
                  label="E-mail"
                  type="email"
                  value={usuarioEmail}
                  onChange={setUsuarioEmail}
                  placeholder="usuario@email.com"
                />

                {!editandoUsuario && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Senha inicial
                    </label>
                    <div className="relative">
                      <input
                        type={
                          mostrarSenha
                            ? "text"
                            : "password"
                        }
                        value={usuarioSenha}
                        onChange={(event) =>
                          setUsuarioSenha(
                            event.target.value
                          )
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-11 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
                        placeholder="Mínimo de 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setMostrarSenha(
                            (valor) => !valor
                          )
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-50"
                      >
                        {mostrarSenha ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectCampo
                    label="Perfil"
                    value={usuarioRole}
                    onChange={(value) =>
                      setUsuarioRole(
                        value as
                          | "admin"
                          | "colaborador"
                      )
                    }
                    options={[
                      {
                        value: "colaborador",
                        label: "Colaborador",
                      },
                      {
                        value: "admin",
                        label: "Administrador",
                      },
                    ]}
                  />

                  <SelectCampo
                    label="Colaborador vinculado"
                    value={usuarioColaboradorId}
                    onChange={
                      setUsuarioColaboradorId
                    }
                    disabled={
                      usuarioRole === "admin"
                    }
                    options={[
                      {
                        value: "",
                        label:
                          usuarioRole ===
                          "admin"
                            ? "Não se aplica"
                            : "Selecione",
                      },
                      ...colaboradores.map(
                        (item) => ({
                          value: item.id,
                          label: item.nome,
                        })
                      ),
                    ]}
                  />
                </div>

                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Usuário ativo
                    </p>
                    <p className="text-xs text-slate-400">
                      Usuários inativos não devem acessar o sistema.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={usuarioAtivo}
                    onChange={(event) =>
                      setUsuarioAtivo(
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 accent-[#f97316]"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 p-5">
                <button
                  type="button"
                  onClick={() =>
                    setUsuarioModal(false)
                  }
                  className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoUsuario}
                  className="h-10 rounded-xl bg-[#f97316] px-5 text-sm font-semibold text-white hover:bg-[#ea580c] disabled:opacity-60"
                >
                  {salvandoUsuario
                    ? "Salvando..."
                    : editandoUsuario
                    ? "Salvar alterações"
                    : "Criar usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function ThemeOption({
  ativo,
  icon,
  titulo,
  descricao,
  onClick,
}: {
  ativo: boolean;
  icon: React.ReactNode;
  titulo: string;
  descricao: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        ativo
          ? "border-[#f97316] bg-orange-50/50 ring-2 ring-orange-500/10"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            ativo
              ? "bg-[#f97316] text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {icon}
        </div>
        {ativo && (
          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-bold text-[#f97316]">
            Ativo
          </span>
        )}
      </div>
      <p className="mt-4 text-sm font-bold text-slate-900">
        {titulo}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        {descricao}
      </p>
    </button>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
      />
    </div>
  );
}

function SelectCampo({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RegraCard({
  icon,
  titulo,
  descricao,
  unidade,
  valor,
  moeda = false,
  onChange,
}: {
  icon: React.ReactNode;
  titulo: string;
  descricao: string;
  unidade: "%" | "R$";
  valor: number;
  moeda?: boolean;
  onChange: (valor: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#f97316] shadow-sm">
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800">
            {titulo}
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            {descricao}
          </p>
        </div>
      </div>

      <div className="relative mt-4">
        <span className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-xs font-semibold text-slate-400">
          {unidade}
        </span>

        <input
          type={moeda ? "text" : "number"}
          inputMode={
            moeda ? "decimal" : "numeric"
          }
          value={
            moeda
              ? formatarMoedaInput(valor)
              : valor
          }
          onChange={(event) => {
            if (moeda) {
              const somenteNumeros =
                event.target.value.replace(
                  /\D/g,
                  ""
                );

              const numero =
                Number(somenteNumeros) / 100;

              onChange(String(numero));
              return;
            }

            onChange(event.target.value);
          }}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-orange-500/10"
        />
      </div>
    </div>
  );
}

function ResumoRegra({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <span className="text-sm text-slate-500">
        {titulo}
      </span>

      <span className="text-sm font-bold text-slate-800">
        {valor}
      </span>
    </div>
  );
}