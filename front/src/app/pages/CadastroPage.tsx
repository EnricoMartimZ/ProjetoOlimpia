import { useState } from "react";
import { useNavigate } from "react-router";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { OlimpiaLogo } from "../components/OlimpiaLogo";
import { ColorStripe } from "../components/ColorStripe";
import { cadastrar } from "../../services/api";

export function CadastroPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<"servidor" | "pesquisador_campo">("pesquisador_campo");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      await cadastrar({ nome, email, senha, role });
      navigate("/", { state: { cadastroSucesso: true } });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

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

        {/* Right side — Card */}
        <div className="w-full max-w-sm">
          <div
            className="rounded-2xl shadow-xl overflow-hidden"
            style={{ backgroundColor: "#F5C100" }}
          >
            <div className="px-8 pt-6 pb-4">
              <h1
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  fontSize: 28,
                  color: "#1B1D40",
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                Cadastro
              </h1>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  color: "#1B1D40",
                  textAlign: "center",
                  opacity: 0.7,
                  marginBottom: 16,
                }}
              >
                Crie sua conta para acessar o sistema
              </p>
            </div>

            <form onSubmit={handleCadastro} className="px-8 pb-8 flex flex-col gap-4">
              {/* Nome */}
              <div>
                <label
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#1B1D40", display: "block", marginBottom: 4 }}
                >
                  nome
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: "white", border: "1px solid rgba(0,0,0,0.1)", color: "#1B1D40", fontFamily: "Inter, sans-serif" }}
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#1B1D40", display: "block", marginBottom: 4 }}
                >
                  e-mail
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: "white", border: "1px solid rgba(0,0,0,0.1)", color: "#1B1D40", fontFamily: "Inter, sans-serif" }}
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#1B1D40", display: "block", marginBottom: 4 }}
                >
                  senha
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Crie uma senha"
                    required
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: "white", border: "1px solid rgba(0,0,0,0.1)", color: "#1B1D40", fontFamily: "Inter, sans-serif" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Perfil */}
              <div>
                <label
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#1B1D40", display: "block", marginBottom: 4 }}
                >
                  perfil
                </label>
                <div className="flex rounded-xl overflow-hidden border border-yellow-600/30">
                  <button
                    type="button"
                    onClick={() => setRole("servidor")}
                    className="flex-1 py-2 text-sm font-semibold transition-colors"
                    style={{
                      backgroundColor: role === "servidor" ? "#1B1D40" : "transparent",
                      color: role === "servidor" ? "white" : "#1B1D40",
                    }}
                  >
                    ADM
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("pesquisador_campo")}
                    className="flex-1 py-2 text-sm font-semibold transition-colors"
                    style={{
                      backgroundColor: role === "pesquisador_campo" ? "#1B1D40" : "transparent",
                      color: role === "pesquisador_campo" ? "white" : "#1B1D40",
                    }}
                  >
                    Pesquisador
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

              {/* Criar conta */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-base mt-2 transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
                style={{ backgroundColor: "#1B1D40", fontFamily: "Inter, sans-serif" }}
              >
                {loading ? "Criando conta..." : "Criar conta"}
              </button>

              {/* Voltar */}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm text-center underline"
                style={{ color: "#1B1D40", opacity: 0.7 }}
              >
                Já tenho conta — fazer login
              </button>
            </form>
          </div>
        </div>
      </div>

      <ColorStripe orientation="horizontal" />
    </div>
  );
}
