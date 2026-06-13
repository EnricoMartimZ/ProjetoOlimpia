import { useNavigate } from "react-router";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, Star, Building2, ArrowLeft, ExternalLink } from "lucide-react";
import { OlimpiaLogo } from "../components/OlimpiaLogo";
import { ColorStripe } from "../components/ColorStripe";
import { useAppStore } from "../context/AppStore";
import { toSlug } from "../../lib/constants";
import { kpiData, monthlyData, originData, occupancyByType } from "../data/mockData";

const KPI_ICONS = [TrendingUp, Users, Star, Building2];
const KPI_COLORS = ["#F5C944", "#00538C", "#009688", "#2E7D32"];

const SATISFACAO_DATA = [
  { label: "Excelente (5)", value: 48, color: "#2E7D32" },
  { label: "Bom (4)", value: 31, color: "#009688" },
  { label: "Regular (3)", value: 13, color: "#F5C944" },
  { label: "Ruim (1-2)", value: 8, color: "#C8102E" },
];

export function PublicStatsPage() {
  const navigate = useNavigate();
  const { researches } = useAppStore();

  const activeResearches = researches.filter((r) => r.status === "ativa");

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

        {/* KPIs */}
        <section>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1D2E36", marginBottom: 12 }}>
            Olímpia em Números — 2026
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiData.map((kpi, i) => {
              const Icon = KPI_ICONS[i];
              return (
                <div
                  key={i}
                  className="rounded-xl p-4 shadow-sm"
                  style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${KPI_COLORS[i]}22` }}>
                      <Icon size={18} style={{ color: KPI_COLORS[i] }} />
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: kpi.positive ? "#E8F5E9" : "#FFEBEE",
                        color: kpi.positive ? "#2E7D32" : "#C62828",
                      }}
                    >
                      {kpi.change}
                    </span>
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 800, color: "#1D2E36", lineHeight: 1.2 }}>
                    {kpi.value}
                  </p>
                  <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{kpi.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly tourists */}
          <div
            className="lg:col-span-2 rounded-xl p-5 shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
          >
            <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1D2E36", marginBottom: 4 }}>
              Turistas Atendidos por Mês
            </h3>
            <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>Jan – Mai 2026</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pubGradT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5C944" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F5C944" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pubGradR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00538C" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00538C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }} labelStyle={{ fontWeight: 600 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="turistas" name="Turistas" stroke="#F5C944" strokeWidth={2} fill="url(#pubGradT)" />
                <Area type="monotone" dataKey="respostas" name="Respostas coletadas" stroke="#00538C" strokeWidth={2} fill="url(#pubGradR)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Origin pie */}
          <div
            className="rounded-xl p-5 shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
          >
            <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1D2E36", marginBottom: 4 }}>
              Origem dos Visitantes
            </h3>
            <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Por região de procedência</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={originData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                  {originData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`]} contentStyle={{ borderRadius: 8, border: "none" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-1">
              {originData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span style={{ color: "#374151" }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: "#1D2E36" }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Occupancy */}
          <div
            className="rounded-xl p-5 shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
          >
            <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1D2E36", marginBottom: 4 }}>
              Taxa de Ocupação por Tipo de Hospedagem
            </h3>
            <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>Média do período (em %)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={occupancyByType} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
                <XAxis dataKey="tipo" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none" }} />
                <Bar dataKey="ocupacao" name="Ocupação (%)" radius={[4, 4, 0, 0]}>
                  {occupancyByType.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? "#F5C944" : "#00538C"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Satisfaction */}
          <div
            className="rounded-xl p-5 shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
          >
            <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1D2E36", marginBottom: 4 }}>
              Satisfação dos Visitantes
            </h3>
            <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 16 }}>
              Avaliação da experiência em Olímpia
            </p>
            <div className="space-y-3">
              {SATISFACAO_DATA.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "#374151" }}>{item.label}</span>
                    <span style={{ fontWeight: 600, color: "#1D2E36" }}>{item.value}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F0EDE8" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.value}%`, backgroundColor: item.color, transition: "width 0.5s ease" }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div
              className="mt-4 rounded-xl p-3 flex items-center gap-3"
              style={{ backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7" }}
            >
              <Star size={18} fill="#2E7D32" color="#2E7D32" />
              <div>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#1D2E36", lineHeight: 1 }}>4.3 / 5</p>
                <p style={{ fontSize: 11, color: "#2E7D32" }}>Média geral de avaliação</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active public surveys */}
        {activeResearches.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1D2E36" }}>
                Participe das Nossas Pesquisas
              </h2>
              <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                Sua opinião ajuda a melhorar o turismo em Olímpia. Responda gratuitamente.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeResearches.map((r, i) => (
                <div
                  key={r.id}
                  className="rounded-xl overflow-hidden shadow-sm"
                  style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
                >
                  <div
                    className="h-1.5"
                    style={{ backgroundColor: ["#F5C944", "#00538C", "#009688", "#C8102E"][i % 4] }}
                  />
                  <div className="p-4">
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1D2E36", marginBottom: 4 }}>
                      {r.nome}
                    </p>
                    <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>{r.descricao}</p>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>{r.campos.length} perguntas · ~2 min</span>
                      <button
                        onClick={() => navigate(`/pesquisa/${toSlug(r.nome)}`)}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: "#F5C944", color: "#1D2E36" }}
                      >
                        Responder
                        <ExternalLink size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info footer */}
        <div
          className="rounded-xl p-5 text-center"
          style={{ backgroundColor: "#1D2E36" }}
        >
          <p style={{ fontSize: 13, color: "#F5C944", fontWeight: 700, marginBottom: 4 }}>
            Prefeitura da Estância Turística de Olímpia
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            Secretaria de Turismo · Dados atualizados mensalmente
          </p>
        </div>
      </main>

      <ColorStripe orientation="horizontal" />
    </div>
  );
}
