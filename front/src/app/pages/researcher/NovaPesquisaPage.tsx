import { useState } from "react";
import { Plus, Trash2, CheckCircle, List } from "lucide-react";
import { FIELD_TYPES } from "../../../lib/constants";
import { FieldTypePicker } from "../../components/FieldTypePicker";
import type { Field, FieldType } from "../../../types";
import { useAppStore } from "../../context/AppStore";

export function NovaPesquisaPage() {
  const { addResearch } = useAppStore();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [publico, setPublico] = useState("publico_geral");
  const [campos, setCampos] = useState<Field[]>([]);
  const [saved, setSaved] = useState(false);
  const [activePreview, setActivePreview] = useState<number | null>(null);

  const addField = (tipo: FieldType) => {
    setCampos((prev) => [
      ...prev,
      {
        id: Date.now(),
        tipo,
        label: "",
        required: false,
        opcoes: tipo === "multipla_escolha" ? ["", ""] : undefined,
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
    if (!nome.trim() || campos.length === 0) return;
    addResearch({
      id: Date.now(),
      nome,
      descricao,
      campos,
      status: "rascunho",
      edicoes: 0,
    });
    setSaved(true);
  };

  if (saved) {
    return (
      <div
        className="p-6 flex flex-col items-center justify-center min-h-96 gap-4"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="p-5 rounded-full" style={{ backgroundColor: "#E8F5E9" }}>
          <CheckCircle size={48} color="#2E7D32" />
        </div>
        <h2 style={{ fontWeight: 700, fontSize: 22, color: "#1B1D40", textAlign: "center" }}>
          Pesquisa criada!
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", textAlign: "center", maxWidth: 360 }}>
          <strong>"{nome}"</strong> foi salva como rascunho. O administrador poderá lançar uma
          edição e gerar o link público.
        </p>
        <button
          onClick={() => {
            setSaved(false);
            setNome("");
            setDescricao("");
            setCampos([]);
            setPublico("publico_geral");
          }}
          className="px-6 py-3 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
        >
          Criar outra pesquisa
        </button>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="mb-6">
        <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1B1D40" }}>Nova Pesquisa</h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
          Crie um novo formulário de pesquisa para coleta de dados
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: form builder */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic info */}
          <div
            className="rounded-xl p-5 shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
          >
            <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1B1D40", marginBottom: 14 }}>
              Informações Básicas
            </h3>
            <div className="space-y-3">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                  Nome da pesquisa *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Pesquisa de Satisfação 2026"
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
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                  Público-alvo
                </label>
                <select
                  value={publico}
                  onChange={(e) => setPublico(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg text-sm outline-none appearance-none"
                  style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1B1D40" }}
                >
                  <option value="publico_geral">Público geral / Turistas</option>
                  <option value="moradores">Moradores de Olímpia</option>
                  <option value="hospedagem">Donos de meios de hospedagem</option>
                  <option value="comerciantes">Comerciantes locais</option>
                  <option value="demanda_turistica">Pesquisa de campo (Demanda Turística)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Field builder */}
          <div
            className="rounded-xl p-5 shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1B1D40" }}>
                Campos do Formulário ({campos.length})
              </h3>
              <FieldTypePicker onSelect={addField} />
            </div>

            {campos.length === 0 && (
              <div
                className="text-center py-12 rounded-xl"
                style={{ backgroundColor: "#FAFAFA", border: "2px dashed #E5E7EB" }}
              >
                <List size={24} color="#D1D5DB" className="mx-auto mb-2" />
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>Nenhum campo adicionado ainda.</p>
                <p style={{ fontSize: 12, color: "#D1D5DB" }}>
                  Clique em "Adicionar campo" para começar
                </p>
              </div>
            )}

            <div className="space-y-3">
              {campos.map((f, i) => {
                const ft = FIELD_TYPES.find((t) => t.tipo === f.tipo);
                const Icon = ft?.icon;
                const isExpanded = activePreview === f.id;
                return (
                  <div
                    key={f.id}
                    className="rounded-lg overflow-hidden"
                    style={{
                      border: "1px solid #E5E7EB",
                      backgroundColor: isExpanded ? "#FFFBF0" : "#FAFAFA",
                    }}
                  >
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      onClick={() => setActivePreview(isExpanded ? null : f.id)}
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: "#1B1D40", color: "white" }}
                      >
                        {i + 1}
                      </span>
                      {Icon && <Icon size={14} color="#F5C100" />}
                      <div className="flex-1 min-w-0">
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: f.label ? 600 : 400,
                            color: f.label ? "#1B1D40" : "#9CA3AF",
                          }}
                        >
                          {f.label || "Pergunta sem texto..."}
                        </p>
                        <p style={{ fontSize: 10, color: "#9CA3AF" }}>{ft?.label}</p>
                      </div>
                      <label
                        className="flex items-center gap-1 text-xs shrink-0"
                        style={{ color: "#6B7280" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={f.required}
                          onChange={(e) => updateField(f.id, { required: e.target.checked })}
                          style={{ accentColor: "#F5C100" }}
                        />
                        Obrig.
                      </label>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeField(f.id); }}
                        className="text-red-400 hover:text-red-600 ml-1 shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2">
                        <input
                          type="text"
                          value={f.label}
                          onChange={(e) => updateField(f.id, { label: e.target.value })}
                          placeholder="Texto da pergunta..."
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ border: "1px solid #E5E7EB", backgroundColor: "white", color: "#1B1D40" }}
                          autoFocus
                        />
                        {f.tipo === "multipla_escolha" && (
                          <div className="space-y-1.5">
                            <p style={{ fontSize: 11, color: "#6B7280" }}>Opções de resposta:</p>
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save */}
          <div className="flex gap-3">
            <button
              onClick={() => { setNome(""); setDescricao(""); setCampos([]); }}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold"
              style={{ border: "1px solid #E5E7EB", color: "#374151" }}
            >
              Limpar
            </button>
            <button
              onClick={handleSave}
              disabled={!nome.trim() || campos.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{ backgroundColor: "#1B1D40", color: "white" }}
            >
              Salvar pesquisa
            </button>
          </div>
        </div>

        {/* Right: preview */}
        <div className="lg:col-span-1">
          <div
            className="rounded-xl p-4 shadow-sm sticky top-4"
            style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
          >
            <h3 style={{ fontWeight: 700, fontSize: 13, color: "#1B1D40", marginBottom: 12 }}>
              Pré-visualização
            </h3>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
              <div className="p-3" style={{ backgroundColor: "#F5C100" }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: "#1B1D40" }}>
                  {nome || "Nome da pesquisa"}
                </p>
                <p style={{ fontSize: 11, color: "#5A5A2A", marginTop: 2 }}>
                  {descricao || "Descrição da pesquisa"}
                </p>
              </div>
              <div className="p-3 space-y-3">
                {campos.length === 0 ? (
                  <p style={{ fontSize: 12, color: "#D1D5DB", textAlign: "center", padding: "16px 0" }}>
                    Adicione campos para ver o preview
                  </p>
                ) : (
                  campos.map((f, i) => (
                    <div key={f.id}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                        {i + 1}. {f.label || "(sem texto)"}
                        {f.required && <span style={{ color: "#C8102E" }}> *</span>}
                      </p>
                      {f.tipo === "texto" && (
                        <div
                          className="mt-1 h-7 rounded"
                          style={{ backgroundColor: "#F9F9F9", border: "1px solid #E5E7EB" }}
                        />
                      )}
                      {f.tipo === "numero" && (
                        <div
                          className="mt-1 h-7 rounded w-24"
                          style={{ backgroundColor: "#F9F9F9", border: "1px solid #E5E7EB" }}
                        />
                      )}
                      {f.tipo === "multipla_escolha" && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(f.opcoes || []).filter(Boolean).map((o, oi) => (
                            <span
                              key={oi}
                              className="px-2 py-0.5 rounded text-xs"
                              style={{ backgroundColor: "#F9F9F9", border: "1px solid #E5E7EB", color: "#6B7280" }}
                            >
                              {o}
                            </span>
                          ))}
                        </div>
                      )}
                      {f.tipo === "escala" && (
                        <div className="mt-1 flex gap-1">
                          {[1, 2, 3, 4, 5].map((v) => (
                            <span
                              key={v}
                              className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor: "#F9F9F9", border: "1px solid #E5E7EB", color: "#6B7280" }}
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                      {f.tipo === "sim_nao" && (
                        <div className="mt-1 flex gap-1">
                          {["Sim", "Não"].map((o) => (
                            <span
                              key={o}
                              className="px-3 py-0.5 rounded text-xs"
                              style={{ backgroundColor: "#F9F9F9", border: "1px solid #E5E7EB", color: "#6B7280" }}
                            >
                              {o}
                            </span>
                          ))}
                        </div>
                      )}
                      {f.tipo === "data" && (
                        <div
                          className="mt-1 h-7 rounded w-32"
                          style={{ backgroundColor: "#F9F9F9", border: "1px solid #E5E7EB" }}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
              {campos.length > 0 && (
                <div className="p-3 border-t" style={{ borderColor: "#F0EDE8" }}>
                  <div className="h-8 rounded-lg w-full" style={{ backgroundColor: "#1B1D40" }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
