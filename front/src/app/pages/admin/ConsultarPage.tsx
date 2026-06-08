import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Download, Plus, Trash2, ChevronLeft, ChevronRight,
  X, CheckCircle, Loader2, AlertCircle,
} from "lucide-react";
import {
  getPesquisas,
  getEdicoes,
  getRespostas,
  deleteResposta,
  submitResposta,
  getPublicEdicao,
  type PesquisaListItem,
  type EdicaoAPI,
  type RespostasTabela,
  type CampoHeader,
  type PublicEdicaoAPI,
} from "../../../services/api";

const PER_PAGE = 10;

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function ConsultarPage() {
  // Dropdowns
  const [pesquisas, setPesquisas] = useState<PesquisaListItem[]>([]);
  const [selectedPesquisa, setSelectedPesquisa] = useState<number | "">("");
  const [edicoes, setEdicoes] = useState<EdicaoAPI[]>([]);
  const [selectedEdicao, setSelectedEdicao] = useState<number | "">("");

  // Tabela
  const [tabela, setTabela] = useState<RespostasTabela | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Modais
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newRowModal, setNewRowModal] = useState(false);

  // Campos completos (com opções) para o formulário de novo registro
  const [edicaoCampos, setEdicaoCampos] = useState<PublicEdicaoAPI["campos"]>([]);
  const [newRow, setNewRow] = useState<Record<number, string>>({});
  const [savingRow, setSavingRow] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // -------------------------------------------------------------------------
  // Carregamentos
  // -------------------------------------------------------------------------

  // Pesquisas (dropdown)
  useEffect(() => {
    getPesquisas()
      .then((data) => {
        setPesquisas(data);
        if (data.length > 0) setSelectedPesquisa(data[0].id);
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar pesquisas."));
  }, []);

  // Edições da pesquisa selecionada (dropdown)
  useEffect(() => {
    if (selectedPesquisa === "") {
      setEdicoes([]);
      setSelectedEdicao("");
      return;
    }
    getEdicoes(selectedPesquisa)
      .then((data) => {
        setEdicoes(data);
        if (data.length > 0) {
          const ativa = data.find((e) => e.status === "ativa");
          setSelectedEdicao(ativa ? ativa.id : data[data.length - 1].id);
        } else {
          setSelectedEdicao("");
          setTabela(null);
        }
        setPage(1);
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar edições."));
  }, [selectedPesquisa]);

  // Debounce da busca
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Respostas (tabela)
  const fetchRespostas = useCallback(async () => {
    if (selectedEdicao === "") { setTabela(null); return; }
    setLoading(true);
    setErro(null);
    try {
      const data = await getRespostas(selectedEdicao, {
        pagina: page,
        por_pagina: PER_PAGE,
        busca: search || undefined,
      });
      setTabela(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar respostas.");
    } finally {
      setLoading(false);
    }
  }, [selectedEdicao, page, search]);

  useEffect(() => { fetchRespostas(); }, [fetchRespostas]);

  // Campos completos (com opções) para o modal de novo registro
  useEffect(() => {
    if (selectedEdicao === "") { setEdicaoCampos([]); return; }
    getPublicEdicao(selectedEdicao)
      .then((data) => setEdicaoCampos(data.campos))
      .catch(() => setEdicaoCampos([]));
  }, [selectedEdicao]);

  // -------------------------------------------------------------------------
  // Derivados
  // -------------------------------------------------------------------------

  const header: CampoHeader[] = tabela?.campos_header ?? [];
  const total = tabela?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const pesquisaAtual = pesquisas.find((p) => p.id === selectedPesquisa);
  const edicaoAtual = edicoes.find((e) => e.id === selectedEdicao);

  // -------------------------------------------------------------------------
  // Ações
  // -------------------------------------------------------------------------

  const handleDelete = async (respostaId: number) => {
    if (selectedEdicao === "") return;
    setDeleting(true);
    try {
      await deleteResposta(selectedEdicao, respostaId);
      setConfirmDelete(null);
      // Se a página ficou vazia, volta uma
      if (tabela && tabela.dados.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchRespostas();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir resposta.");
    } finally {
      setDeleting(false);
    }
  };

  const openNewRow = () => {
    setNewRow({});
    setRowError(null);
    setNewRowModal(true);
  };

  const handleAddRow = async () => {
    if (selectedEdicao === "") return;
    const respostas = edicaoCampos
      .filter((c) => newRow[c.id] !== undefined && newRow[c.id] !== "")
      .map((c) => ({ campo_id: c.id, atributo_texto: String(newRow[c.id]) }));

    if (respostas.length === 0) {
      setRowError("Preencha ao menos um campo.");
      return;
    }
    // Valida obrigatórios
    const faltando = edicaoCampos.find((c) => c.obrigatorio && !newRow[c.id]);
    if (faltando) {
      setRowError(`O campo "${faltando.texto_pergunta}" é obrigatório.`);
      return;
    }

    setSavingRow(true);
    setRowError(null);
    try {
      await submitResposta(selectedEdicao, respostas);
      setNewRowModal(false);
      setPage(1);
      fetchRespostas();
    } catch (e) {
      setRowError(e instanceof Error ? e.message : "Erro ao adicionar registro.");
    } finally {
      setSavingRow(false);
    }
  };

  const exportCSV = async () => {
    if (selectedEdicao === "" || total === 0) return;
    setExporting(true);
    try {
      // Busca todas as respostas (ignora paginação) com o mesmo filtro
      const all = await getRespostas(selectedEdicao, {
        pagina: 1,
        por_pagina: total,
        busca: search || undefined,
      });
      const headers = ["ID", "Data/Hora", "Coletado por", ...all.campos_header.map((c) => c.texto_pergunta)];
      const rows = all.dados.map((r) => [
        `#${r.resposta_id.toString().padStart(4, "0")}`,
        formatTimestamp(r.timestamp_envio),
        r.usuario_nome ?? "Público / anônimo",
        ...all.campos_header.map((c) => r.valores[String(c.id)] ?? ""),
      ]);
      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
        .join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `respostas_edicao_${selectedEdicao}_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao exportar CSV.");
    } finally {
      setExporting(false);
    }
  };

  const inicio = useMemo(() => (total === 0 ? 0 : (page - 1) * PER_PAGE + 1), [page, total]);
  const fim = Math.min(page * PER_PAGE, total);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="p-6" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="mb-6">
        <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1D2E36" }}>Consultar Dados</h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
          Visualize e gerencie os registros de respostas de cada edição
        </p>
      </div>

      {/* Filtros */}
      <div
        className="rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3"
        style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
      >
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
            Pesquisa
          </label>
          <select
            value={selectedPesquisa}
            onChange={(e) => setSelectedPesquisa(e.target.value ? Number(e.target.value) : "")}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1D2E36" }}
          >
            {pesquisas.length === 0 && <option value="">Nenhuma pesquisa</option>}
            {pesquisas.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
            Edição
          </label>
          <select
            value={selectedEdicao}
            onChange={(e) => { setSelectedEdicao(e.target.value ? Number(e.target.value) : ""); setPage(1); }}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1D2E36" }}
          >
            {edicoes.length === 0 ? (
              <option value="">Nenhuma edição</option>
            ) : (
              edicoes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.numero_edicao}ª edição ({e.status})
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
            Buscar
          </label>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar em qualquer resposta..."
              className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1D2E36" }}
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={exportCSV}
            disabled={exporting || total === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
            style={{ backgroundColor: "#1D2E36", color: "white" }}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Barra de info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {edicaoAtual && (
            <div
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: edicaoAtual.status === "ativa" ? "#E8F5E9" : "#F0EDE8",
                color: edicaoAtual.status === "ativa" ? "#2E7D32" : "#6B7280",
              }}
            >
              {edicaoAtual.status === "ativa" ? "✓ Edição ativa" : `Edição ${edicaoAtual.status}`}
            </div>
          )}
          <span style={{ fontSize: 12, color: "#6B7280" }}>
            {pesquisaAtual?.nome ?? "—"}
            {edicaoAtual && ` — ${edicaoAtual.numero_edicao}ª edição`}
            {` | ${total} resposta${total !== 1 ? "s" : ""}`}
          </span>
        </div>
        <button
          onClick={openNewRow}
          disabled={selectedEdicao === ""}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40"
          style={{ backgroundColor: "#F5C944", color: "#1D2E36" }}
        >
          <Plus size={13} />
          Novo registro
        </button>
      </div>

      {/* Erro */}
      {erro && (
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3 mb-3"
          style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}
        >
          <AlertCircle size={14} color="#C62828" />
          <p style={{ fontSize: 13, color: "#C62828" }}>{erro}</p>
        </div>
      )}

      {/* Tabela */}
      <div
        className="rounded-xl overflow-hidden shadow-sm"
        style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#1D2E36" }}>
                <th className="px-4 py-3 text-left whitespace-nowrap" style={{ fontSize: 11, fontWeight: 600, color: "white" }}>ID</th>
                <th className="px-4 py-3 text-left whitespace-nowrap" style={{ fontSize: 11, fontWeight: 600, color: "white" }}>Data/Hora</th>
                <th className="px-4 py-3 text-left whitespace-nowrap" style={{ fontSize: 11, fontWeight: 600, color: "white" }}>Coletado por</th>
                {header.map((c) => (
                  <th key={c.id} className="px-4 py-3 text-left whitespace-nowrap" style={{ fontSize: 11, fontWeight: 600, color: "white" }}>
                    {c.texto_pergunta}
                  </th>
                ))}
                <th className="px-4 py-3 text-left whitespace-nowrap" style={{ fontSize: 11, fontWeight: 600, color: "white" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={header.length + 4} className="px-4 py-10 text-center" style={{ color: "#9CA3AF", fontSize: 13 }}>
                    <Loader2 size={18} className="animate-spin inline mr-2" />
                    Carregando...
                  </td>
                </tr>
              ) : !tabela || tabela.dados.length === 0 ? (
                <tr>
                  <td colSpan={header.length + 4} className="px-4 py-10 text-center" style={{ color: "#9CA3AF", fontSize: 13 }}>
                    {selectedEdicao === "" ? "Selecione uma edição." : "Nenhum registro encontrado."}
                  </td>
                </tr>
              ) : (
                tabela.dados.map((r, i) => (
                  <tr key={r.resposta_id} style={{ backgroundColor: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "#6B7280" }}>
                      #{r.resposta_id.toString().padStart(4, "0")}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>
                      {formatTimestamp(r.timestamp_envio)}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {r.usuario_nome ? (
                        <span style={{ color: "#1D2E36", fontWeight: 600 }}>{r.usuario_nome}</span>
                      ) : (
                        <span style={{ color: "#9CA3AF" }}>Público / anônimo</span>
                      )}
                    </td>
                    {header.map((c) => (
                      <td key={c.id} className="px-4 py-3 text-xs" style={{ color: "#374151" }}>
                        {r.valores[String(c.id)] ?? <span style={{ color: "#D1D5DB" }}>—</span>}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <button onClick={() => setConfirmDelete(r.resposta_id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #F0EDE8" }}>
          <p style={{ fontSize: 12, color: "#6B7280" }}>
            {total === 0 ? "Nenhum registro" : `Mostrando ${inicio}–${fim} de ${total} registros`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg disabled:opacity-30"
              style={{ border: "1px solid #E5E7EB" }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 12, color: "#374151", padding: "0 8px" }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg disabled:opacity-30"
              style={{ border: "1px solid #E5E7EB" }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmar exclusão */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-sm mx-4 rounded-2xl shadow-2xl p-6" style={{ backgroundColor: "white" }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: "#1D2E36", marginBottom: 8 }}>
              Confirmar exclusão
            </h3>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
              Esta ação não pode ser desfeita. Deseja excluir este registro?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: "1px solid #E5E7EB", color: "#374151" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
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

      {/* Novo registro (dinâmico a partir dos campos da edição) */}
      {newRowModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: "white" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: "#F5C944" }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1D2E36" }}>Novo Registro</h2>
                <p style={{ fontSize: 12, color: "#5A5A2A" }}>
                  {pesquisaAtual?.nome} — {edicaoAtual?.numero_edicao}ª edição
                </p>
              </div>
              <button onClick={() => setNewRowModal(false)}>
                <X size={20} color="#1D2E36" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              {edicaoCampos.map((c) => (
                <div key={c.id}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                    {c.texto_pergunta}{c.obrigatorio && <span style={{ color: "#C8102E" }}> *</span>}
                  </label>
                  {(c.tipo === "texto" || c.tipo === "numero" || c.tipo === "data" || c.tipo === "texto_longo") && (
                    <input
                      type={c.tipo === "numero" ? "number" : c.tipo === "data" ? "date" : "text"}
                      value={newRow[c.id] ?? ""}
                      onChange={(e) => setNewRow({ ...newRow, [c.id]: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                    />
                  )}
                  {c.tipo === "multipla_escolha" && (
                    <select
                      value={newRow[c.id] ?? ""}
                      onChange={(e) => setNewRow({ ...newRow, [c.id]: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1D2E36" }}
                    >
                      <option value="">Selecione...</option>
                      {c.opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}
                  {c.tipo === "sim_nao" && (
                    <select
                      value={newRow[c.id] ?? ""}
                      onChange={(e) => setNewRow({ ...newRow, [c.id]: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1D2E36" }}
                    >
                      <option value="">Selecione...</option>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  )}
                  {c.tipo === "escala" && (
                    <div className="flex gap-2 mt-1">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setNewRow({ ...newRow, [c.id]: String(v) })}
                          className="flex-1 py-2 rounded-lg text-sm font-bold"
                          style={{
                            backgroundColor: newRow[c.id] === String(v) ? "#F5C944" : "#F9F9F9",
                            color: newRow[c.id] === String(v) ? "#1D2E36" : "#9CA3AF",
                            border: `1px solid ${newRow[c.id] === String(v) ? "#F5C944" : "#E5E7EB"}`,
                          }}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {rowError && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}>
                  <AlertCircle size={13} color="#C62828" />
                  <p style={{ fontSize: 12, color: "#C62828" }}>{rowError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewRowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ border: "1px solid #E5E7EB", color: "#374151" }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddRow}
                  disabled={savingRow}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                  style={{ backgroundColor: "#1D2E36", color: "white" }}
                >
                  {savingRow ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  {savingRow ? "Salvando..." : "Adicionar registro"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
