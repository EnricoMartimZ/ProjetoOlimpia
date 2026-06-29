import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ClipboardList, Loader2, ExternalLink, Search } from "lucide-react";
import { OlimpiaLogo } from "../components/OlimpiaLogo";
import { ColorStripe } from "../components/ColorStripe";
import { getPesquisas, type PesquisaListItem } from "../../services/api";
import { isPublico } from "../data/pesquisasPublicas";

const ACCENT_COLORS = ["#F5C944", "#00538C", "#009688", "#C8102E"];

export function PublicSurveysListPage() {
  const navigate = useNavigate();
  const [pesquisas, setPesquisas] = useState<PesquisaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    getPesquisas()
      .then((data) => {
        const disponiveis = data.filter(
          (p) =>
            p.tipo === "publica" &&
            p.status === "ativa" &&
            p.edicao_atual_id !== null &&
            isPublico(p.id)
        );
        setPesquisas(disponiveis);
      })
      .catch(() => setErro("Não foi possível carregar as pesquisas."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#ffffff", fontFamily: "Inter, sans-serif" }}
    >
      <header style={{ backgroundColor: "#F5C944" }}>
        <div className="px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
          <OlimpiaLogo size="sm" variant="icon" />
          <div className="text-center flex-1 px-4">
            <h1 style={{ fontWeight: 800, fontSize: 18, color: "#1D2E36" }}>
              Pesquisas Disponíveis
            </h1>
            <p style={{ fontSize: 12, color: "#5A5A2A" }}>
              Secretaria de Turismo de Olímpia — participe e contribua
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: "#1D2E36", color: "white" }}
          >
            <ArrowLeft size={13} />
            Voltar
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin" style={{ color: "#F5C944" }} />
            <p style={{ fontSize: 14, color: "#6B7280" }}>Carregando pesquisas...</p>
          </div>
        )}

        {erro && (
          <div
            className="rounded-xl p-5 text-center"
            style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}
          >
            <p style={{ fontSize: 14, color: "#C62828" }}>{erro}</p>
          </div>
        )}

        {!loading && !erro && pesquisas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="p-5 rounded-full"
              style={{ backgroundColor: "#F5F5F5" }}
            >
              <Search size={32} style={{ color: "#9CA3AF" }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#1D2E36" }}>
              Nenhuma pesquisa disponível no momento
            </p>
            <p style={{ fontSize: 13, color: "#6B7280" }}>
              Volte em breve — novas pesquisas são lançadas regularmente.
            </p>
          </div>
        )}

        {!loading && !erro && pesquisas.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pesquisas.map((p, i) => (
                <div
                  key={p.id}
                  className="rounded-xl overflow-hidden shadow-sm flex flex-col"
                  style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
                >
                  <div
                    className="h-1.5"
                    style={{ backgroundColor: ACCENT_COLORS[i % ACCENT_COLORS.length] }}
                  />
                  <div className="p-5 flex flex-col flex-1">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${ACCENT_COLORS[i % ACCENT_COLORS.length]}22` }}
                    >
                      <ClipboardList size={18} style={{ color: ACCENT_COLORS[i % ACCENT_COLORS.length] }} />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#1D2E36", marginBottom: 6, lineHeight: 1.3 }}>
                      {p.nome}
                    </p>
                    {p.descricao && (
                      <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 12, lineHeight: 1.5 }}>
                        {p.descricao}
                      </p>
                    )}
                    <div className="mt-auto pt-3" style={{ borderTop: "1px solid #F0EDE8" }}>
                      <button
                        onClick={() => navigate(`/pesquisa/${p.edicao_atual_id}`)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                        style={{ backgroundColor: "#1D2E36", color: "white" }}
                      >
                        Responder
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <ColorStripe orientation="horizontal" />
    </div>
  );
}
