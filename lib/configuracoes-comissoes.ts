import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import { db } from "./firebase";

export interface RegrasComissao {
  liberacaoPercentual: number;
  bonificacaoLiberacaoPercentual: number;
  reembolsoPercentual: number;
  seguroPercentual: number;
  assistenciaValorPorCliente: number;

  atualizadoEm?: Timestamp;
}

export const regrasComissaoPadrao: RegrasComissao = {
  liberacaoPercentual: 1.5,
  bonificacaoLiberacaoPercentual: 20,
  reembolsoPercentual: 2,
  seguroPercentual: 15,
  assistenciaValorPorCliente: 13,
};

const configuracaoRef = doc(
  db,
  "configuracoes",
  "comissoes"
);

export async function buscarRegrasComissao(): Promise<RegrasComissao> {
  const snapshot = await getDoc(
    configuracaoRef
  );

  if (!snapshot.exists()) {
    return regrasComissaoPadrao;
  }

  return {
    ...regrasComissaoPadrao,
    ...(snapshot.data() as Partial<RegrasComissao>),
  };
}

export async function salvarRegrasComissao(
  regras: RegrasComissao
) {
  return setDoc(configuracaoRef, {
    ...regras,
    atualizadoEm: Timestamp.now(),
  });
}