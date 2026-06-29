import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, BarChart2, FileText, Download } from "lucide-react";
import { OlimpiaLogo } from "../components/OlimpiaLogo";
import { ColorStripe } from "../components/ColorStripe";
import { SurveyStatsView } from "../components/SurveyStatsView";
import { getRelatoriosDisponiveis, getRelatoriosPublicados } from "../data/relatorios";
import { getSnapshotsPublicos } from "../data/pesquisasPublicas";

// PDF assets — indexed at build time via Vite glob import
const PDF_URLS = import.meta.glob(
  "../../assets/relatorios/*.pdf",
  { query: "?url", import: "default", eager: true },
) as Record<string, string>;

function getPdfUrl(arquivo: string | undefined): string | undefined {
  if (!arquivo) return undefined;
  return PDF_URLS[`../../assets/relatorios/${arquivo}`];
}

const CARD_COLORS = ["#00538C", "#F5C944", "#C8102E", "#2E7D32"];

export function PublicStatsPage() {
  const navigate = useNavigate();

  const snapshots = useMemo(() => getSnapshotsPublicos(), []);
  const surveyOptions = useMemo(
    () =>
      snapshots.map((s) => ({
        id: String(s.pesquisaId),
        label: s.nome,
        campos: s.campos,
        dados: s.dados,
      })),
    [snapshots],
  );

  const [activeSurvey, setActiveSurvey] = useState(() => surveyOptions[0]?.id ?? "");
  const current = surveyOptions.find((s) => s.id === activeSurvey) ?? surveyOptions[0];

  const todosRelatorios = getRelatoriosDisponiveis();
  const publicados = getRelatoriosPublicados();
  const relatoriosVisiveis = todosRelatorios.filter(
    (r) => r.publicadoPorPadrao || publicados.includes(r.id),
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#ffffff", fontFamily: "Inter, sans-serif" }}
    >
      {/* Header */}
      <header style={{ backgroundColor: "#F5C944" }}>
        <div className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
          <OlimpiaLogo size="sm" variant="icon" />
          <div className="text-center flex-1 px-4">
            <h1 style={{ fontWeight: 800, fontSize: 18, color: "#1D2E36" }}>
              Painel de Dados do Turismo
            </h1>
            <p style={{ fontSize: 12, color: "#5A5A2A" }}>
              Transparência pública — Secretaria de Turismo de Olímpia
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

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-8">

        {/* PDF Reports section */}
        {relatoriosVisiveis.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#F5C94430" }}>
                <FileText size={16} style={{ color: "#F5C944" }} />
              </div>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1D2E36" }}>
                  Relatórios Disponíveis
                </h2>
                <p style={{ fontSize: 13, color: "#6B7280", marginTop: 1 }}>
                  Documentos publicados pela Secretaria de Turismo de Olímpia
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {relatoriosVisiveis.map((rel, i) => {
                const color = CARD_COLORS[i % 4];
                return (
                  <div
                    key={rel.id}
                    className="rounded-xl overflow-hidden shadow-sm"
                    style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
                  >
                    <div className="h-1.5" style={{ backgroundColor: color }} />
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="p-2 rounded-lg shrink-0"
                          style={{ backgroundColor: `${color}25` }}
                        >
                          <FileText size={18} style={{ color }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#1D2E36", lineHeight: 1.3 }}>
                            {rel.titulo}
                          </p>
                          <p style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                            {rel.tipo} · {rel.periodo}
                          </p>
                        </div>
                      </div>
                      <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 14 }}>{rel.descricao}</p>
                      {(() => {
                        const pdfUrl = getPdfUrl(rel.arquivo);
                        return pdfUrl ? (
                          <a
                            href={pdfUrl}
                            download={rel.arquivo}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold"
                            style={{ backgroundColor: "#1D2E36", color: "white" }}
                          >
                            <Download size={14} />
                            Baixar relatório
                          </a>
                        ) : (
                          <button
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold opacity-60 cursor-not-allowed"
                            style={{ backgroundColor: "#1D2E36", color: "white" }}
                            disabled
                          >
                            <Download size={14} />
                            Em elaboração
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Resultados por pergunta */}
        <section
          className="rounded-xl p-5 shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#F5C94430" }}>
                <BarChart2 size={16} style={{ color: "#F5C944" }} />
              </div>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 15, color: "#1D2E36" }}>
                  Resultados por Pergunta
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>
                  Visualização Rápida
                </p>
              </div>
            </div>

            {surveyOptions.length > 0 && (
              <select
                value={activeSurvey}
                onChange={(e) => setActiveSurvey(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  border: "1px solid #E5E7EB",
                  backgroundColor: "white",
                  color: "#1D2E36",
                  minWidth: 200,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {surveyOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            )}
          </div>

          {surveyOptions.length === 0 ? (
            <p
              className="text-center py-10"
              style={{ fontSize: 13, color: "#9CA3AF" }}
            >
              Nenhuma pesquisa publicada para visualização ainda.
            </p>
          ) : (
            <SurveyStatsView campos={current.campos} dados={current.dados} />
          )}
        </section>

      </main>

      <ColorStripe orientation="horizontal" />
    </div>
  );
}
