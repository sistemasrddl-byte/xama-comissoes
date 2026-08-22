import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

type AtualizarClaimsBody = {
  uid: string;
  role: "admin" | "colaborador";
  ativo: boolean;
  colaboradorId?: string | null;
};

export async function POST(
  request: Request
) {
  try {
    // =========================================================
    // AUTENTICAÇÃO DO ADMINISTRADOR
    // =========================================================

    const authorization =
      request.headers.get("authorization");

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        {
          erro:
            "Usuário não autenticado.",
        },
        { status: 401 }
      );
    }

    const idToken =
      authorization.substring(7);

    const token =
      await adminAuth.verifyIdToken(
        idToken
      );

    // Somente administradores podem
    // alterar Custom Claims.
    if (
      token.role !== "admin" ||
      token.ativo !== true
    ) {
      return NextResponse.json(
        {
          erro:
            "Acesso negado. Somente administradores podem alterar permissões.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // DADOS DA ALTERAÇÃO
    // =========================================================

    const body =
      (await request.json()) as AtualizarClaimsBody;

    const {
      uid,
      role,
      ativo,
      colaboradorId,
    } = body;

    if (!uid) {
      return NextResponse.json(
        {
          erro:
            "UID do usuário é obrigatório.",
        },
        { status: 400 }
      );
    }

    if (
      role !== "admin" &&
      role !== "colaborador"
    ) {
      return NextResponse.json(
        {
          erro: "Role inválido.",
        },
        { status: 400 }
      );
    }

    if (
      role === "colaborador" &&
      !colaboradorId
    ) {
      return NextResponse.json(
        {
          erro:
            "colaboradorId é obrigatório para colaboradores.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // CUSTOM CLAIMS
    // =========================================================

    const claims = {
      role,
      ativo,

      colaboradorId:
        role === "colaborador"
          ? colaboradorId ?? null
          : null,
    };

    await adminAuth.setCustomUserClaims(
      uid,
      claims
    );

    return NextResponse.json({
      sucesso: true,
      uid,
      claims,
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar Custom Claims:",
      error
    );

    return NextResponse.json(
      {
        erro:
          "Não foi possível atualizar as permissões do usuário.",
      },
      { status: 500 }
    );
  }
}