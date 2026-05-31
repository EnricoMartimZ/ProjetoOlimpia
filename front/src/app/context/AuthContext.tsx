import { createContext, useContext, useState, ReactNode } from "react";
import { login as apiLogin } from "../../services/api";

export interface AuthUser {
  id: string;
  nome: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseToken(token: string): AuthUser & { exp: number } {
  const payload = token.split(".")[1];
  const data = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  return { id: data.sub, nome: data.nome, role: data.role, exp: data.exp };
}

function loadFromStorage(): { token: string | null; user: AuthUser | null } {
  const token = localStorage.getItem("token");
  if (!token) return { token: null, user: null };
  try {
    const { id, nome, role, exp } = parseToken(token);
    if (Date.now() / 1000 > exp) {
      localStorage.removeItem("token");
      return { token: null, user: null };
    }
    return { token, user: { id, nome, role } };
  } catch {
    localStorage.removeItem("token");
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadFromStorage();
  const [token, setToken] = useState<string | null>(initial.token);
  const [user, setUser] = useState<AuthUser | null>(initial.user);

  const login = async (email: string, senha: string): Promise<AuthUser> => {
    const data = await apiLogin(email, senha);
    const { id, nome, role } = parseToken(data.access_token);
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    setUser({ id, nome, role });
    return { id, nome, role };
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
