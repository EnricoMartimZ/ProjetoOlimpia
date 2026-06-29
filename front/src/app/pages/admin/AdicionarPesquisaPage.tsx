import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Edit3, CheckCircle, Link2, List, Copy,
  AlertCircle, Loader2, Eye, EyeOff,
} from "lucide-react";
import { FIELD_TYPES } from "../../../lib/constants";
import { FieldTypePicker } from "../../components/FieldTypePicker";
import {
  getPesquisas,
  getPesquisa,
  getEdicoes,
  getRespostas,
  createPesquisa,
  updatePesquisa,
  deletePesquisa,
  launchEdicao,
  updateEdicaoStatus,
  deleteEdicao,
  type PesquisaListItem,
  type PesquisaDetalhada,
  type EdicaoAPI,
} from "../../../services/api";
import type { Field, FieldType, Research, TipoPesquisa } from "../../../types";
import {
  isPublico, publishSnapshot, unpublishSnapshot,
} from "../../data/pesquisasPublicas";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function apiToResearch(p: PesquisaDetalhada | PesquisaListItem): Research {
  const campos = "campos" in p
    ? p.campos.map((c) => ({
        id: c.id,
        tipo: c.tipo,
        label: c.texto_pergunta,
        required: c.obrigatorio,
        opcoes: c.opcoes.length > 0 ? c.opcoes : undefined,
      }))
    : [];

  return {
    id: p.id,
    nome: p.nome,
    descricao: p.descricao ?? "",
    tipo: p.tipo,
    status: p.status,
    edicoes: p.total_edicoes,
    campos,
    publicLink: (p.edicao_atual_id != null && p.tipo !== "campo")
      ? `/pesquisa/${p.edicao_atual_id}`
      : undefined,
  };
}

function camposToApiInput(campos: Field[], offset: number = 0) {
  return campos.map((f, i) => ({
    texto_pergunta: f.label,
    tipo: f.tipo,
    opcoes: f.opcoes ?? [],
    obrigatorio: f.required,
    ordem: offset + i,
  }));
}

const STATUS_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  ativa:     { label: "Ativa",     bg: "#E8F5E9", text: "#2E7D32" },
  encerrada: { label: "Encerrada", bg: "#FFEBEE", text: "#C62828" },
  rascunho:  { label: "Rascunho",  bg: "#FFFDE7", text: "#B8860B" },
  agendada:  { label: "Agendada",  bg: "#E3F2FD", text: "#00538C" },
};

