import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, Eye, EyeOff, ClipboardList, BarChart2 } from "lucide-react";
import { OlimpiaLogo } from "../components/OlimpiaLogo";
import { ColorStripe } from "../components/ColorStripe";
import { useAppStore } from "../context/AppStore";
import { useAuth } from "../context/AuthContext";
import { toSlug } from "../../lib/constants";

export function LoginPage() {
  const navigate = useNavigate();
  const { researches } = useAppStore();
  const { login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"adm" | "pesquisador">("adm");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const authUser = await login(email, senha);
      const roles = authUser.role.split(",");
      const roleEsperado = activeTab === "adm" ? "servidor" : "pesquisador_campo";
      if (!roles.includes(roleEsperado)) {
        logout();
        setErro(
          activeTab === "adm"
            ? "Esta conta não tem perfil de administrador."
            : "Esta conta não tem perfil de pesquisador de campo."
        );
        return;
      }
      navigate(activeTab === "adm" ? "/admin" : "/pesquisador");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#ffffff", fontFamily: "Inter, sans-serif" }}
    >
      {/* Main content */}
      <div className="flex flex-1 items-center justify-between px-80 py-12">
        {/* Left side — Logo */}
        <div className="hidden md:flex flex-col items-center justify-center flex-1 max-w-md pr-8">
          <OlimpiaLogo size="lg" variant="full" />
        </div>


        {/* Right side — Login card */}
        <div className="w-full max-w-sm">
          <div
            className="rounded-2xl shadow-xl overflow-hidden"
            style={{ backgroundColor: "#F5C100" }}
          >
            {/* Card header */}
            <div className="px-8 pt-6 pb-4">
              <h1
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  fontSize: 28,
                  color: "#1B1D40",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                Login
              </h1>

              {/* Tabs */}
              <div className="flex rounded-xl overflow-hidden border border-yellow-600/30 mb-6">
                <button
                  onClick={() => setActiveTab("adm")}
                  className="flex-1 py-2 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: activeTab === "adm" ? "#1B1D40" : "transparent",
                    color: activeTab === "adm" ? "white" : "#1B1D40",
                  }}
                >
                  ADM
                </button>
                <button
                  onClick={() => setActiveTab("pesquisador")}
                  className="flex-1 py-2 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: activeTab === "pesquisador" ? "#1B1D40" : "transparent",
                    color: activeTab === "pesquisador" ? "white" : "#1B1D40",
                  }}
                >
                  Pesquisador
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="px-8 pb-8 flex flex-col gap-4">
              {/* E-mail field */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label
                    style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#1B1D40" }}
                  >
                    e-mail
                  </label>
                </div>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "white",
                      border: "1px solid rgba(0,0,0,0.1)",
                      color: "#1B1D40",
                      fontFamily: "Inter, sans-serif",
                    }}
                  />
                </div>
              </div>

              {/* Senha field */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label
                    style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#1B1D40" }}
                  >
                    senha
                  </label>
                </div>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "white",
                      border: "1px solid rgba(0,0,0,0.1)",
                      color: "#1B1D40",
                      fontFamily: "Inter, sans-serif",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="text-right mt-1">
                  <button
                    type="button"
                    className="text-xs underline"
                    style={{ color: "#1B1D40", opacity: 0.7 }}
                  >
                    esqueci minha senha
                  </button>
                </div>
              </div>

              {/* Erro */}
              {erro && (
                <p
                  className="text-sm text-center rounded-lg px-3 py-2"
                  style={{ backgroundColor: "rgba(200,16,46,0.12)", color: "#C8102E", fontFamily: "Inter, sans-serif" }}
                >
                  {erro}
                </p>
              )}

              {/* Entrar button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-base mt-2 transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
                style={{ backgroundColor: "#1B1D40", fontFamily: "Inter, sans-serif" }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>

              {/* Public access links */}
              <div
                className="flex flex-col gap-1.5 pt-3"
                style={{ borderTop: "1px solid rgba(27,29,64,0.15)" }}
              >
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1B1D40", textAlign: "center" }}>
                  Acesso público?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const r = researches.find((r) =>
                      r.nome.toLowerCase().includes("percep")
                    );
                    navigate(`/pesquisa/${r ? toSlug(r.nome) : "percepcao-do-turismo"}`);
                  }}
                  className="flex items-center gap-2 text-xs underline"
                  style={{ color: "#1B1D40", opacity: 0.8 }}
                >
                  <ClipboardList size={13} className="shrink-0" />
                  Responder a uma pesquisa
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dados-publicos")}
                  className="flex items-center gap-2 text-xs underline"
                  style={{ color: "#1B1D40", opacity: 0.8 }}
                >
                  <BarChart2 size={13} className="shrink-0" />
                  Ver estatísticas públicas
                </button>
              </div>
            </form>
          </div>

          {/* Mobile logo */}
          <div className="flex justify-center mt-6 md:hidden">
            <OlimpiaLogo size="sm" variant="full" />
          </div>
        </div>
      </div>

      {/* Bottom stripe */}
      <ColorStripe orientation="horizontal" />
    </div>
  );
}
