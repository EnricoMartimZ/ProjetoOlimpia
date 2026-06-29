import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { ClipboardList, CheckCircle, Clock, BarChart2, AlertCircle, RefreshCw } from "lucide-react";
import {
  getEdicoesCampo, getRespostas,
  type EdicaoAPI, type CampoHeader, type RespostaLinha,
} from "../../../services/api";
import { SurveyStatsView } from "../../components/SurveyStatsView";
import { useAuth } from "../../context/AuthContext";

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "none",
  boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
  fontSize: 12,
};

interface PersonalStats {
  total: number;
  esteMes: number;
  edicoesAtivas: number;
  edicoesParticipadas: number;
  porEdicao: Array<{ label: string; coletas: number }>;
  porMes: Array<{ mes: string; coletas: number }>;
}

export function ResearcherDashboard() {
  const { user } = useAuth();

  // ── Available editions ────────────────────────────────────────────────────
  const [edicoes, setEdicoes]         = useState<EdicaoAPI[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError]     = useState<string | null>(null);

  // ── Personal stats ────────────────────────────────────────────────────────
  const [personal, setPersonal]           = useState<PersonalStats | null>(null);
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selectedNome, setSelectedNome]         = useState<string>("");
  const [selectedEdicaoId, setSelectedEdicaoId] = useState<number | 0>(0);

  // ── Stats view ────────────────────────────────────────────────────────────
  const [camposHeader, setCamposHeader] = useState<CampoHeader[]>([]);
  const [dados, setDados]               = useState<RespostaLinha[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError]     = useState<string | null>(null);

  // Load available campo editions on mount
  useEffect(() => {
    setLoadingList(true);
    getEdicoesCampo()
      .then((data) => {
        setEdicoes(data);
        if (data.length > 0) {
          setSelectedNome(data[0].pesquisa_nome);
          setSelectedEdicaoId(data[0].id);
        }
      })
      .catch((e) => setListError(e instanceof Error ? e.message : "Erro ao carregar pesquisas."))
      .finally(() => setLoadingList(false));
  }, []);

  // Load personal stats after editions are available
  useEffect(() => {
    if (edicoes.length === 0 || !user?.nome) return;
    setLoadingPersonal(true);
    const myNome = user.nome;
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();

    Promise.all(
      edicoes.map((ed) =>
        getRespostas(ed.id, { pagina: 1, por_pagina: 500 }).then((r) => ({
          ed,
          mine: r.dados.filter((d) => d.usuario_nome === myNome),
        }))
      )
    )
      .then((results) => {
        const allMine = results.flatMap((r) => r.mine);

        const total = allMine.length;

        const esteMes = allMine.filter((r) => {
          const d = new Date(r.timestamp_envio);
          return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
        }).length;

        const edicoesAtivas = edicoes.filter((e) => e.status === "ativa").length;

        const porEdicao = results
          .filter((r) => r.mine.length > 0)
          .map((r) => ({
            label: `${r.ed.numero_edicao}ª ed.`,
            coletas: r.mine.length,
            pesquisa: r.ed.pesquisa_nome,
          }));

        const edicoesParticipadas = porEdicao.length;

        // Group by YYYY-MM
        const byMonth: Record<string, number> = {};
        allMine.forEach((r) => {
          const ym = r.timestamp_envio.slice(0, 7);
          byMonth[ym] = (byMonth[ym] || 0) + 1;
        });
        const porMes = Object.entries(byMonth)
          .sort()
          .map(([ym, coletas]) => ({
            mes: ym.slice(5) + "/" + ym.slice(2, 4),
            coletas,
          }));

        setPersonal({ total, esteMes, edicoesAtivas, edicoesParticipadas, porEdicao, porMes });
      })
      .catch(() => {})
      .finally(() => setLoadingPersonal(false));
  }, [edicoes, user?.nome]);

  // Group editions by pesquisa_nome
  const groups = useMemo(() => {
    return edicoes.reduce<Record<string, EdicaoAPI[]>>((acc, ed) => {
      if (!acc[ed.pesquisa_nome]) acc[ed.pesquisa_nome] = [];
      acc[ed.pesquisa_nome].push(ed);
      return acc;
    }, {});
  }, [edicoes]);

  const pesquisaNomes = Object.keys(groups);
  const edicoesDoGrupo = selectedNome ? (groups[selectedNome] ?? []) : [];
  const edicaoAtual = edicoes.find((e) => e.id === selectedEdicaoId) ?? null;

  const handleSelectNome = (nome: string) => {
    setSelectedNome(nome);
    const eds = groups[nome] ?? [];
    if (eds.length > 0) setSelectedEdicaoId(eds[0].id);
  };

  const fetchStats = useCallback(async () => {
    if (!selectedEdicaoId) {
      setCamposHeader([]); setDados([]); return;
    }
    setLoadingStats(true);
    setStatsError(null);
    try {
      const tab = await getRespostas(selectedEdicaoId, { pagina: 1, por_pagina: 500 });
      setCamposHeader(tab.campos_header);
      setDados(tab.dados);
    } catch (e) {
      setCamposHeader([]); setDados([]);
      setStatsError(e instanceof Error ? e.message : "Erro ao carregar estatísticas.");
    } finally {
      setLoadingStats(false);
    }
  }, [selectedEdicaoId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── KPI cards config ──────────────────────────────────────────────────────
  const kpis = [
    {
      label: "Total de coletas",
      value: loadingPersonal ? "…" : (personal?.total ?? "—"),
      sub: "em todas as edições",
      color: "#F5C944",
      Icon: ClipboardList,
    },
    {
      label: "Coletas este mês",
      value: loadingPersonal ? "…" : (personal?.esteMes ?? "—"),
      sub: new Date().toLocaleString("pt-BR", { month: "long", year: "numeric" }),
      color: "#00538C",
      Icon: Clock,
    },
    {
      label: "Edições participadas",
      value: loadingPersonal ? "…" : (personal?.edicoesParticipadas ?? "—"),
      sub: `${personal?.edicoesAtivas ?? "—"} ativas para coleta`,
      color: "#2E7D32",
      Icon: CheckCircle,
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6" style={{ fontFamily: "Inter, sans-serif" }}>

      <div>
        <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1D2E36" }}>Painel do Pesquisador</h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
          Pesquisas de campo disponíveis para coleta e visualização
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.Icon;
          return (
            <div
              key={i}
              className="rounded-xl p-4 shadow-sm"
              style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${k.color}18` }}>
                  <Icon size={18} style={{ color: k.color }} />
                </div>
              </div>
              <p style={{ fontSize: 32, fontWeight: 800, color: "#1D2E36", lineHeight: 1 }}>
                {k.value}
              </p>
              <p style={{ fontSize: 13, color: "#374151", fontWeight: 600, marginTop: 4 }}>
                {k.label}
              </p>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts — only when there's data */}
      {personal && personal.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Coletas por edição */}
          {personal.porEdicao.length > 0 && (
            <div
              className="rounded-xl p-5 shadow-sm"
              style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
            >
              <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1D2E36", marginBottom: 4 }}>
                Coletas por Edição
              </h3>
              <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>
                Respostas registradas por você em cada edição
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={personal.porEdicao}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="coletas" name="Coletas" radius={[4, 4, 0, 0]}>
                    {personal.porEdicao.map((_, i) => (
                      <Cell
                        key={i}
                        fill={["#F5C944", "#00538C", "#009688", "#2E7D32", "#C8102E"][i % 5]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Distribuição mensal */}
          {personal.porMes.length > 0 && (
            <div
              className="rounded-xl p-5 shadow-sm"
              style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
            >
              <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1D2E36", marginBottom: 4 }}>
                Distribuição Mensal
              </h3>
              <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>
                Total de coletas registradas por mês
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={personal.porMes}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#6B7280" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="coletas" name="Coletas" fill="#00538C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>
      )}

      {/* Survey stats section */}
      <div
        className="rounded-xl p-5 shadow-sm"
        style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#F5C94422" }}>
              <BarChart2 size={16} style={{ color: "#F5C944" }} />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1D2E36" }}>
                Estatísticas das Pesquisas
              </h3>
              <p style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>
                {edicaoAtual
                  ? `${edicaoAtual.pesquisa_nome} — ${edicaoAtual.numero_edicao}ª edição`
                  : "Selecione uma pesquisa"}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap items-end">
            {pesquisaNomes.length > 0 && (
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 2 }}>
                  PESQUISA
                </label>
                <select
                  value={selectedNome}
                  onChange={(e) => handleSelectNome(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1D2E36", minWidth: 180 }}
                >
                  {pesquisaNomes.map((nome) => {
                    const count = groups[nome].length;
                    return (
                      <option key={nome} value={nome}>
                        {nome}{count > 1 ? ` (${count} edições)` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {edicoesDoGrupo.length > 1 && (
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 2 }}>
                  EDIÇÃO
                </label>
                <select
                  value={selectedEdicaoId}
                  onChange={(e) => setSelectedEdicaoId(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1D2E36", minWidth: 150 }}
                >
                  {edicoesDoGrupo.map((ed) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.numero_edicao}ª edição ({ed.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedEdicaoId > 0 && (
              <button
                onClick={fetchStats}
                disabled={loadingStats}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-40"
                style={{ backgroundColor: "#1D2E36", color: "white" }}
                title="Recarregar estatísticas"
              >
                <RefreshCw size={13} className={loadingStats ? "animate-spin" : ""} />
                Recarregar
              </button>
            )}
          </div>
        </div>

        {listError && (
          <div className="flex items-center gap-2 rounded-lg px-4 py-3 mb-4"
            style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}>
            <AlertCircle size={14} color="#C62828" className="shrink-0" />
            <p style={{ fontSize: 13, color: "#C62828" }}>
              Não foi possível carregar as pesquisas: {listError}
            </p>
          </div>
        )}

        {statsError && (
          <div className="flex items-center gap-2 rounded-lg px-4 py-3 mb-4"
            style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}>
            <AlertCircle size={14} color="#C62828" className="shrink-0" />
            <p style={{ fontSize: 13, color: "#C62828" }}>
              Não foi possível carregar as estatísticas: {statsError}
            </p>
          </div>
        )}

        {loadingList && !listError && (
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Carregando pesquisas...</p>
        )}

        {!loadingList && !listError && edicoes.length === 0 && (
          <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", padding: "24px 0" }}>
            Nenhuma pesquisa de campo disponível no momento.
          </p>
        )}

        {edicoes.length > 0 && (
          <div style={{ maxHeight: 560, overflowY: "auto" }} className="pr-1">
            <SurveyStatsView campos={camposHeader} dados={dados} loading={loadingStats} />
          </div>
        )}
      </div>

    </div>
  );
}
