"use server";

import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert({
      projectId:
        process.env.FIREBASE_ADMIN_PROJECT_ID,

      clientEmail:
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL,

      privateKey:
        process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n"
        ),
    }),
  });
}

export async function criarUsuarioAdmin(dados: {
  nome: string;
  email: string;
  senha: string;
  role: "admin" | "colaborador";
  ativo: boolean;
  colaboradorId?: string | null;
}) {
  const app = getFirebaseAdmin();

  const adminAuth = getAuth(app);
  const db = getFirestore(app);

  const email = dados.email
    .trim()
    .toLowerCase();

  const usuario =
    await adminAuth.createUser({
      email,
      password: dados.senha,
      displayName: dados.nome.trim(),
      disabled: !dados.ativo,
    });

  await adminAuth.setCustomUserClaims(
    usuario.uid,
    {
      role: dados.role,
      ativo: dados.ativo,
      colaboradorId:
        dados.role === "colaborador"
          ? dados.colaboradorId ?? null
          : null,
    }
  );

  await db
    .collection("users")
    .doc(usuario.uid)
    .set({
      nome: dados.nome.trim(),
      email,
      role: dados.role,
      ativo: dados.ativo,
      colaboradorId:
        dados.role === "colaborador"
          ? dados.colaboradorId ?? null
          : null,
    });

  return {
    uid: usuario.uid,
  };
}

export async function definirAdministrador(
  uid: string
) {
  const app = getFirebaseAdmin();
  const adminAuth = getAuth(app);

  await adminAuth.setCustomUserClaims(
    uid,
    {
      role: "admin",
      ativo: true,
    }
  );

  return {
    sucesso: true,
    uid,
  };
}

export async function atualizarUsuarioAdmin(dados: {
  uid: string;
  nome: string;
  email: string;
  role: "admin" | "colaborador";
  ativo: boolean;
  colaboradorId?: string | null;
  idToken: string;
}) {
  const app = getFirebaseAdmin();

  const adminAuth = getAuth(app);
  const db = getFirestore(app);

  const email = dados.email
    .trim()
    .toLowerCase();

  // Verifica quem está solicitando a alteração.
  const token = await adminAuth.verifyIdToken(
    dados.idToken
  );

  // Apenas administradores ativos podem alterar
  // os dados de outros usuários.
  if (
    token.role !== "admin" ||
    token.ativo !== true
  ) {
    throw new Error(
      "Apenas administradores podem alterar usuários."
    );
  }

  // Confirma que o usuário existe no
  // Firebase Authentication.
  const usuarioAtual =
    await adminAuth.getUser(dados.uid);

  const emailAnterior =
    usuarioAtual.email?.toLowerCase() ?? "";

  try {
    // Mantém o Firebase Authentication
    // sincronizado com o e-mail do sistema.
    await adminAuth.updateUser(dados.uid, {
      email,
      displayName: dados.nome.trim(),
      disabled: !dados.ativo,
    });

    // Mantém as permissões atualizadas.
    await adminAuth.setCustomUserClaims(
      dados.uid,
      {
        role: dados.role,
        ativo: dados.ativo,
        colaboradorId:
          dados.role === "colaborador"
            ? dados.colaboradorId ?? null
            : null,
      }
    );

    // Mantém o Firestore sincronizado.
    await db
      .collection("users")
      .doc(dados.uid)
      .update({
        nome: dados.nome.trim(),
        email,
        role: dados.role,
        ativo: dados.ativo,
        colaboradorId:
          dados.role === "colaborador"
            ? dados.colaboradorId ?? null
            : null,
      });

    return {
      sucesso: true,
      uid: dados.uid,
      email,
    };
  } catch (error) {
    console.error(
      "Erro ao atualizar usuário administrativo:",
      error
    );

    // Se a sincronização no Firestore falhar
    // depois da alteração no Authentication,
    // tenta restaurar o e-mail anterior.
    if (
      emailAnterior &&
      emailAnterior !== email
    ) {
      try {
        await adminAuth.updateUser(
          dados.uid,
          {
            email: emailAnterior,
          }
        );
      } catch (rollbackError) {
        console.error(
          "Erro ao restaurar e-mail anterior:",
          rollbackError
        );
      }
    }

    throw error;
  }
}