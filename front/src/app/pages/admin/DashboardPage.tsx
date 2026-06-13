import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, ClipboardList, Building2 } from "lucide-react";
import { kpiData, monthlyData, originData, occupancyByType } from "../../data/mockData";

const KPI_ICONS = [TrendingUp, Users, ClipboardList, Building2];
const KPI_COLORS = ["#F5C944", "#00538C", "#009688", "#2E7D32"];

export function DashboardPage() {
  return (
    <div className="p-6 space-y-6" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1D2E36" }}>
          Painel de Visualização
        </h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
          Dados consolidados das pesquisas de turismo de Olímpia — 2026
        </p>
      </div>

      {/* KPI Cards */}
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
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${KPI_COLORS[i]}22` }}
                >
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

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <div
          className="lg:col-span-2 rounded-xl p-4 shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
        >
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1D2E36", marginBottom: 4 }}>
            Turistas Atendidos por Mês
          </h3>
          <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>Jan – Mai 2026</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTuristas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5C944" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#F5C944" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRespostas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00538C" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#00538C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
                labelStyle={{ fontWeight: 600, color: "#1D2E36" }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="turistas" name="Turistas" stroke="#F5C944" strokeWidth={2} fill="url(#gradTuristas)" />
              <Area type="monotone" dataKey="respostas" name="Respostas" stroke="#00538C" strokeWidth={2} fill="url(#gradRespostas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart - origin */}
        <div
          className="rounded-xl p-4 shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
        >
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1D2E36", marginBottom: 4 }}>
            Origem dos Turistas
          </h3>
          <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Por região de procedência</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={originData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                {originData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}%`]}
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
              />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart - occupancy by type */}
        <div
          className="rounded-xl p-4 shadow-sm"
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
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
              />
              <Bar dataKey="ocupacao" name="Ocupação (%)" radius={[4, 4, 0, 0]}>
                {occupancyByType.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? "#F5C944" : "#00538C"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart - revenue */}
        <div
          className="rounded-xl p-4 shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
        >
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1D2E36", marginBottom: 4 }}>
            Diária Média por Tipo de Hospedagem
          </h3>
          <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>Valor médio em R$ (mai/2026)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={occupancyByType} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
              <XAxis dataKey="tipo" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Tooltip
                formatter={(v) => [`R$ ${v}`]}
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
              />
              <Bar dataKey="receita" name="Diária Média (R$)" radius={[4, 4, 0, 0]}>
                {occupancyByType.map((_, i) => (
                  <Cell key={i} fill={["#C8102E", "#F5C944", "#009688", "#00538C", "#2E7D32"][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pesquisas ativas */}
      <div
        className="rounded-xl p-4 shadow-sm"
        style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
      >
        <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1D2E36", marginBottom: 12 }}>
          Pesquisas Ativas
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { nome: "Demanda Turística", edicao: "2ª Ed. 2026", respostas: 312, cor: "#F5C944" },
            { nome: "Percepção do Turismo", edicao: "2ª Ed. 2026", respostas: 128, cor: "#00538C" },
            { nome: "Taxa de Ocupação", edicao: "5ª Ed. 2026", respostas: 47, cor: "#009688" },
            { nome: "Fluxo de Turistas", edicao: "7ª Ed. 2026", respostas: 93, cor: "#2E7D32" },
          ].map((p, i) => (
            <div
              key={i}
              className="rounded-lg p-3"
              style={{ backgroundColor: "#F9F9F9", border: `2px solid ${p.cor}33` }}
            >
              <div
                className="w-full h-1 rounded-full mb-3"
                style={{ backgroundColor: p.cor }}
              />
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1D2E36" }}>{p.nome}</p>
              <p style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{p.edicao}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: p.cor, marginTop: 8 }}>{p.respostas}</p>
              <p style={{ fontSize: 11, color: "#6B7280" }}>respostas</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
