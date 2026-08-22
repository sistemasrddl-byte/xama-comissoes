import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

export type SituacaoFechamento =
  | "Pendente"
  | "Fechado"
  | "Pago";

export interface Fechamento {
  id: string;

  colaboradorId: string;
  competencia: string;

  /**
   * IDs dos resultados que foram incluídos
   * neste fechamento.
   *
   * Isso permite congelar o fechamento.
   * Novos resultados não alteram fechamentos
   * anteriores.
   */
  resultadoIds: string[];

  producaoFinsol: number;

  comissaoLiberacao: number;
  comissaoReembolso: number;
  comissaoSeguro: number;
  comissaoAssistencia: number;

  totalComissao: number;

  bonificacaoLiberacao: number;
  totalBonificacao: number;

  totalPagar: number;

  situacao: SituacaoFechamento;

  dataFechamento?: string;
  dataPagamento?: string;

  observacoes?: string;

  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}

export interface NovoFechamento {
  colaboradorId: string;
  competencia: string;

  /**
   * Resultados utilizados neste fechamento.
   */
  resultadoIds: string[];

  producaoFinsol: number;

  comissaoLiberacao: number;
  comissaoReembolso: number;
  comissaoSeguro: number;
  comissaoAssistencia: number;

  totalComissao: number;

  bonificacaoLiberacao: number;
  totalBonificacao: number;

  totalPagar: number;

  situacao: SituacaoFechamento;

  dataFechamento?: string;
  dataPagamento?: string;

  observacoes?: string;
}

const fechamentosRef = collection(
  db,
  "fechamentos"
);

export async function criarFechamento(
  dados: NovoFechamento
) {
  return addDoc(fechamentosRef, {
    ...dados,

    criadoEm: Timestamp.now(),

    atualizadoEm: Timestamp.now(),
  });
}

export async function atualizarFechamento(
  id: string,
  dados: Partial<
    Omit<Fechamento, "id" | "criadoEm">
  >
) {
  const fechamentoRef = doc(
    db,
    "fechamentos",
    id
  );

  return updateDoc(fechamentoRef, {
    ...dados,

    atualizadoEm: Timestamp.now(),
  });
}

/**
 * Observa somente os fechamentos de um colaborador.
 *
 * A consulta já é filtrada no Firestore pelo
 * colaboradorId, evitando carregar os fechamentos
 * de outros colaboradores para o navegador.
 */
export function observarFechamentosDoColaborador(
  colaboradorId: string,
  callback: (
    fechamentos: Fechamento[]
  ) => void
) {
  const q = query(
    fechamentosRef,
    where(
      "colaboradorId",
      "==",
      colaboradorId
    )
  );

  return onSnapshot(q, (snapshot) => {
    const fechamentos: Fechamento[] =
      snapshot.docs
        .map((documento) => {
          const dados =
            documento.data();

          return {
            id: documento.id,

            ...(dados as Omit<
              Fechamento,
              "id"
            >),

            resultadoIds:
              Array.isArray(
                dados.resultadoIds
              )
                ? dados.resultadoIds
                : [],
          };
        })
        .sort((a, b) => {
          const dataA =
            a.criadoEm?.toMillis?.() ?? 0;

          const dataB =
            b.criadoEm?.toMillis?.() ?? 0;

          return dataB - dataA;
        });

    callback(fechamentos);
  });
}
export function observarFechamentos(
  callback: (
    fechamentos: Fechamento[]
  ) => void
) {
  const q = query(
    fechamentosRef,
    orderBy("criadoEm", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const fechamentos: Fechamento[] =
      snapshot.docs.map((documento) => {
        const dados =
          documento.data();

        return {
          id: documento.id,

          ...(dados as Omit<
            Fechamento,
            "id"
          >),

          /**
           * Compatibilidade com fechamentos
           * antigos que foram criados antes
           * da implantação de resultadoIds.
           */
          resultadoIds:
            Array.isArray(
              dados.resultadoIds
            )
              ? dados.resultadoIds
              : [],
        };
      });

    callback(fechamentos);
  });
}