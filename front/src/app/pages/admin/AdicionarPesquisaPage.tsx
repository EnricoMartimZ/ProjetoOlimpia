import { useState } from "react";
import {
  Plus, Trash2, Edit3, CheckCircle, Link2, List, Copy,
} from "lucide-react";
import { useAppStore } from "../../context/AppStore";
import { FIELD_TYPES, toSlug } from "../../../lib/constants";
import { FieldTypePicker } from "../../components/FieldTypePicker";
import type { Field, FieldType, Research, Edition } from "../../../types";

const statusColor = (s: string) => {
  if (s === "ativa") return { bg: "#E8F5E9", text: "#2E7D32" };
  if (s === "encerrada") return { bg: "#FFEBEE", text: "#C62828" };
  return { bg: "#FFF3CD", text: "#B8860B" };
};

const ordinal = (n: number) => `${n}ª`;

export function AdicionarPesquisaPage() {
  const { researches, addResearch, updateResearch, deleteResearch, editions, addEdition } = useAppStore();

  const [selected, setSelected] = useState<Research | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | "new">("view");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [campos, setCampos] = useState<Field[]>([]);
  const [saved, setSaved] = useState(false);

  const [launchModal, setLaunchModal] = useState(false);
  const [launchStartDate, setLaunchStartDate] = useState("");
  const [launchEndDate, setLaunchEndDate] = useState("");
  const [launchedLink, setLaunchedLink] = useState("");
  const [launchDone, setLaunchDone] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const startNew = () => {
    setNome("");
    setDescricao("");
    setCampos([]);
    setSelected(null);
    setMode("new");
    setSaved(false);
  };

  const startEdit = (r: Research) => {
    setSelected(r);
    setNome(r.nome);
    setDescricao(r.descricao);
    setCampos([...r.campos]);
    setMode("edit");
    setSaved(false);
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

  const handleSave = () => {
    if (!nome.trim()) return;
    if (mode === "new") {
      const newR: Research = {
        id: Date.now(),
        nome,
        descricao,
        campos,
        status: "rascunho",
        edicoes: 0,
      };
      addResearch(newR);
      setSelected(newR);
    } else if (selected) {
      const updated = { ...selected, nome, descricao, campos };
      updateResearch(updated);
      setSelected(updated);
    }
    setSaved(true);
    setMode("view");
  };

  const openLaunch = () => {
    setLaunchStartDate("");
    setLaunchEndDate("");
    setLaunchedLink("");
    setLaunchDone(false);
    setLaunchModal(true);
  };

  const handleConfirmLaunch = () => {
    if (!launchStartDate) return;
    const research = selected ?? researches.find((r) => r.nome === nome);
    if (!research) return;

    const editionsForThis = editions.filter((e) => e.pesquisaId === research.id);
    const editionNumber = research.edicoes + 1;
    const year = new Date().getFullYear();

    const formatDate = (iso: string): string => {
      if (!iso) return "—";
      const [y, m, d] = iso.split("-");
      return `${d}/${m}/${y}`;
    };

    const newEdition: Edition = {
      id: Date.now(),
      pesquisaId: research.id,
      nome: `${ordinal(editionNumber)} Edição ${year}`,
      inicio: formatDate(launchStartDate),
      fim: launchEndDate ? formatDate(launchEndDate) : "—",
      respostas: 0,
      status: "ativa",
    };

    addEdition(newEdition);

    const link = `${window.location.origin}/pesquisa/${toSlug(research.nome)}`;
    setLaunchedLink(link);
    setLaunchDone(true);

    if (selected) {
      setSelected({ ...selected, edicoes: selected.edicoes + 1, status: "ativa" });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(launchedLink).catch(() => {});
  };

  return (
    <div className="p-6 flex gap-6 h-full" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Left panel */}
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

        <div className="overflow-y-auto space-y-2 pr-1">
          {researches.map((r) => {
            const sc = statusColor(r.status);
            return (
              <button
                key={r.id}
                onClick={() => { setSelected(r); setMode("view"); }}
                className="w-full text-left rounded-xl p-3 transition-all"
                style={{
                  backgroundColor: selected?.id === r.id ? "#F5C100" : "white",
                  border: `1px solid ${selected?.id === r.id ? "#F5C100" : "#F0EDE8"}`,
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
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
                  <h1 style={{ fontWeight: 700, fontSize: 20, color: "#1B1D40" }}>{selected.nome}</h1>
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

            <div className="flex gap-3">
              <button
                onClick={() => { setMode("view"); setSaved(false); }}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: "1px solid #E5E7EB", color: "#374151" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "#1B1D40", color: "white" }}
              >
                {saved && <CheckCircle size={14} />}
                Salvar pesquisa
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

      {/* Launch modal */}
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
                      disabled={!launchStartDate}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                      style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
                    >
                      Confirmar lançamento
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-sm mx-4 rounded-2xl shadow-2xl p-6" style={{ backgroundColor: "white" }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: "#1B1D40", marginBottom: 8 }}>
              Excluir pesquisa
            </h3>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
              Esta ação é irreversível. A pesquisa e todos os seus campos serão removidos.
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
                onClick={() => {
                  deleteResearch(deleteConfirm);
                  setSelected(null);
                  setMode("view");
                  setDeleteConfirm(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "#C8102E", color: "white" }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