function statusInfo(s: string) {
  return STATUS_LABEL[s] ?? STATUS_LABEL.rascunho;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function AdicionarPesquisaPage() {
  const [researches, setResearches] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Research | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "new">("view");

  // Form state
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<TipoPesquisa>("publica");
  const [campos, setCampos] = useState<Field[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Launch modal
  const [launchModal, setLaunchModal] = useState(false);
  const [launchStartDate, setLaunchStartDate] = useState("");
  const [launchEndDate, setLaunchEndDate] = useState("");
  const [launchedLink, setLaunchedLink] = useState("");
  const [launchDone, setLaunchDone] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Editions list
  const [edicoesSelected, setEdicoesSelected] = useState<EdicaoAPI[]>([]);
  const [loadingEdicoes, setLoadingEdicoes] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedEdicaoId, setCopiedEdicaoId] = useState<number | null>(null);

  // Status de edição
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);

  // Publish to public panel
  const [publishedIds, setPublishedIds] = useState<Set<number>>(
    () => new Set(
      JSON.parse(localStorage.getItem("olimpia_pesquisas_publicas") ?? "[]")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((s: any) => s.pesquisaId)
    )
  );
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Carregamento inicial
  // -------------------------------------------------------------------------

  const fetchPesquisas = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await getPesquisas();
      setResearches(data.map((p) => apiToResearch(p)));
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Erro ao carregar pesquisas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPesquisas(); }, [fetchPesquisas]);

  // -------------------------------------------------------------------------
  // Seleção de pesquisa
  // -------------------------------------------------------------------------

  const fetchEdicoes = useCallback(async (pesquisaId: number) => {
    setLoadingEdicoes(true);
    try {
      let edicoes = await getEdicoes(pesquisaId);
      const ativas = edicoes.filter((e) => e.status === "ativa");
      if (ativas.length > 1) {
        const maisRecente = ativas.reduce((a, b) =>
          a.numero_edicao > b.numero_edicao ? a : b
        );
        try {
          await updateEdicaoStatus(maisRecente.id, "ativar");
          edicoes = await getEdicoes(pesquisaId);
        } catch { /* reconciliação falhou — usa dados como estão */ }
      }
      setEdicoesSelected(edicoes);
    } catch {
      setEdicoesSelected([]);
    } finally {
      setLoadingEdicoes(false);
    }
  }, []);

  const selectResearch = async (r: Research) => {
    setSelected(r);
    setMode("view");
    setEdicoesSelected([]);
    setPublishError(null);
    setDetailLoading(true);
    fetchEdicoes(r.id);
    try {
      const detalhe = await getPesquisa(r.id);
      const completo = apiToResearch(detalhe);
      setSelected(completo);
      setResearches((prev) => prev.map((x) => (x.id === completo.id ? completo : x)));
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Erro ao carregar a pesquisa.");
    } finally {
      setDetailLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Publish/unpublish no painel público
  // -------------------------------------------------------------------------

  const edicaoAtual = edicoesSelected.find(e => e.status === "ativa")
    ?? (edicoesSelected.length > 0 ? edicoesSelected[edicoesSelected.length - 1] : null);

  const canPublish = selected?.tipo === "publica" && edicaoAtual !== null;

  const togglePublico = async () => {
    if (!selected) return;
    setPublishError(null);

    if (publishedIds.has(selected.id)) {
      unpublishSnapshot(selected.id);
      setPublishedIds((prev) => { const s = new Set(prev); s.delete(selected.id); return s; });
      return;
    }

    if (!edicaoAtual) return;
    setPublishing(true);
    try {
      const tabela = await getRespostas(edicaoAtual.id, { pagina: 1, por_pagina: 500 });
      publishSnapshot({
        pesquisaId: selected.id,
        edicaoId: edicaoAtual.id,
        nome: selected.nome,
        campos: tabela.campos_header,
        dados: tabela.dados,
        publicadoEm: new Date().toISOString(),
      });
      setPublishedIds((prev) => new Set([...prev, selected.id]));
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Erro ao publicar.");
    } finally {
      setPublishing(false);
    }
  };

  // -------------------------------------------------------------------------
  // Copiar links
  // -------------------------------------------------------------------------

  const handleDeleteEdicao = async (ed: EdicaoAPI) => {
    if (!selected) return;
    const isLast = edicoesSelected.length === 1;
    const msg = isLast
      ? `Esta é a única edição de "${selected.nome}". Excluí-la removerá a pesquisa inteira. Continuar?`
      : `Excluir a ${ed.numero_edicao}ª edição? Esta ação não pode ser desfeita.`;
    if (!window.confirm(msg)) return;
    setStatusLoadingId(ed.id);
    try {
      if (isLast) {
        await deletePesquisa(selected.id);
        unpublishSnapshot(selected.id);
        setPublishedIds((prev) => { const s = new Set(prev); s.delete(selected.id); return s; });
        setResearches((prev) => prev.filter((x) => x.id !== selected.id));
        setSelected(null);
        setMode("view");
      } else {
        await deleteEdicao(ed.id);
        await fetchEdicoes(selected.id);
        const detalhe = await getPesquisa(selected.id);
        const r = apiToResearch(detalhe);
        setSelected(r);
        setResearches((prev) => prev.map((x) => (x.id === r.id ? r : x)));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir edição.");
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleStatusChange = async (ed: EdicaoAPI, acao: "ativar" | "encerrar") => {
    if (!selected) return;
    setStatusLoadingId(ed.id);
    try {
      await updateEdicaoStatus(ed.id, acao);
      await fetchEdicoes(selected.id);
      // Refresh pesquisa para atualizar status geral
      const detalhe = await getPesquisa(selected.id);
      const r = apiToResearch(detalhe);
      setSelected(r);
      setResearches(prev => prev.map(x => x.id === r.id ? r : x));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao atualizar status.");
    } finally {
      setStatusLoadingId(null);
    }
  };

  const copyEdicaoLink = (edicaoId: number) => {
    navigator.clipboard.writeText(`${window.location.origin}/pesquisa/${edicaoId}`).catch(() => {});
    setCopiedEdicaoId(edicaoId);
    setTimeout(() => setCopiedEdicaoId((id) => (id === edicaoId ? null : id)), 1500);
  };

  const copyPublicLink = (r: Research, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!r.publicLink) return;
    navigator.clipboard.writeText(`${window.location.origin}${r.publicLink}`).catch(() => {});
    setCopiedId(r.id);
    setTimeout(() => setCopiedId((id) => (id === r.id ? null : id)), 1500);
  };

  // -------------------------------------------------------------------------
  // Formulário
  // -------------------------------------------------------------------------

  const startNew = () => {
    setNome(""); setDescricao(""); setTipo("publica"); setCampos([]);
    setSelected(null); setMode("new"); setSaveSuccess(false); setSaveError(null);
  };

  const startEdit = (r: Research) => {
    setSelected(r); setNome(r.nome); setDescricao(r.descricao);
    setTipo(r.tipo); setCampos([...r.campos]);
    setMode("edit"); setSaveSuccess(false); setSaveError(null);
  };

  const addField = (tipo: FieldType) => {
    setCampos((prev) => [
      ...prev,
      { id: Date.now(), tipo, label: "", required: false, opcoes: tipo === "multipla_escolha" ? [""] : undefined },
    ]);
  };

  const updateField = (id: number, updates: Partial<Field>) => {
    setCampos((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: number) => {
    setCampos((prev) => prev.filter((f) => f.id !== id));
  };

  const addOption = (fieldId: number) => {
    setCampos((prev) =>
      prev.map((f) => f.id === fieldId ? { ...f, opcoes: [...(f.opcoes || []), ""] } : f)
    );
  };

  const updateOption = (fieldId: number, idx: number, value: string) => {
    setCampos((prev) =>
      prev.map((f) =>
        f.id === fieldId ? { ...f, opcoes: f.opcoes?.map((o, i) => (i === idx ? value : o)) } : f
      )
    );
  };

  const removeOption = (fieldId: number, idx: number) => {
    setCampos((prev) =>
      prev.map((f) =>
        f.id === fieldId ? { ...f, opcoes: f.opcoes?.filter((_, i) => i !== idx) } : f
      )
    );
  };

  // -------------------------------------------------------------------------
  // Salvar
  // -------------------------------------------------------------------------

  const handleSave = async () => {
    if (!nome.trim()) return;
    setSaving(true); setSaveError(null); setSaveSuccess(false);
    try {
      const payload = { nome: nome.trim(), descricao: descricao.trim(), tipo, campos: camposToApiInput(campos) };
      let r: Research;
      if (mode === "new") {
        const created = await createPesquisa(payload);
        r = apiToResearch(created);
        setResearches((prev) => [...prev, r]);
      } else {
        const updated = await updatePesquisa(selected!.id, payload);
        r = apiToResearch(updated);
        setResearches((prev) => prev.map((x) => (x.id === r.id ? r : x)));
      }
      setSelected(r);
      setSaveSuccess(true);
      setMode("view");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar pesquisa.");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Lançar edição
  // -------------------------------------------------------------------------

  const openLaunch = () => {
    setLaunchStartDate(""); setLaunchEndDate(""); setLaunchedLink("");
    setLaunchDone(false); setLaunchError(null); setLaunchModal(true);
  };

  const handleConfirmLaunch = async () => {
    if (!launchStartDate) return;
    const research = selected ?? researches.find((r) => r.nome === nome);
    if (!research) return;
    setLaunching(true); setLaunchError(null);
    try {
      const edicao = await launchEdicao(research.id, {
        data_abertura: launchStartDate,
        data_fechamento: launchEndDate || null,
      });
      const link = research.tipo !== "campo" ? `${window.location.origin}/pesquisa/${edicao.id}` : "";
      setLaunchedLink(link); setLaunchDone(true);
      const patch = (r: Research): Research => ({
        ...r,
        edicoes: edicao.numero_edicao,
        status: edicao.status === "encerrada" ? "encerrada" : "ativa",
        publicLink: research.tipo !== "campo" ? `/pesquisa/${edicao.id}` : undefined,
      });
      setResearches((prev) => prev.map((x) => (x.id === research.id ? patch(x) : x)));
      if (selected?.id === research.id) setSelected((s) => (s ? patch(s) : s));
      fetchEdicoes(research.id);
    } catch (e) {
      setLaunchError(e instanceof Error ? e.message : "Erro ao lançar edição.");
    } finally {
      setLaunching(false);
    }
  };

  const copyLink = () => navigator.clipboard.writeText(launchedLink).catch(() => {});

  // -------------------------------------------------------------------------
  // Excluir
  // -------------------------------------------------------------------------

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await deletePesquisa(id);
      // Remove do painel público se estava publicada
      unpublishSnapshot(id);
      setPublishedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      setResearches((prev) => prev.filter((x) => x.id !== id));
      setSelected(null); setMode("view"); setDeleteConfirm(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir pesquisa.");
    } finally {
      setDeleting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="p-6 flex gap-6 h-full" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── Painel esquerdo — lista ────────────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col gap-3" style={{ maxHeight: "calc(100vh - 100px)" }}>
        <div className="flex items-center justify-between">
          <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1D2E36" }}>Pesquisas</h2>
          <button
            onClick={startNew}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: "#F5C944", color: "#1D2E36" }}
          >
            <Plus size={13} /> Nova
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 justify-center py-6" style={{ color: "#9CA3AF" }}>
            <Loader2 size={16} className="animate-spin" />
            <span style={{ fontSize: 13 }}>Carregando...</span>
          </div>
        )}
        {apiError && (
          <div className="flex items-start gap-2 rounded-lg p-3" style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}>
            <AlertCircle size={14} color="#C62828" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#C62828" }}>Erro ao carregar</p>
              <p style={{ fontSize: 11, color: "#C62828" }}>{apiError}</p>
              <button onClick={fetchPesquisas} style={{ fontSize: 11, color: "#1976D2", marginTop: 4 }}>
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        <div className="overflow-y-auto space-y-2 pr-1">
          {researches.map((r) => {
            const si = statusInfo(r.status);
            const isSelected = selected?.id === r.id;
            const copied = copiedId === r.id;
            const isPub = publishedIds.has(r.id);
            return (
              <div
                key={r.id}
                onClick={() => selectResearch(r)}
                role="button"
                tabIndex={0}
                className="w-full text-left rounded-xl p-3 transition-all cursor-pointer"
                style={{
                  backgroundColor: isSelected ? "#F5C944" : "white",
                  border: `2px solid ${isSelected ? "transparent" : "#F0EDE8"}`,
                }}
              >
                <div className="flex items-start justify-between mb-1 gap-1">
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1D2E36", lineHeight: 1.3, flex: 1 }}>
                    {r.nome}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    {isPub && (
                      <span title="Visível no painel público">
                        <Eye size={11} style={{ color: "#2E7D32" }} />
                      </span>
                    )}
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: si.bg, color: si.text }}
                    >
                      {si.label}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 11, color: isSelected ? "#5A4500" : "#6B7280" }}>
                  {r.tipo === "campo" ? "De campo" : "Pública"} · {r.edicoes} {r.edicoes === 1 ? "edição" : "edições"}
                </p>

                {r.publicLink ? (
                  <button
                    onClick={(e) => copyPublicLink(r, e)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: copied ? "#E8F5E9" : "#1D2E36",
                      color: copied ? "#2E7D32" : "white",
                    }}
                  >
                    {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                    {copied ? "Link copiado!" : "Copiar link público"}
                  </button>
                ) : r.tipo === "campo" ? (
                  <p className="mt-2 flex items-center gap-1 text-xs" style={{ color: isSelected ? "#1D2E36" : "#374151" }}>
                    <CheckCircle size={11} />
                    {r.edicoes > 0
                      ? `Coleta de campo — ${r.edicoes > 1 ? "edições" : "edição"} (${r.edicoes})`
                      : "De campo — sem link público"}
                  </p>
                ) : (
                  <p className="mt-2 flex items-center gap-1 text-xs" style={{ color: isSelected ? "#5A4500" : "#9CA3AF" }}>
                    <Link2 size={11} />
                    Sem edição — lance uma para gerar o link
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Painel direito ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Empty state */}
        {mode === "view" && !selected && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="p-4 rounded-full" style={{ backgroundColor: "#FFF3CD" }}>
              <List size={28} color="#F5C944" />
            </div>
            <p style={{ fontWeight: 600, fontSize: 15, color: "#1D2E36" }}>Selecione uma pesquisa</p>
            <p style={{ fontSize: 13, color: "#6B7280" }}>Clique em uma pesquisa para visualizar ou editar</p>
            <button
              onClick={startNew}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold mt-2"
              style={{ backgroundColor: "#F5C944", color: "#1D2E36" }}
            >
              <Plus size={15} /> Criar nova pesquisa
            </button>
          </div>
        )}

        {/* ── VIEW MODE ─────────────────────────────────────────────────────── */}
        {mode === "view" && selected && (
          <div className="space-y-5">

            {/* Saved success banner */}
            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{ backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7" }}>
                <CheckCircle size={16} color="#2E7D32" />
                <p style={{ fontSize: 13, color: "#2E7D32", fontWeight: 600 }}>Pesquisa salva com sucesso!</p>
              </div>
            )}

            {/* Header card */}
            <div className="rounded-xl p-5" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 style={{ fontWeight: 700, fontSize: 20, color: "#1D2E36" }}>{selected.nome}</h1>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={selected.tipo === "campo"
                        ? { backgroundColor: "#E3F2FD", color: "#00538C" }
                        : { backgroundColor: "#E8F5E9", color: "#2E7D32" }}
                    >
                      {selected.tipo === "campo" ? "De campo" : "Pública"}
                    </span>
                    {(() => { const si = statusInfo(selected.status); return (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: si.bg, color: si.text }}>
                        {si.label}
                      </span>
                    ); })()}
                  </div>
                  {selected.descricao && (
                    <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{selected.descricao}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {/* Publish toggle — only for public surveys with at least one edition */}
                  {canPublish && (
                    <button
                      onClick={togglePublico}
                      disabled={publishing || detailLoading}
                      title={publishedIds.has(selected.id)
                        ? "Remover do painel público de dados"
                        : "Publicar no painel público de dados"}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                      style={publishedIds.has(selected.id)
                        ? { backgroundColor: "#E8F5E9", color: "#2E7D32" }
                        : { backgroundColor: "#F0EDE8", color: "#6B7280" }}
                    >
                      {publishing
                        ? <Loader2 size={13} className="animate-spin" />
                        : publishedIds.has(selected.id)
                          ? <Eye size={13} />
                          : <EyeOff size={13} />}
                      {publishedIds.has(selected.id) ? "Visível no painel" : "Publicar no painel"}
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(selected)}
                    disabled={detailLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                    style={{ backgroundColor: "#1D2E36", color: "white" }}
                  >
                    {detailLoading ? <Loader2 size={13} className="animate-spin" /> : <Edit3 size={13} />}
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(selected.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold"
                    style={{ color: "#C62828" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {publishError && (
                <div className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}>
                  <AlertCircle size={13} color="#C62828" />
                  <p style={{ fontSize: 12, color: "#C62828" }}>{publishError}</p>
                </div>
              )}

              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <p style={{ fontSize: 22, fontWeight: 800, color: "#F5C944" }}>{selected.campos.length}</p>
                  <p style={{ fontSize: 11, color: "#6B7280" }}>Campos</p>
                </div>
                <div className="text-center">
                  <p style={{ fontSize: 22, fontWeight: 800, color: "#00538C" }}>{selected.edicoes}</p>
                  <p style={{ fontSize: 11, color: "#6B7280" }}>Edições</p>
                </div>
              </div>
            </div>

            {/* Editions */}
            <div className="rounded-xl p-5" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1D2E36" }}>
                  {selected.tipo === "campo" ? "Edições de campo lançadas" : "Edições e links públicos"}
                </h3>
                <button
                  onClick={openLaunch}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: "#F5C944", color: "#1D2E36" }}
                >
                  <Plus size={12} /> Nova edição
                </button>
              </div>

              {loadingEdicoes ? (
                <div className="flex items-center gap-2 py-3" style={{ color: "#9CA3AF" }}>
                  <Loader2 size={14} className="animate-spin" />
                  <span style={{ fontSize: 12 }}>Carregando edições...</span>
                </div>
              ) : edicoesSelected.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>
                  {selected.tipo === "campo"
                    ? "Nenhuma edição lançada. Clique em \"Nova edição\" para iniciar a coleta."
                    : "Nenhuma edição lançada. Clique em \"Nova edição\" para gerar o primeiro link público."}
                </p>
              ) : (
                <div className="space-y-2">
                  {edicoesSelected.map((ed) => {
                    const si = statusInfo(ed.status);
                    const copied = copiedEdicaoId === ed.id;
                    const isCampo = selected.tipo === "campo";
                    return (
                      <div
                        key={ed.id}
                        className="flex items-center gap-3 rounded-lg p-3"
                        style={{ backgroundColor: "#FAFAFA", border: "1px solid #F0EDE8" }}
                      >
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: "#1D2E36", color: "white" }}
                        >
                          {ed.numero_edicao}ª
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ backgroundColor: si.bg, color: si.text }}
                            >
                              {si.label}
                            </span>
                            <span style={{ fontSize: 11, color: "#6B7280" }}>
                              {ed.total_respostas} resposta{ed.total_respostas !== 1 ? "s" : ""}
                            </span>
                            <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                              {ed.data_abertura}{ed.data_fechamento ? ` → ${ed.data_fechamento}` : ""}
                            </span>
                          </div>
                          {!isCampo && (
                            <p className="truncate" style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                              {window.location.origin}/pesquisa/{ed.id}
                            </p>
                          )}
                          {isCampo && (
                            <p style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                              Coleta de campo — sem link público
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Checkbox de status — encerrar só disponível com mais de 1 edição */}
                          {(ed.status === "ativa" || ed.status === "encerrada") && (
                            <label
                              className="flex items-center gap-1.5 select-none"
                              style={{ cursor: statusLoadingId === ed.id ? "wait" : "pointer" }}
                              title={ed.status === "ativa" ? "Marcar como encerrada" : "Reativar edição"}
                            >
                              {statusLoadingId === ed.id && <Loader2 size={11} className="animate-spin" style={{ color: "#6B7280" }} />}
                              <input
                                type="checkbox"
                                checked={ed.status === "ativa"}
                                disabled={statusLoadingId === ed.id}
                                onChange={(e) => handleStatusChange(ed, e.target.checked ? "ativar" : "encerrar")}
                                style={{ accentColor: "#2E7D32", cursor: "pointer" }}
                              />
                              <span style={{ fontSize: 11, color: "#6B7280" }}>Ativa</span>
                            </label>
                          )}
                          {/* Copiar link — oculto se encerrada */}
                          {!isCampo && ed.status !== "encerrada" && (
                            <button
                              onClick={() => copyEdicaoLink(ed.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                              style={{
                                backgroundColor: copied ? "#E8F5E9" : "#1D2E36",
                                color: copied ? "#2E7D32" : "white",
                              }}
                            >
                              {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                              {copied ? "Copiado!" : "Copiar link"}
                            </button>
                          )}
                          {/* Excluir edição */}
                          <button
                            onClick={() => handleDeleteEdicao(ed)}
                            disabled={statusLoadingId === ed.id}
                            className="flex items-center justify-center w-7 h-7 rounded-lg disabled:opacity-40"
                            style={{ color: "#C62828" }}
                            title={edicoesSelected.length === 1 ? "Excluir edição e pesquisa" : "Excluir edição"}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Campos do formulário */}
            {selected.campos.length > 0 && (
              <div className="rounded-xl p-5" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
                <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1D2E36", marginBottom: 16 }}>
                  Campos do formulário
                </h3>
                <div className="space-y-3">
                  {selected.campos.map((f, i) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 rounded-lg p-3"
                      style={{ backgroundColor: "#FAFAFA", border: "1px solid #F0EDE8" }}
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: "#F5C944", color: "#1D2E36" }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1D2E36" }}>{f.label}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                          {FIELD_TYPES.find((t) => t.tipo === f.tipo)?.label}
                          {f.required && " · Obrigatório"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailLoading && selected.campos.length === 0 && (
              <div className="flex items-center gap-2 rounded-xl p-4" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
                <Loader2 size={14} className="animate-spin" style={{ color: "#9CA3AF" }} />
                <span style={{ fontSize: 13, color: "#9CA3AF" }}>Carregando campos do formulário...</span>
              </div>
            )}
          </div>
        )}

        {/* ── EDIT / NEW MODE ───────────────────────────────────────────────── */}
        {(mode === "edit" || mode === "new") && (
          <div className="space-y-5">
            <div className="rounded-xl p-5" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: "#1D2E36", marginBottom: 16 }}>
                {mode === "new" ? "Nova Pesquisa" : `Editando: ${selected?.nome}`}
              </h2>
              <div className="space-y-3">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Nome da pesquisa *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Demanda Turística 2026"
                    className="w-full mt-1 px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1D2E36" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Descrição</label>
                  <textarea
                    rows={2}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva o objetivo desta pesquisa..."
                    className="w-full mt-1 px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                    style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1D2E36" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Tipo de pesquisa *</label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {([
                      { value: "publica", titulo: "Pública", desc: "Respondida por qualquer pessoa pelo link público." },
                      { value: "campo", titulo: "De campo", desc: "Coletada presencialmente por um pesquisador de campo." },
                    ] as const).map((opt) => {
                      const active = tipo === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTipo(opt.value)}
                          className="text-left rounded-lg p-3 transition-all"
                          style={{
                            border: `2px solid ${active ? "#F5C944" : "#E5E7EB"}`,
                            backgroundColor: active ? "#FFFBEB" : "#F9F9F9",
                          }}
                        >
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#1D2E36" }}>{opt.titulo}</p>
                          <p style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Campos */}
            <div className="rounded-xl p-5" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1D2E36" }}>
                  Campos ({campos.length})
                </h3>
                <FieldTypePicker onSelect={addField} />
              </div>

              {campos.length === 0 && (
                <div className="text-center py-8" style={{ color: "#9CA3AF", fontSize: 13 }}>
                  Nenhum campo adicionado. Clique em "Adicionar campo" para começar.
                </div>
              )}

              <div className="space-y-3">
                {campos.map((f, i) => (
                  <div
                    key={f.id}
                    className="rounded-lg p-4"
                    style={{ border: "1px solid #E5E7EB", backgroundColor: "#FAFAFA" }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: "#1D2E36", color: "white" }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold"
                        style={{ backgroundColor: "#E3E8F5", color: "#00538C" }}
                      >
                        {FIELD_TYPES.find((t) => t.tipo === f.tipo)?.label}
                      </span>
                      <div className="flex-1" />
                      <label className="flex items-center gap-1 text-xs" style={{ color: "#6B7280" }}>
                        <input
                          type="checkbox"
                          checked={f.required}
                          onChange={(e) => updateField(f.id, { required: e.target.checked })}
                          className="rounded"
                          style={{ accentColor: "#F5C944" }}
                        />
                        Obrigatório
                      </label>
                      <button onClick={() => removeField(f.id)} className="text-red-400 hover:text-red-600 ml-2">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => updateField(f.id, { label: e.target.value })}
                      placeholder="Texto da pergunta..."
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: "1px solid #E5E7EB", backgroundColor: "white", color: "#1D2E36" }}
                    />
                    {f.tipo === "multipla_escolha" && (
                      <div className="mt-2 space-y-1.5">
                        <p style={{ fontSize: 11, color: "#6B7280" }}>Opções:</p>
                        {(f.opcoes || []).map((o, oi) => (
                          <div key={oi} className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={o}
                              onChange={(e) => updateOption(f.id, oi, e.target.value)}
                              placeholder={`Opção ${oi + 1}`}
                              className="flex-1 px-3 py-1.5 rounded text-xs outline-none"
                              style={{ border: "1px solid #E5E7EB", backgroundColor: "white" }}
                            />
                            {(f.opcoes ?? []).length > 1 && (
                              <button onClick={() => removeOption(f.id, oi)} className="text-red-300 hover:text-red-500">
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addOption(f.id)}
                          className="text-xs flex items-center gap-1"
                          style={{ color: "#F5C944" }}
                        >
                          <Plus size={11} /> Adicionar opção
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {saveError && (
              <div className="flex items-center gap-2 rounded-lg px-4 py-3"
                style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}>
                <AlertCircle size={14} color="#C62828" />
                <p style={{ fontSize: 13, color: "#C62828" }}>{saveError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setMode("view"); setSaveError(null); }}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: "1px solid #E5E7EB", color: "#374151" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !nome.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ backgroundColor: "#1D2E36", color: "white" }}
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Salvando..." : "Salvar pesquisa"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal — lançar edição ──────────────────────────────────────────── */}
      {launchModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: "white" }}>
            <div className="px-6 py-5" style={{ backgroundColor: "#F5C944" }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1D2E36" }}>
                {launchDone ? "Edição lançada!" : "Lançar Nova Edição"}
              </h2>
              <p style={{ fontSize: 12, color: "#5A5A2A" }}>{selected?.nome || nome}</p>
            </div>

            <div className="p-6 space-y-4">
              {launchDone ? (
                <>
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="p-3 rounded-full" style={{ backgroundColor: "#E8F5E9" }}>
                      <CheckCircle size={32} color="#2E7D32" />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1D2E36" }}>Edição criada com sucesso!</p>
                  </div>
                  {launchedLink ? (
                    <div className="rounded-lg p-3" style={{ backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7" }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#2E7D32", marginBottom: 6 }}>Link público da pesquisa:</p>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-xs font-mono break-all select-all" style={{ color: "#1B5E20" }}>
                          {launchedLink}
                        </p>
                        <button onClick={copyLink} className="shrink-0 p-1.5 rounded-lg" style={{ backgroundColor: "#2E7D32", color: "white" }}>
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg p-3" style={{ backgroundColor: "#E3E8F5", border: "1px solid #BBDEFB" }}>
                      <p style={{ fontSize: 12, color: "#00538C" }}>
                        Pesquisa de campo — coleta feita por pesquisadores autenticados. Sem link público.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => setLaunchModal(false)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold"
                    style={{ backgroundColor: "#1D2E36", color: "white" }}
                  >
                    Fechar
                  </button>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Data de início *</label>
                      <input
                        type="date"
                        value={launchStartDate}
                        min={today}
                        onChange={(e) => setLaunchStartDate(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Data de término</label>
                      <input
                        type="date"
                        value={launchEndDate}
                        min={launchStartDate || today}
                        onChange={(e) => setLaunchEndDate(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                      />
                    </div>
                  </div>
                  {launchError && (
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2"
                      style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}>
                      <AlertCircle size={13} color="#C62828" />
                      <p style={{ fontSize: 12, color: "#C62828" }}>{launchError}</p>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setLaunchModal(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ border: "1px solid #E5E7EB", color: "#374151" }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmLaunch}
                      disabled={!launchStartDate || launching}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                      style={{ backgroundColor: "#F5C944", color: "#1D2E36" }}
                    >
                      {launching && <Loader2 size={14} className="animate-spin" />}
                      {launching ? "Lançando..." : "Confirmar lançamento"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal — confirmar exclusão ─────────────────────────────────────── */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-sm mx-4 rounded-2xl shadow-2xl p-6" style={{ backgroundColor: "white" }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: "#1D2E36", marginBottom: 8 }}>Excluir pesquisa</h3>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
              Esta ação é irreversível. A pesquisa, todos os campos, edições e respostas serão removidos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: "1px solid #E5E7EB", color: "#374151" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ backgroundColor: "#C8102E", color: "white" }}
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
