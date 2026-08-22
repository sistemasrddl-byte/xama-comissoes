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