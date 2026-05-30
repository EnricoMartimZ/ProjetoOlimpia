import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { ClipboardList, CheckCircle, Clock, Award } from "lucide-react";
import { monthlyData } from "../../data/mockData";
import { useAppStore } from "../../context/AppStore";

const myStats = [
  { label: "Formulários Respondidos", value: "328", icon: ClipboardList, color: "#F5C100" },
  { label: "Este Mês", value: "47", icon: Clock, color: "#00538C" },
  { label: "Completos", value: "316", icon: CheckCircle, color: "#2E7D32" },
  { label: "Taxa de Aprovação", value: "96%", icon: Award, color: "#C8102E" },
];

const myDaily = [
  { dia: "Seg", respostas: 12 },
  { dia: "Ter", respostas: 18 },
  { dia: "Qua", respostas: 9 },
  { dia: "Qui", respostas: 21 },
  { dia: "Sex", respostas: 15 },
  { dia: "Sáb", respostas: 7 },
  { dia: "Dom", respostas: 3 },
];

export function ResearcherDashboard() {
  const { researches } = useAppStore();
  const activeResearches = researches.filter((r) => r.status === "ativa");

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1B1D40" }}>
          Painel do Pesquisador
        </h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
          Olá, Ana Paula! Veja seu desempenho e as pesquisas disponíveis
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {myStats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="rounded-xl p-4 shadow-sm"
              style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${s.color}22` }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#1B1D40", lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly performance */}
        <div
          className="rounded-xl p-4 shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
        >
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1B1D40", marginBottom: 4 }}>
            Minha Performance Semanal
          </h3>
          <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>Respostas coletadas por dia</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={myDaily} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
              />
              <Bar dataKey="respostas" name="Respostas" radius={[4, 4, 0, 0]}>
                {myDaily.map((_, i) => (
                  <Cell key={i} fill={i === 3 ? "#F5C100" : "#00538C"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly trend */}
        <div
          className="rounded-xl p-4 shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
        >
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1B1D40", marginBottom: 4 }}>
            Tendência de Coleta — 2026
          </h3>
          <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>Total de respostas por mês</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5C100" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#F5C100" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }} />
              <Area type="monotone" dataKey="respostas" name="Respostas" stroke="#F5C100" strokeWidth={2} fill="url(#gradR)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active researches */}
      <div
        className="rounded-xl p-5 shadow-sm"
        style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
      >
        <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1B1D40", marginBottom: 16 }}>
          Pesquisas Disponíveis para Coleta
        </h3>
        <div className="space-y-3">
          {activeResearches.map((r, i) => (
            <div
              key={r.id}
              className="flex items-center gap-4 rounded-xl p-4"
              style={{ backgroundColor: "#F9F9F9", border: "1px solid #F0EDE8" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                style={{ backgroundColor: ["#F5C100", "#00538C", "#2E7D32", "#C8102E"][i % 4], color: "white" }}
              >
                {r.nome.charAt(0)}
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1B1D40" }}>{r.nome}</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>{r.descricao}</p>
              </div>
              <div className="text-right">
                <p style={{ fontSize: 12, color: "#2E7D32", fontWeight: 600 }}>{r.edicoes}ª edição ativa</p>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>{r.campos.length} campos</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
