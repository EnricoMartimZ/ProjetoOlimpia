import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Star, Loader2 } from "lucide-react";
import type { CampoHeader, RespostaLinha } from "../../services/api";

const PALETTE = ["#F5C944", "#00538C", "#009688", "#2E7D32", "#C8102E", "#7B1C1C", "#1565C0", "#E65100"];
const SCALE_COLORS = ["#C8102E", "#E65100", "#F5C944", "#009688", "#2E7D32"];

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "none",
  boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
  fontSize: 12,
};

function getValues(dados: RespostaLinha[], campoId: number): string[] {
  return dados
    .map((r) => r.valores[String(campoId)] ?? "")
    .filter((v) => v.trim() !== "");
}

// ── Card shell ──────────────────────────────────────────────────────────────

interface CardShellProps {
  label: string;
  tipo: string;
  tipoColor: string;
  total: number;
  children: React.ReactNode;
}

function CardShell({ label, tipo, tipoColor, total, children }: CardShellProps) {
  return (
    <div
      className="rounded-xl p-4 shadow-sm flex flex-col"
      style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D2E36", flex: 1, lineHeight: 1.35 }}>
          {label}
        </p>
        <div className="flex flex-col items-end shrink-0 gap-1">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
            style={{ backgroundColor: `${tipoColor}18`, color: tipoColor }}
          >
            {tipo}
          </span>
          <span style={{ fontSize: 10, color: "#9CA3AF" }}>{total} resp.</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-center py-6" style={{ fontSize: 12, color: "#D1D5DB" }}>
      Sem respostas para este campo
    </p>
  );
}

// ── multipla_escolha ────────────────────────────────────────────────────────

const MAX_LABEL = 16;
const ROW_H = 38;
const MAX_CHART_H = 280;

function truncLabel(s: string): string {
  return s.length > MAX_LABEL ? s.slice(0, MAX_LABEL) + "…" : s;
}

function MultiEscolhaCard({ campo, values }: { campo: CampoHeader; values: string[] }) {
  const counts: Record<string, number> = {};
  values.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });

  const total = values.length || 1;
  const allData = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([fullName, count], i) => ({
      name: truncLabel(fullName),
      fullName,
      count,
      pct: Math.round((count / total) * 100),
      fill: PALETTE[i % PALETTE.length],
    }));

  const chartH = Math.max(120, allData.length * ROW_H + 8);
  const needsScroll = chartH > MAX_CHART_H;

  return (
    <CardShell label={campo.texto_pergunta} tipo="Múltipla escolha" tipoColor="#00538C" total={values.length}>
      {allData.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={needsScroll ? { maxHeight: MAX_CHART_H, overflowY: "auto" } : {}}>
          <div style={{ height: chartH }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allData} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={116}
                  tick={{ fontSize: 11, fill: "#374151" }}
                  interval={0}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, _n: any, props: any) => [
                    `${props.payload.count} (${value}%)`,
                    "Respostas",
                  ]}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  labelFormatter={(label: any) => {
                    const found = allData.find(d => d.name === label);
                    return found?.fullName ?? label;
                  }}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  {allData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </CardShell>
  );
}

// ── escala ──────────────────────────────────────────────────────────────────

