import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { User, LogOut, ChevronDown } from "lucide-react";
import { OlimpiaLogo } from "./OlimpiaLogo";
import { ColorStripe } from "./ColorStripe";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  label: string;
  path: string;
}

interface AppLayoutProps {
  navItems: NavItem[];
  homePath: string;
  roleBadge?: string;
  userName: string;
  userEmail: string;
}

function cargoLabel(role: string | undefined): string {
  const roles = role?.split(",") ?? [];
  const isServidor = roles.includes("servidor");
  const isPesquisador = roles.includes("pesquisador_campo");
  if (isServidor && isPesquisador) return "Administrador e Pesquisador";
  if (isServidor) return "Administrador";
  if (isPesquisador) return "Pesquisador";
  return "—";
}

export function AppLayout({
  navItems,
  homePath,
  roleBadge,
  userName,
  userEmail,
}: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const cargo = cargoLabel(user?.role);

  const isActive = (path: string) => {
    if (path === homePath) return location.pathname === homePath;
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#ffffff", fontFamily: "Inter, sans-serif" }}
    >
      <header
        className="flex items-center px-4 shadow-sm"
        style={{ backgroundColor: "#F5C944", height: 56 }}
      >
        <button
          onClick={() => navigate(homePath)}
          className="flex items-center gap-2 mr-6 shrink-0"
        >
          <OlimpiaLogo size="sm" variant="icon" />
        </button>

        <nav className="flex items-center gap-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                color: isActive(item.path) ? "white" : "#1D2E36",
                backgroundColor: isActive(item.path) ? "#1D2E36" : "transparent",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {roleBadge && (
          <span
            className="mr-4 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: "#1D2E36", color: "white" }}
          >
            {roleBadge}
          </span>
        )}

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1 rounded-full"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#1D2E36" }}
            >
              <User size={18} color="white" />
            </div>
            <ChevronDown size={14} color="#1D2E36" />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-44 rounded-xl shadow-lg py-1 z-50"
              style={{ backgroundColor: "white", border: "1px solid #eee" }}
            >
              <div className="px-4 py-3 border-b border-gray-100">
                <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 1 }}>Usuário</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1D2E36" }}>{userName}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6, marginBottom: 1 }}>Cargo</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#1D2E36" }}>{cargo}</p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <ColorStripe orientation="vertical" />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
