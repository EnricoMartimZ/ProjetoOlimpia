import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Edit3, CheckCircle, Link2, List, Copy, AlertCircle, Loader2,
} from "lucide-react";
import { FIELD_TYPES } from "../../../lib/constants";
import { FieldTypePicker } from "../../components/FieldTypePicker";
import {
  getPesquisas,
  getPesquisa,
  getEdicoes,
  createPesquisa,
  updatePesquisa,
  deletePesquisa,
  launchEdicao,
  type PesquisaListItem,
  type PesquisaDetalhada,
  type EdicaoAPI,
} from "../../../services/api";
import type { Field, FieldType, Research, TipoPesquisa } from "../../../types";

// ---------------------------------------------------------------------------
// Helpers de conversão entre tipos da API e tipos internos do frontend
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
    // Link público aponta para a edição atual (rota /pesquisa/{edicaoId}). undefined se rascunho.
    publicLink: p.edicao_atual_id != null ? `/pesquisa/${p.edicao_atual_id}` : undefined,
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

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

const statusColor = (s: string) => {
  if (s === "ativa") return { bg: "#E8F5E9", text: "#2E7D32" };
  if (s === "encerrada") return { bg: "#FFEBEE", text: "#C62828" };
  return { bg: "#FFF3CD", text: "#B8860B" };
};

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function AdicionarPesquisaPage() {
  const [researches, setResearches] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Research | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | "new">("view");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<TipoPesquisa>("publica");
  const [campos, setCampos] = useState<Field[]>([]);
  const [saved, setSaved] = useState(false);

  const [launchModal, setLaunchModal] = useState(false);
  const [launchStartDate, setLaunchStartDate] = useState("");
  const [launchEndDate, setLaunchEndDate] = useState("");
  const [launchedLink, setLaunchedLink] = useState("");
  const [launchDone, setLaunchDone] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Feedback "copiado!" por pesquisa na coluna esquerda
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Edições da pesquisa selecionada (para listar os links de cada edição no detalhe)
  const [edicoesSelected, setEdicoesSelected] = useState<EdicaoAPI[]>([]);
  const [loadingEdicoes, setLoadingEdicoes] = useState(false);
  // Feedback "copiado!" por edição
  const [copiedEdicaoId, setCopiedEdicaoId] = useState<number | null>(null);

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

  useEffect(() => {
    fetchPesquisas();
  }, [fetchPesquisas]);

  // -------------------------------------------------------------------------
  // Seleção — carrega o detalhe completo (com campos) ao clicar numa pesquisa
  // A listagem (GET /pesquisas) não traz os campos; o detalhe (GET /pesquisas/{id}) traz.
  // -------------------------------------------------------------------------

  // Carrega (ou recarrega) as edições de uma pesquisa
  const fetchEdicoes = useCallback(async (pesquisaId: number) => {
    setLoadingEdicoes(true);
    try {
      setEdicoesSelected(await getEdicoes(pesquisaId));
    } catch {
      setEdicoesSelected([]);
    } finally {
      setLoadingEdicoes(false);
    }
  }, []);

  const selectResearch = async (r: Research) => {
    setSelected(r);          // feedback imediato com os dados que já temos
    setMode("view");
    setEdicoesSelected([]);
    fetchEdicoes(r.id);
    try {
      const detalhe = await getPesquisa(r.id);
      const completo = apiToResearch(detalhe);
      setSelected(completo);
      // Atualiza a lista para guardar os campos já carregados
      setResearches((prev) => prev.map((x) => (x.id === completo.id ? completo : x)));
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Erro ao carregar a pesquisa.");
    }
  };

  // Copia o link de uma edição específica (lista no painel de detalhe)
  const copyEdicaoLink = (edicaoId: number) => {
    const url = `${window.location.origin}/pesquisa/${edicaoId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedEdicaoId(edicaoId);
    setTimeout(() => setCopiedEdicaoId((id) => (id === edicaoId ? null : id)), 1500);
  };

  // -------------------------------------------------------------------------
  // Ações de formulário
  // -------------------------------------------------------------------------

  const startNew = () => {
    setNome("");
    setDescricao("");
    setTipo("publica");
    setCampos([]);
    setSelected(null);
    setMode("new");
    setSaved(false);
    setSaveError(null);
  };

  const startEdit = (r: Research) => {
    setSelected(r);
    setNome(r.nome);
    setDescricao(r.descricao);
    setTipo(r.tipo);
    setCampos([...r.campos]);
    setMode("edit");
    setSaved(false);
    setSaveError(null);
  };

  const addField = (tipo: FieldType) => {
    setCampos((prev) => [
      ...prev,
      {
        id: Date.now(),
        tipo,
        label: "",
        required: false,
        opcoes: tipo === "multipla_escolha" ? [""] : undefined,
      },
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
      prev.map((f) =>
        f.id === fieldId ? { ...f, opcoes: [...(f.opcoes || []), ""] } : f
      )
    );
  };

  const updateOption = (fieldId: number, idx: number, value: string) => {
    setCampos((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? { ...f, opcoes: f.opcoes?.map((o, i) => (i === idx ? value : o)) }
          : f
      )
    );
  };

  // -------------------------------------------------------------------------
  // Salvar (criar ou atualizar) pesquisa via API
  // -------------------------------------------------------------------------

  const handleSave = async () => {
    if (!nome.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        tipo,
        campos: camposToApiInput(campos),
      };

      if (mode === "new") {
        const created = await createPesquisa(payload);
        const r = apiToResearch(created);
        setResearches((prev) => [...prev, r]);
        setSelected(r);
      } else if (selected) {
        const updated = await updatePesquisa(selected.id, payload);
        const r = apiToResearch(updated);
        setResearches((prev) => prev.map((x) => (x.id === r.id ? r : x)));
        setSelected(r);
      }

      setSaved(true);
      setMode("view");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar pesquisa.");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Lançar edição via API → gera o link público real /pesquisa/{edicaoId}
  // -------------------------------------------------------------------------

  const openLaunch = () => {
    setLaunchStartDate("");
    setLaunchEndDate("");
    setLaunchedLink("");
    setLaunchDone(false);
    setLaunchError(null);
    setLaunchModal(true);
  };

  const handleConfirmLaunch = async () => {
    if (!launchStartDate) return;
    const research = selected ?? researches.find((r) => r.nome === nome);
    if (!research) return;

    setLaunching(true);
    setLaunchError(null);
    try {
      const edicao = await launchEdicao(research.id, {
        data_abertura: launchStartDate,
        data_fechamento: launchEndDate || null,
      });

      const link = `${window.location.origin}/pesquisa/${edicao.id}`;
      setLaunchedLink(link);
      setLaunchDone(true);

      // Atualiza a pesquisa local com o novo link e contagem de edições
      const patch = (r: Research): Research => ({
        ...r,
        edicoes: edicao.numero_edicao,
        status: edicao.status === "encerrada" ? "encerrada" : "ativa",
        publicLink: `/pesquisa/${edicao.id}`,
      });
      setResearches((prev) => prev.map((x) => (x.id === research.id ? patch(x) : x)));
      if (selected?.id === research.id) setSelected((s) => (s ? patch(s) : s));
      // Recarrega a lista de edições para o painel de detalhe mostrar a nova
      fetchEdicoes(research.id);
    } catch (e) {
      setLaunchError(e instanceof Error ? e.message : "Erro ao lançar edição.");
    } finally {
      setLaunching(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(launchedLink).catch(() => {});
  };

  // Copia o link público de uma pesquisa direto da coluna esquerda
  const copyPublicLink = (r: Research, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!r.publicLink) return;
    const url = `${window.location.origin}${r.publicLink}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedId(r.id);
    setTimeout(() => setCopiedId((id) => (id === r.id ? null : id)), 1500);
  };

  // -------------------------------------------------------------------------
  // Excluir pesquisa via API
  // -------------------------------------------------------------------------

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await deletePesquisa(id);
      setResearches((prev) => prev.filter((x) => x.id !== id));
      setSelected(null);
      setMode("view");
      setDeleteConfirm(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir pesquisa.");
    } finally {
      setDeleting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="p-6 flex gap-6 h-full" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Painel esquerdo — lista de pesquisas */}
      <div className="w-72 shrink-0 flex flex-col gap-3" style={{ maxHeight: "calc(100vh - 100px)" }}>
        <div className="flex items-center justify-between">
          <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1B1D40" }}>Pesquisas</h2>
          <button
            onClick={startNew}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
          >
            <Plus size={13} />
            Nova
          </button>
        </div>

        {/* Estados de carregamento / erro */}
        {loading && (
          <div className="flex items-center gap-2 justify-center py-6" style={{ color: "#9CA3AF" }}>
            <Loader2 size={16} className="animate-spin" />
            <span style={{ fontSize: 13 }}>Carregando...</span>
          </div>
        )}
        {apiError && (
          <div
            className="flex items-start gap-2 rounded-lg p-3"
            style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}
          >
            <AlertCircle size={14} color="#C62828" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#C62828" }}>Erro ao carregar</p>
              <p style={{ fontSize: 11, color: "#C62828" }}>{apiError}</p>
              <button
                onClick={fetchPesquisas}
                style={{ fontSize: 11, color: "#1976D2", marginTop: 4 }}
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        <div className="overflow-y-auto space-y-2 pr-1">
          {researches.map((r) => {
            const sc = statusColor(r.status);
            const isSelected = selected?.id === r.id;
            const copied = copiedId === r.id;
            return (
              <div
                key={r.id}
                onClick={() => selectResearch(r)}
                role="button"
                tabIndex={0}
                className="w-full text-left rounded-xl p-3 transition-all cursor-pointer"
                style={{
                  backgroundColor: isSelected ? "#F5C100" : "white",
                  border: `1px solid ${isSelected ? "#F5C100" : "#F0EDE8"}`,
                }}
              >
                <div className="flex items-start justify-between mb-1">
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1B1D40", lineHeight: 1.3 }}>
                    {r.nome}
                  </p>
                  <span
                    className="ml-2 shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: sc.bg, color: sc.text }}
                  >
                    {r.status}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "#6B7280" }}>
                  {r.campos.length} campos · {r.edicoes} edições
                </p>

                {/* Botão copiar link público — só quando há edição lançada */}
                {r.publicLink ? (
                  <button
                    onClick={(e) => copyPublicLink(r, e)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: copied ? "#E8F5E9" : isSelected ? "#1B1D40" : "#F0F7FF",
                      color: copied ? "#2E7D32" : isSelected ? "white" : "#00538C",
                    }}
                    title="Copiar link público da pesquisa"
                  >
                    {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                    {copied ? "Link copiado!" : "Copiar link público"}
                  </button>
                ) : (
                  <p
                    className="mt-2 flex items-center gap-1 text-xs"
                    style={{ color: isSelected ? "#7A6A14" : "#9CA3AF" }}
                  >
                    <Link2 size={11} />
                    Sem edição — lance uma para gerar o link
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Painel direito — detalhe / formulário */}
      <div className="flex-1 overflow-y-auto">
        {mode === "view" && !selected && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="p-4 rounded-full" style={{ backgroundColor: "#FFF3CD" }}>
              <List size={28} color="#F5C100" />
            </div>
            <p style={{ fontWeight: 600, fontSize: 15, color: "#1B1D40" }}>
              Selecione uma pesquisa
            </p>
            <p style={{ fontSize: 13, color: "#6B7280" }}>
              Clique em uma pesquisa para visualizar ou editar
            </p>
            <button
              onClick={startNew}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold mt-2"
              style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
            >
              <Plus size={15} />
              Criar nova pesquisa
            </button>
          </div>
        )}

        {mode === "view" && selected && (
          <div className="space-y-5">
            <div className="rounded-xl p-5" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 style={{ fontWeight: 700, fontSize: 20, color: "#1B1D40" }}>{selected.nome}</h1>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={
                        selected.tipo === "campo"
                          ? { backgroundColor: "#E3E8F5", color: "#00538C" }
                          : { backgroundColor: "#E8F5E9", color: "#2E7D32" }
                      }
                    >
                      {selected.tipo === "campo" ? "De campo" : "Pública"}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{selected.descricao}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(selected)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: "#1B1D40", color: "white" }}
                  >
                    <Edit3 size={13} />
                    Editar
                  </button>
                  <button
                    onClick={openLaunch}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
                  >
                    <Link2 size={13} />
                    Lançar edição
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(selected.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: "#FFEBEE", color: "#C62828" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <div className="text-center">
                  <p style={{ fontSize: 22, fontWeight: 800, color: "#F5C100" }}>{selected.campos.length}</p>
                  <p style={{ fontSize: 11, color: "#6B7280" }}>Campos</p>
                </div>
                <div className="text-center">
                  <p style={{ fontSize: 22, fontWeight: 800, color: "#00538C" }}>{selected.edicoes}</p>
                  <p style={{ fontSize: 11, color: "#6B7280" }}>Edições</p>
                </div>
              </div>
            </div>

            {/* Edições lançadas — cada uma com seu link público */}
            <div className="rounded-xl p-5" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1B1D40", marginBottom: 16 }}>
                Edições e links públicos
              </h3>

              {loadingEdicoes ? (
                <div className="flex items-center gap-2 py-3" style={{ color: "#9CA3AF" }}>
                  <Loader2 size={14} className="animate-spin" />
                  <span style={{ fontSize: 12 }}>Carregando edições...</span>
                </div>
              ) : edicoesSelected.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>
                  Nenhuma edição lançada. Clique em "Lançar edição" para gerar o primeiro link público.
                </p>
              ) : (
                <div className="space-y-2">
                  {edicoesSelected.map((ed) => {
                    const sc = statusColor(ed.status === "agendada" ? "rascunho" : ed.status);
                    const copied = copiedEdicaoId === ed.id;
                    return (
                      <div
                        key={ed.id}
                        className="flex items-center gap-3 rounded-lg p-3"
                        style={{ backgroundColor: "#FAFAFA", border: "1px solid #F0EDE8" }}
                      >
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: "#00538C", color: "white" }}
                        >
                          {ed.numero_edicao}ª
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ backgroundColor: sc.bg, color: sc.text }}
                            >
                              {ed.status}
                            </span>
                            <span style={{ fontSize: 11, color: "#6B7280" }}>
                              {ed.total_respostas} resposta{ed.total_respostas !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <p className="truncate" style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                            {window.location.origin}/pesquisa/{ed.id}
                          </p>
                        </div>
                        <button
                          onClick={() => copyEdicaoLink(ed.id)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{
                            backgroundColor: copied ? "#E8F5E9" : "#1B1D40",
                            color: copied ? "#2E7D32" : "white",
                          }}
                          title="Copiar link desta edição"
                        >
                          {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                          {copied ? "Copiado!" : "Copiar link"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl p-5" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1B1D40", marginBottom: 16 }}>
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
                      style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1B1D40" }}>{f.label}</p>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                        {FIELD_TYPES.find((t) => t.tipo === f.tipo)?.label}
                        {f.required && " · Obrigatório"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(mode === "edit" || mode === "new") && (
          <div className="space-y-5">
            <div className="rounded-xl p-5" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: "#1B1D40", marginBottom: 16 }}>
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
                    style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1B1D40" }}
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
                    style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1B1D40" }}
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
                            border: `2px solid ${active ? "#F5C100" : "#E5E7EB"}`,
                            backgroundColor: active ? "#FFFBEB" : "#F9F9F9",
                          }}
                        >
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#1B1D40" }}>{opt.titulo}</p>
                          <p style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1B1D40" }}>
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
                        style={{ backgroundColor: "#1B1D40", color: "white" }}
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
                          style={{ accentColor: "#F5C100" }}
                        />
                        Obrigatório
                      </label>
                      <button
                        onClick={() => removeField(f.id)}
                        className="text-red-400 hover:text-red-600 ml-2"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => updateField(f.id, { label: e.target.value })}
                      placeholder="Texto da pergunta..."
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: "1px solid #E5E7EB", backgroundColor: "white", color: "#1B1D40" }}
                    />
                    {f.tipo === "multipla_escolha" && (
                      <div className="mt-2 space-y-1.5">
                        <p style={{ fontSize: 11, color: "#6B7280" }}>Opções:</p>
                        {(f.opcoes || []).map((o, oi) => (
                          <input
                            key={oi}
                            type="text"
                            value={o}
                            onChange={(e) => updateOption(f.id, oi, e.target.value)}
                            placeholder={`Opção ${oi + 1}`}
                            className="w-full px-3 py-1.5 rounded text-xs outline-none"
                            style={{ border: "1px solid #E5E7EB", backgroundColor: "white" }}
                          />
                        ))}
                        <button
                          onClick={() => addOption(f.id)}
                          className="text-xs flex items-center gap-1"
                          style={{ color: "#F5C100" }}
                        >
                          <Plus size={11} />
                          Adicionar opção
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mensagem de erro do save */}
            {saveError && (
              <div
                className="flex items-center gap-2 rounded-lg px-4 py-3"
                style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}
              >
                <AlertCircle size={14} color="#C62828" />
                <p style={{ fontSize: 13, color: "#C62828" }}>{saveError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setMode("view"); setSaved(false); setSaveError(null); }}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: "1px solid #E5E7EB", color: "#374151" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !nome.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ backgroundColor: "#1B1D40", color: "white" }}
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : saved ? (
                  <CheckCircle size={14} />
                ) : null}
                {saving ? "Salvando..." : "Salvar pesquisa"}
              </button>
              {mode === "edit" && (
                <button
                  onClick={openLaunch}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
                >
                  <Link2 size={14} />
                  Lançar edição
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal — lançar edição */}
      {launchModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: "white" }}>
            <div className="px-6 py-5" style={{ backgroundColor: "#F5C100" }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1B1D40" }}>
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
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1B1D40" }}>
                      Edição criada com sucesso!
                    </p>
                  </div>
                  <div
                    className="rounded-lg p-3"
                    style={{ backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7" }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#2E7D32", marginBottom: 6 }}>
                      Link público da pesquisa:
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-xs font-mono break-all select-all" style={{ color: "#1B5E20" }}>
                        {launchedLink}
                      </p>
                      <button
                        onClick={copyLink}
                        className="shrink-0 p-1.5 rounded-lg"
                        style={{ backgroundColor: "#2E7D32", color: "white" }}
                        title="Copiar link"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setLaunchModal(false)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold"
                    style={{ backgroundColor: "#1B1D40", color: "white" }}
                  >
                    Fechar
                  </button>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                        Data de início *
                      </label>
                      <input
                        type="date"
                        value={launchStartDate}
                        onChange={(e) => setLaunchStartDate(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                        Data de término
                      </label>
                      <input
                        type="date"
                        value={launchEndDate}
                        onChange={(e) => setLaunchEndDate(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                      />
                    </div>
                  </div>
                  {launchError && (
                    <div
                      className="flex items-center gap-2 rounded-lg px-3 py-2"
                      style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}
                    >
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
                      style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
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

      {/* Modal — confirmar exclusão */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-sm mx-4 rounded-2xl shadow-2xl p-6" style={{ backgroundColor: "white" }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: "#1B1D40", marginBottom: 8 }}>
              Excluir pesquisa
            </h3>
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
