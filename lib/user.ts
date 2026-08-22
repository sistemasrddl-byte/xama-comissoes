import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export type UserRole = "admin" | "colaborador";

export interface UserProfile {
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  colaboradorId?: string | null;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    return null;
  }

  return userSnapshot.data() as UserProfile;
}

/**
 * Observa o perfil do usuário em tempo real.
 * Permite bloquear imediatamente a área do colaborador
 * quando o administrador desativa o acesso.
 */
export function observarUserProfile(
  uid: string,
  callback: (perfil: UserProfile | null) => void
) {
  const userRef = doc(db, "users", uid);

  return onSnapshot(userRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback(snapshot.data() as UserProfile);
  });
}
