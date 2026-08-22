import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

export type SituacaoResultado =
  | "Grupo Desembolsado"
  | "Grupo em Atraso"
  | "Grupo Evadido";

export interface Resultado {
  id: string;
  colaboradorId: string;
  competencia: string;

  situacao: SituacaoResultado;

  dataDesembolso: string;
  vencimento: string;

  nomeCliente: string;

  quantidadeClientes: number;
  renovados: number;
  retorno: number;
  novos: number;
  evasao: number;

  producaoFinsol: number;
  seguroFinsol: number;
  seguroAssistencia: number;

  previsaoReembolso: number;

  propostaFormalizada: number;
  segurosVendidos: number;

  observacoes: string;

  criadoEm?: Timestamp;
}

export interface NovoResultado {
  colaboradorId: string;
  competencia: string;

  situacao: SituacaoResultado;

  dataDesembolso: string;
  vencimento: string;

  nomeCliente: string;

  quantidadeClientes: number;
  renovados: number;
  retorno: number;
  novos: number;
  evasao: number;

  producaoFinsol: number;
  seguroFinsol: number;
  seguroAssistencia: number;

  previsaoReembolso: number;

  propostaFormalizada: number;
  segurosVendidos: number;

  observacoes: string;
}

const resultadosRef = collection(
  db,
  "resultados"
);

/**
 * Cria um novo resultado.
 */
export async function criarResultado(
  dados: NovoResultado
) {
  return addDoc(resultadosRef, {
    ...dados,
    criadoEm: Timestamp.now(),
  });
}

/**
 * Observa todos os resultados em tempo real.
 *
 * Usada pelas áreas administrativas.
 */
export function observarResultados(
  callback: (resultados: Resultado[]) => void
) {
  const q = query(
    resultadosRef,
    orderBy("criadoEm", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const resultados: Resultado[] =
      snapshot.docs.map((documento) => ({
        id: documento.id,
        ...(documento.data() as Omit<
          Resultado,
          "id"
        >),
      }));

    callback(resultados);
  });
}

/**
 * Observa somente os resultados de um colaborador.
 *
 * A consulta já é filtrada no Firestore pelo
 * colaboradorId, em vez de baixar todos os
 * resultados e filtrar somente no navegador.
 */
export function observarResultadosDoColaborador(
  colaboradorId: string,
  callback: (resultados: Resultado[]) => void
) {
  const q = query(
    resultadosRef,
    where(
      "colaboradorId",
      "==",
      colaboradorId
    ),
    orderBy("criadoEm", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const resultados: Resultado[] =
      snapshot.docs.map((documento) => ({
        id: documento.id,
        ...(documento.data() as Omit<
          Resultado,
          "id"
        >),
      }));

    callback(resultados);
  });
}

/**
 * Busca um único resultado pelo ID.
 */
export async function buscarResultado(
  id: string
): Promise<Resultado | null> {
  const resultadoRef = doc(
    db,
    "resultados",
    id
  );

  const snapshot = await getDoc(
    resultadoRef
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<
      Resultado,
      "id"
    >),
  };
}

/**
 * Atualiza um resultado existente.
 */
export async function atualizarResultado(
  id: string,
  dados: NovoResultado
) {
  const resultadoRef = doc(
    db,
    "resultados",
    id
  );

  return updateDoc(resultadoRef, {
    ...dados,
  });
}

/**
 * Exclui um resultado.
 */
export async function excluirResultado(
  id: string
) {
  const resultadoRef = doc(
    db,
    "resultados",
    id
  );

  return deleteDoc(resultadoRef);
}