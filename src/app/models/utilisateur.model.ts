export interface Role {
  id: number;
  nom?: string;
}

export interface Utilisateur {
  id?: number;
  login: string;
  password: string;
  role: Role;  // ✅ objet, pas string
}
