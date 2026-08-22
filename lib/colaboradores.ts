import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  
} from "firebase/firestore";

import { db } from "./firebase";

export interface Colaborador {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  dataAdmissao: string;
  cargo: string;
  metaMensal: number;
  ativo: boolean;
  criadoEm?: Timestamp;
}

export interface NovoColaborador {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  dataAdmissao: string;
  cargo: string;
  metaMensal: number;
  ativo: boolean;
}

export interface AtualizarColaborador {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  dataAdmissao: string;
  cargo: string;
  metaMensal: number;
  ativo: boolean;
}

const colaboradoresRef = collection(
  db,
  "colaboradores"
);

export async function criarColaborador(
  dados: NovoColaborador
) {
  return addDoc(colaboradoresRef, {
    ...dados,
    criadoEm: Timestamp.now(),
  });
}

export function observarColaboradores(
  callback: (colaboradores: Colaborador[]) => void
) {
  const q = query(
    colaboradoresRef,
    orderBy("criadoEm", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const colaboradores: Colaborador[] =
      snapshot.docs.map((documento) => ({
        id: documento.id,
        ...(documento.data() as Omit<
          Colaborador,
          "id"
        >),
      }));

    callback(colaboradores);
  });
}

export function observarColaborador(
  id: string,
  callback: (colaborador: Colaborador | null) => void
) {
  const colaboradorRef = doc(
    db,
    "colaboradores",
    id
  );

  return onSnapshot(colaboradorRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback({
      id: snapshot.id,
      ...(snapshot.data() as Omit<
        Colaborador,
        "id"
      >),
    });
  });
}

export async function atualizarColaborador(
  id: string,
  dados: AtualizarColaborador
) {
  const colaboradorRef = doc(
    db,
    "colaboradores",
    id
  );

  return updateDoc(colaboradorRef, {
    ...dados,
    atualizadoEm: Timestamp.now(),
  });
}

export async function alterarStatusColaborador(
  id: string,
  ativo: boolean
) {
  const colaboradorRef = doc(
    db,
    "colaboradores",
    id
  );

  return updateDoc(colaboradorRef, {
    ativo,
    atualizadoEm: Timestamp.now(),
  });
}