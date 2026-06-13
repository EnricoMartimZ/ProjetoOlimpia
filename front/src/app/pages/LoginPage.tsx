import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { OlimpiaLogo } from "../components/OlimpiaLogo";
import { ColorStripe } from "../components/ColorStripe";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [view, setView] = useState<"welcome" | "login">("welcome");
  const [activeTab, setActiveTab] = useState<"adm" | "pesquisador">("adm");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
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

  // ---------------------------------------------------------------------------
  // Tela de boas-vindas
  // ---------------------------------------------------------------------------

  if (view === "welcome") {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "#ffffff", fontFamily: "Inter, sans-serif" }}
      >
        <div className="flex flex-1 items-center justify-between px-80 py-12">
          {/* Left side — Logo */}
          <div className="hidden md:flex flex-col items-start justify-center flex-1 max-w-md pr-8 gap-4">
            <OlimpiaLogo size="lg" variant="full" />
          </div>

          {/* Right side — Welcome card */}
          <div className="w-full max-w-sm">
            <div
              className="rounded-2xl shadow-xl overflow-hidden"
              style={{ backgroundColor: "#F5C944" }}
            >
              <div className="px-8 pt-10 pb-8">
                <h1
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 900,
                    fontSize: 42,
                    color: "#1D2E36",
                    textAlign: "left",
                    marginBottom: 6,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                  }}
                >
                  Bem-vindo!
                </h1>
                <p
                  style={{
                    fontSize: 13,
                    color: "#5A5A2A",
                    textAlign: "left",
                    marginBottom: 32,
                  }}
                >
                  Aqui você pode responder pesquisas e visualizar relatórios detalhados
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setView("login")}
                    className="w-full py-3.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#1D2E36", color: "white", fontSize: 15 }}
                  >
                    Entrar
                  </button>

                  <button
                    onClick={() => navigate("/pesquisas-publicas")}
                    className="w-full py-3.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: "white",
                      color: "#1D2E36",
                      border: "1px solid rgba(29,46,54,0.15)",
                      fontSize: 15,
                    }}
                  >
                    Pesquisas disponíveis
                  </button>

                  <button
                    onClick={() => navigate("/dados-publicos")}
                    className="w-full py-3.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: "white",
                      color: "#1D2E36",
                      border: "1px solid rgba(29,46,54,0.15)",
                      fontSize: 15,
                    }}
                  >
                    Relatórios públicos
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile logo */}
            <div className="flex justify-center mt-6 md:hidden">
              <OlimpiaLogo size="sm" variant="full" />
            </div>
          </div>
        </div>

        <ColorStripe orientation="horizontal" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Tela de login
  // ---------------------------------------------------------------------------

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#ffffff", fontFamily: "Inter, sans-serif" }}
    >
      <div className="flex flex-1 items-center justify-between px-80 py-12">
        {/* Left side — Logo */}
        <div className="hidden md:flex flex-col items-center justify-center flex-1 max-w-md pr-8">
          <OlimpiaLogo size="lg" variant="full" />
        </div>

        {/* Right side — Login card */}
        <div className="w-full max-w-sm">
          <div
            className="rounded-2xl shadow-xl overflow-hidden"
            style={{ backgroundColor: "#F5C944" }}
          >
            {/* Card header */}
            <div className="px-8 pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => { setErro(null); setView("welcome"); }}
                  className="flex items-center gap-1 text-xs font-semibold opacity-70 hover:opacity-100 transition-opacity"
                  style={{ color: "#1D2E36" }}
                >
                  <ArrowLeft size={13} />
                  Voltar
                </button>
              </div>

              <h1
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: 36,
                  color: "#1D2E36",
                  textAlign: "center",
                  marginBottom: 16,
                  letterSpacing: "-0.02em",
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
                    backgroundColor: activeTab === "adm" ? "#1D2E36" : "transparent",
                    color: activeTab === "adm" ? "white" : "#1D2E36",
                  }}
                >
                  ADM
                </button>
                <button
                  onClick={() => setActiveTab("pesquisador")}
                  className="flex-1 py-2 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: activeTab === "pesquisador" ? "#1D2E36" : "transparent",
                    color: activeTab === "pesquisador" ? "white" : "#1D2E36",
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
                <label
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#1D2E36", display: "block", marginBottom: 4 }}
                >
                  e-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite seu e-mail"
                  required
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: "white",
                    border: "1px solid rgba(0,0,0,0.1)",
                    color: "#1D2E36",
                    fontFamily: "Inter, sans-serif",
                  }}
                />
              </div>

              {/* Senha field */}
              <div>
                <label
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#1D2E36", display: "block", marginBottom: 4 }}
                >
                  senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full px-4 pr-10 py-2.5 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "white",
                      border: "1px solid rgba(0,0,0,0.1)",
                      color: "#1D2E36",
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
                    style={{ color: "#1D2E36", opacity: 0.7 }}
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
                style={{ backgroundColor: "#1D2E36", fontFamily: "Inter, sans-serif" }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>

          {/* Mobile logo */}
          <div className="flex justify-center mt-6 md:hidden">
            <OlimpiaLogo size="sm" variant="full" />
          </div>
        </div>
      </div>

      <ColorStripe orientation="horizontal" />
    </div>
  );
}
