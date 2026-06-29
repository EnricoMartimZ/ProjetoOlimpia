import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList, Users, Building2, BarChart2,
  Globe, MapPin, Layers, AlertCircle, RefreshCw, Eye, EyeOff,
} from "lucide-react";
import {
  getPesquisas, getEdicoes, getRespostas, getUsuarios, getHospedagens,
  type PesquisaListItem, type EdicaoAPI,
  type CampoHeader, type RespostaLinha,
  type UsuarioListItem,
} from "../../../services/api";
import { SurveyStatsView } from "../../components/SurveyStatsView";
import {
  publishSnapshot, unpublishSnapshot, isPublico,
} from "../../data/pesquisasPublicas";

const PALETTE = ["#F5C944", "#00538C", "#009688", "#2E7D32", "#C8102E", "#1565C0", "#E65100", "#7B1C1C"];

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ativa:     { bg: "#E8F5E9", color: "#2E7D32", label: "Ativa" },
  rascunho:  { bg: "#FFF8E1", color: "#E65100", label: "Rascunho" },
  encerrada: { bg: "#F0EDE8", color: "#6B7280", label: "Encerrada" },
};

function statusBadge(status: string) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.encerrada;
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  // ── Global data ──────────────────────────────────────────────────────────
  const [pesquisas, setPesquisas]           = useState<PesquisaListItem[]>([]);
  const [usuarios, setUsuarios]             = useState<UsuarioListItem[]>([]);
  const [hospedagensCount, setHospedagensCount] = useState<number | null>(null);
  const [loadingGlobal, setLoadingGlobal]   = useState(true);

  // ── Survey stats ─────────────────────────────────────────────────────────
  const [selectedPesquisa, setSelectedPesquisa] = useState<number | "">("");
  const [edicoes, setEdicoes]               = useState<EdicaoAPI[]>([]);
  const [selectedEdicao, setSelectedEdicao] = useState<number | "">("");
  const [camposHeader, setCamposHeader]     = useState<CampoHeader[]>([]);
  const [dados, setDados]                   = useState<RespostaLinha[]>([]);
  const [loadingStats, setLoadingStats]     = useState(false);
  const [statsError, setStatsError]         = useState<string | null>(null);

  // ── Load global data ─────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingGlobal(true);
    Promise.all([getPesquisas(), getUsuarios(), getHospedagens()])
      .then(([ps, us, hs]) => {
        setPesquisas(ps);
        setUsuarios(us);
        setHospedagensCount(hs.length);
        const primeira = ps.find(p => p.status === "ativa") ?? ps[0];
        if (primeira) setSelectedPesquisa(primeira.id);
      })
      .catch(() => {})
      .finally(() => setLoadingGlobal(false));
  }, []);

  // ── Load editions (with stale-request guard) ─────────────────────────────
  useEffect(() => {
    if (selectedPesquisa === "") {
      setEdicoes([]);
      setSelectedEdicao("");
      return;
    }
    let active = true;
    setEdicoes([]);
    setSelectedEdicao("");
    getEdicoes(selectedPesquisa)
      .then((data) => {
        if (!active) return;
        setEdicoes(data);
        const ativa = data.find(e => e.status === "ativa");
        const fallback = data.length > 0 ? data[data.length - 1].id : "";
        setSelectedEdicao(ativa ? ativa.id : fallback);
      })
      .catch(() => { if (active) setEdicoes([]); });
    return () => { active = false; };
  }, [selectedPesquisa]);

  // ── Publicação no painel público ────────────────────────────────────────
  const [publicado, setPublicado] = useState(false);

  useEffect(() => {
    if (selectedPesquisa !== "") {
      setPublicado(isPublico(selectedPesquisa as number));
    }
  }, [selectedPesquisa]);

  function togglePublicar() {
    if (selectedPesquisa === "" || !pesquisaAtual) return;
    if (publicado) {
      unpublishSnapshot(selectedPesquisa as number);
      setPublicado(false);
    } else {
      publishSnapshot({
        pesquisaId: selectedPesquisa as number,
        edicaoId: selectedEdicao as number,
        nome: pesquisaAtual.nome,
        campos: camposHeader,
        dados,
        publicadoEm: new Date().toISOString(),
      });
      setPublicado(true);
    }
  }

  // ── Fetch respostas ──────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (selectedEdicao === "") {
      setCamposHeader([]);
      setDados([]);
      setStatsError(null);
      return;
    }
    setLoadingStats(true);
    setStatsError(null);
    try {
      const tab = await getRespostas(selectedEdicao, { pagina: 1, por_pagina: 500 });
      setCamposHeader(tab.campos_header);
      setDados(tab.dados);
    } catch (e) {
      setCamposHeader([]);
      setDados([]);
      setStatsError(e instanceof Error ? e.message : "Erro ao carregar estatísticas.");
    } finally {
      setLoadingStats(false);
    }
  }, [selectedEdicao]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Derived values ───────────────────────────────────────────────────────
  const pesquisasAtivas   = pesquisas.filter(p => p.status === "ativa");
  const pesquisadoresList = usuarios.filter(u => u.roles.includes("pesquisador_campo"));
  const pesquisaAtual     = pesquisas.find(p => p.id === selectedPesquisa);
  const edicaoAtual       = edicoes.find(e => e.id === selectedEdicao);

  // ── Panorama — todas as edições de campo, independente da seleção ────────
  const [panoramaDados, setPanoramaDados] = useState<RespostaLinha[]>([]);

  useEffect(() => {
    if (loadingGlobal || pesquisas.length === 0) return;
    const campoPesquisas = pesquisas.filter(p => p.tipo === "campo" && p.edicao_atual_id !== null);
    if (campoPesquisas.length === 0) { setPanoramaDados([]); return; }
    Promise.all(
      campoPesquisas.map(p => getRespostas(p.edicao_atual_id!, { pagina: 1, por_pagina: 500 }))
    )
      .then(results => setPanoramaDados(results.flatMap(r => r.dados)))
      .catch(() => {});
  }, [pesquisas, loadingGlobal]);

  // Per-researcher totais (panorama independente da pesquisa selecionada)
  const perResearcher = panoramaDados.reduce<Record<string, number>>((acc, r) => {
    if (r.usuario_nome) acc[r.usuario_nome] = (acc[r.usuario_nome] || 0) + 1;
    return acc;
  }, {});

  const maxColetas = Math.max(1, ...Object.values(perResearcher));

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpis = [
    {
      label: "Pesquisas ativas",
      value: loadingGlobal ? "…" : pesquisasAtivas.length,
      sub: `${pesquisas.length} no total`,
      color: "#F5C944",
      Icon: ClipboardList,
    },
    {
      label: "Pesquisadores de campo",
      value: loadingGlobal ? "…" : pesquisadoresList.length,
      sub: `${usuarios.length} usuários cadastrados`,
      color: "#00538C",
      Icon: Users,
    },
    {
      label: "Hospedagens cadastradas",
      value: loadingGlobal ? "…" : (hospedagensCount ?? "—"),
      sub: "para registro de diária",
      color: "#009688",
      Icon: Building2,
    },
    {
      label: "Respostas na edição atual",
      value: edicaoAtual?.total_respostas ?? "—",
      sub: edicaoAtual
        ? `${pesquisaAtual?.nome ?? ""} · ${edicaoAtual.numero_edicao}ª ed.`
        : "selecione uma pesquisa",
      color: "#2E7D32",
      Icon: BarChart2,
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1D2E36" }}>
          Painel de Visualização
        </h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
          Dados em tempo real das pesquisas e usuários do sistema
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div
            key={i}
            className="rounded-xl p-4 shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${k.color}18` }}>
                <k.Icon size={18} style={{ color: k.color }} />
              </div>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#1D2E36", lineHeight: 1 }}>
              {k.value}
            </p>
            <p style={{ fontSize: 13, color: "#374151", fontWeight: 600, marginTop: 4 }}>
              {k.label}
            </p>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Pesquisas em andamento ── */}
      <div
        className="rounded-xl p-5 shadow-sm"
        style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Layers size={15} style={{ color: "#F5C944" }} />
          <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1D2E36" }}>
            Pesquisas em Andamento
          </h3>
          <span
            className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#F5C94422", color: "#9A7A00" }}
          >
            {pesquisasAtivas.length} ativas
          </span>
        </div>

        {pesquisas.length === 0 && !loadingGlobal ? (
          <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", padding: "20px 0" }}>
            Nenhuma pesquisa cadastrada.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pesquisas.map((p, i) => {
              const selected = selectedPesquisa === p.id;
              const isPub = p.tipo === "publica";
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPesquisa(p.id)}
                  className="text-left rounded-xl p-4 transition-all"
                  style={{
                    backgroundColor: selected ? "#F5C944" : "#F9F9F9",
                    border: "2px solid transparent",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        backgroundColor: PALETTE[i % PALETTE.length],
                        color: "white",
                        border: "2px solid rgba(0,0,0,0.18)",
                      }}
                    >
                      {p.nome.charAt(0)}
                    </div>
                    {statusBadge(p.status)}
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#1D2E36",
                      marginBottom: 4,
                      lineHeight: 1.3,
                    }}
                  >
                    {p.nome}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: "#6B7280" }}
                    >
                      {isPub ? <Globe size={11} /> : <MapPin size={11} />}
                      {isPub ? "Pública" : "Campo"}
                    </span>
                    <span className="text-xs" style={{ color: "#6B7280" }}>
                      {p.total_edicoes} {p.total_edicoes === 1 ? "edição" : "edições"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Resultados da pesquisa ── */}
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
                Resultados por Campo
              </h3>
              <p style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>
                {pesquisaAtual
                  ? `${pesquisaAtual.nome}${edicaoAtual ? ` — ${edicaoAtual.numero_edicao}ª edição` : ""}`
                  : "Selecione uma pesquisa acima"}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <select
              value={selectedPesquisa}
              onChange={(e) => setSelectedPesquisa(e.target.value ? Number(e.target.value) : "")}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1D2E36", minWidth: 160 }}
            >
              {pesquisas.length === 0 && <option value="">Nenhuma pesquisa</option>}
              {pesquisas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>

            <select
              value={selectedEdicao}
              onChange={(e) => setSelectedEdicao(e.target.value ? Number(e.target.value) : "")}
              disabled={edicoes.length === 0}
              className="px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-40"
              style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1D2E36", minWidth: 140 }}
            >
              {edicoes.length === 0
                ? <option value="">Nenhuma edição</option>
                : edicoes.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.numero_edicao}ª edição ({e.status})
                    </option>
                  ))
              }
            </select>

            <button
              onClick={fetchStats}
              disabled={loadingStats || selectedEdicao === ""}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-40"
              style={{ backgroundColor: "#1D2E36", color: "white" }}
              title="Recarregar estatísticas"
            >
              <RefreshCw size={13} className={loadingStats ? "animate-spin" : ""} />
              Recarregar
            </button>

            <button
              onClick={togglePublicar}
              disabled={selectedEdicao === "" || dados.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-40"
              style={{
                backgroundColor: publicado ? "#E8F5E9" : "#F5C944",
                color: publicado ? "#2E7D32" : "#1D2E36",
                border: publicado ? "1px solid #A5D6A7" : "none",
              }}
              title={publicado ? "Remover do painel público" : "Publicar no painel público"}
            >
              {publicado ? <EyeOff size={13} /> : <Eye size={13} />}
              {publicado ? "Remover do painel" : "Publicar no painel"}
            </button>
          </div>
        </div>

        {statsError && (
          <div
            className="flex items-center gap-2 rounded-lg px-4 py-3 mb-4"
            style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}
          >
            <AlertCircle size={14} color="#C62828" className="shrink-0" />
            <p style={{ fontSize: 13, color: "#C62828" }}>
              Não foi possível carregar as estatísticas: {statsError}
            </p>
          </div>
        )}

        <div style={{ maxHeight: 520, overflowY: "auto" }} className="pr-1">
          <SurveyStatsView campos={camposHeader} dados={dados} loading={loadingStats} />
        </div>
      </div>

      {/* ── Panorama dos pesquisadores ── */}
      <div
        className="rounded-xl p-5 shadow-sm"
        style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Users size={15} style={{ color: "#00538C" }} />
          <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1D2E36" }}>
            Panorama dos Pesquisadores
          </h3>
          <span
            className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#00538C18", color: "#00538C" }}
          >
            {pesquisadoresList.length} cadastrados
          </span>
          <span className="ml-2 text-xs" style={{ color: "#9CA3AF" }}>
            · todas as coletas de campo ativas
          </span>
        </div>

        {pesquisadoresList.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", padding: "20px 0" }}>
            Nenhum pesquisador cadastrado.
          </p>
        ) : (
          <div className="space-y-3" style={{ maxHeight: 380, overflowY: "auto" }}>
            {pesquisadoresList.map((u, i) => {
              const coletas = perResearcher[u.nome] ?? 0;
              const perguntasRespondidas = coletas * (camposHeader.length || 1);
              const pct = maxColetas > 0 ? Math.round((coletas / maxColetas) * 100) : 0;
              return (
                <div
                  key={u.id}
                  className="rounded-xl p-4"
                  style={{ backgroundColor: "#F9F9F9", border: "1px solid #F0EDE8" }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: PALETTE[i % PALETTE.length], color: "white" }}
                    >
                      {u.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1D2E36" }} className="truncate">
                        {u.nome}
                      </p>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }} className="truncate">{u.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p style={{ fontSize: 20, fontWeight: 800, color: "#1D2E36", lineHeight: 1 }}>
                        {perguntasRespondidas}
                      </p>
                      <p style={{ fontSize: 10, color: "#6B7280" }}>
                        {coletas > 0 ? `coletas registradas` : "sem coletas registradas"}
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#E5E7EB" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: PALETTE[i % PALETTE.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}

          </div>
        )}
      </div>


    </div>
  );
}
