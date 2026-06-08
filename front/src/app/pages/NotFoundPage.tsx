import { useNavigate } from "react-router";
import { OlimpiaLogo } from "../components/OlimpiaLogo";
import { ColorStripe } from "../components/ColorStripe";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#ffffff", fontFamily: "Inter, sans-serif" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        <OlimpiaLogo size="md" variant="full" />
        <div className="text-center">
          <p style={{ fontSize: 72, fontWeight: 900, color: "#F5C944", lineHeight: 1 }}>404</p>
          <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1D2E36", marginTop: 8 }}>
            Página não encontrada
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
            O link que você acessou não existe ou foi removido.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: "#1D2E36", color: "white" }}
          >
            Ir para o login
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ border: "1px solid #E5E7EB", color: "#374151" }}
          >
            Voltar
          </button>
        </div>
      </div>
      <ColorStripe orientation="horizontal" />
    </div>
  );
}