function EscalaCard({ campo, values }: { campo: CampoHeader; values: string[] }) {
  const nums = values.map(Number).filter((n) => !isNaN(n) && n >= 1 && n <= 5);
  const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  const roundedAvg = Math.round(avg * 10) / 10;

  const dist = [1, 2, 3, 4, 5].map((v) => {
    const count = nums.filter((n) => n === v).length;
    return { value: v, count, pct: nums.length ? Math.round((count / nums.length) * 100) : 0 };
  });

  return (
    <CardShell label={campo.texto_pergunta} tipo="Escala 1–5" tipoColor="#009688" total={nums.length}>
      <div className="flex items-center gap-3 mb-4">
        <div>
          <p style={{ fontSize: 34, fontWeight: 800, color: "#1D2E36", lineHeight: 1 }}>{roundedAvg}</p>
          <p style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>média</p>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={18}
              fill={s <= Math.round(avg) ? "#F5C944" : "none"}
              color={s <= Math.round(avg) ? "#F5C944" : "#D1D5DB"}
            />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {dist.map((d) => (
          <div key={d.value} className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: "#6B7280", width: 12 }}>{d.value}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F0EDE8" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${d.pct}%`, backgroundColor: SCALE_COLORS[d.value - 1] }}
              />
            </div>
            <span style={{ fontSize: 11, color: "#374151", width: 28, textAlign: "right" }}>
              {d.count}
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

// ── sim_nao ─────────────────────────────────────────────────────────────────

function SimNaoCard({ campo, values }: { campo: CampoHeader; values: string[] }) {
  const sim = values.filter((v) => v.toLowerCase() === "sim").length;
  const nao = values.filter((v) => ["não", "nao"].includes(v.toLowerCase())).length;
  const total = values.length || 1;

  const data = [
    { name: "Sim", value: sim, pct: Math.round((sim / total) * 100), color: "#2E7D32" },
    { name: "Não", value: nao, pct: Math.round((nao / total) * 100), color: "#C8102E" },
  ];

  return (
    <CardShell label={campo.texto_pergunta} tipo="Sim / Não" tipoColor="#2E7D32" total={values.length}>
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={56}
                dataKey="value"
                paddingAngle={3}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any, n: any, props: any) => [`${props.payload.pct}% (${v})`, n]}
                contentStyle={TOOLTIP_STYLE}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-3">
          {data.map((d) => (
            <div key={d.name}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: d.color, display: "inline-block" }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1D2E36" }}>{d.name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F0EDE8" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${d.pct}%`, backgroundColor: d.color }}
                />
              </div>
              <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>
                {d.value} de {values.length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

// ── numero ──────────────────────────────────────────────────────────────────

function NumeroCard({ campo, values }: { campo: CampoHeader; values: string[] }) {
  const nums = values.map(Number).filter((n) => !isNaN(n));
  const total = nums.length;
  const avg = total ? nums.reduce((a, b) => a + b, 0) / total : 0;
  const min = total ? Math.min(...nums) : 0;
  const max = total ? Math.max(...nums) : 0;
  const range = max - min;

  const BIN_COUNT = 6;
  const binSize = range / BIN_COUNT || 1;
  const hist = Array.from({ length: BIN_COUNT }, (_, i) => {
    const lo = min + i * binSize;
    const hi = lo + binSize;
    const count = nums.filter((n) => (i === BIN_COUNT - 1 ? n <= hi : n >= lo && n < hi)).length;
    return { label: String(i === BIN_COUNT - 1 ? Math.round(max) : Math.round(lo)), count };
  });

  const kpis = [
    { label: "Média", value: Math.round(avg * 10) / 10, color: "#00538C" },
    { label: "Mínimo", value: min, color: "#2E7D32" },
    { label: "Máximo", value: max, color: "#C8102E" },
  ];

  return (
    <CardShell label={campo.texto_pergunta} tipo="Número" tipoColor="#F5C944" total={total}>
      {total === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {kpis.map((k) => (
              <div
                key={k.label}
                className="rounded-lg p-2 text-center"
                style={{ backgroundColor: `${k.color}10`, border: `1px solid ${k.color}30` }}
              >
                <p style={{ fontSize: 17, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</p>
                <p style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>{k.label}</p>
              </div>
            ))}
          </div>
          {range > 0 && total > 4 && (
            <ResponsiveContainer width="100%" height={88}>
              <BarChart data={hist} margin={{ top: 0, right: 4, left: -26, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" name="Respostas" fill="#00538C" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </CardShell>
  );
}

// ── texto / texto_longo ─────────────────────────────────────────────────────

function TextoCard({ campo, values }: { campo: CampoHeader; values: string[] }) {
  const counts: Record<string, number> = {};
  values.forEach((v) => {
    const t = v.trim();
    if (t) counts[t] = (counts[t] || 0) + 1;
  });

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);
  const maxCount = sorted[0]?.[1] || 1;
  const unique = Object.keys(counts).length;
  const isLongo = campo.tipo === "texto_longo";

  return (
    <CardShell
      label={campo.texto_pergunta}
      tipo={isLongo ? "Texto longo" : "Texto livre"}
      tipoColor="#7B1C1C"
      total={values.length}
    >
      <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>
        {unique} resposta{unique !== 1 ? "s" : ""} única{unique !== 1 ? "s" : ""}
      </p>
      {sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {sorted.map(([text, count], i) => (
            <div key={i}>
              <div className="flex justify-between items-start gap-2 mb-0.5">
                <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.3, flex: 1 }}>
                  {text.length > 55 ? text.slice(0, 55) + "…" : text}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" }}>
                  {count}×
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#F0EDE8" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    backgroundColor: PALETTE[i % PALETTE.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}

// ── data ────────────────────────────────────────────────────────────────────

function DataCard({ campo, values }: { campo: CampoHeader; values: string[] }) {
  const byMonth: Record<string, number> = {};
  values.forEach((v) => {
    let m = "";
    if (/^\d{4}-\d{2}/.test(v)) m = v.slice(0, 7);
    else if (/^\d{2}\/\d{2}\/\d{4}/.test(v)) m = `${v.slice(6, 10)}-${v.slice(3, 5)}`;
    if (m) byMonth[m] = (byMonth[m] || 0) + 1;
  });

  const data = Object.entries(byMonth)
    .sort()
    .map(([mes, count]) => ({ mes: mes.slice(5) + "/" + mes.slice(2, 4), count }));

  return (
    <CardShell label={campo.texto_pergunta} tipo="Data" tipoColor="#1565C0" total={values.length}>
      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" name="Registros" fill="#1565C0" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </CardShell>
  );
}

// ── Field dispatcher ────────────────────────────────────────────────────────

function FieldCard({ campo, dados }: { campo: CampoHeader; dados: RespostaLinha[] }) {
  const values = getValues(dados, campo.id);
  switch (campo.tipo) {
    case "multipla_escolha":
      return <MultiEscolhaCard campo={campo} values={values} />;
    case "escala":
      return <EscalaCard campo={campo} values={values} />;
    case "sim_nao":
      return <SimNaoCard campo={campo} values={values} />;
    case "numero":
      return <NumeroCard campo={campo} values={values} />;
    case "texto":
    case "texto_longo":
      return <TextoCard campo={campo} values={values} />;
    case "data":
      return <DataCard campo={campo} values={values} />;
    default:
      return null;
  }
}

// ── Main export ─────────────────────────────────────────────────────────────

export interface SurveyStatsViewProps {
  campos: CampoHeader[];
  dados: RespostaLinha[];
  loading?: boolean;
}

export function SurveyStatsView({ campos, dados, loading }: SurveyStatsViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 gap-2" style={{ color: "#9CA3AF" }}>
        <Loader2 size={20} className="animate-spin" style={{ color: "#F5C944" }} />
        <span style={{ fontSize: 13 }}>Calculando estatísticas...</span>
      </div>
    );
  }

  if (!campos.length) {
    return (
      <p className="py-8 text-center" style={{ fontSize: 13, color: "#9CA3AF" }}>
        Selecione uma pesquisa e edição para visualizar as estatísticas.
      </p>
    );
  }

  if (!dados.length) {
    return (
      <p className="py-8 text-center" style={{ fontSize: 13, color: "#9CA3AF" }}>
        Nenhuma resposta coletada ainda para gerar estatísticas.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {campos.map((campo) => (
        <FieldCard key={campo.id} campo={campo} dados={dados} />
      ))}
    </div>
  );
}
