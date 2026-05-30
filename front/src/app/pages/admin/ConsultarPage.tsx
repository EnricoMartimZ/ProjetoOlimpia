import { useState, useEffect } from "react";
import { Search, Download, Plus, Trash2, ChevronLeft, ChevronRight, FileText, X, CheckCircle } from "lucide-react";
import { useAppStore } from "../../context/AppStore";
import type { ResponseRow } from "../../../types";

const MOTIVOS = ["Lazer", "Negócios", "Saúde", "Eventos", "Outros"] as const;
const HOSPEDAGENS = ["Resort", "Hotel", "Pousada", "Casa de parentes", "Airbnb", "Outros"] as const;
const FAIXAS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;

const emptyNewRow = () => ({
  data: new Date().toISOString().split("T")[0],
  pesquisador: "",
  cidade: "",
  motivo: "Lazer",
  visitas: 1,
  dias: 1,
  hospedagem: "Hotel",
  faixa: "25-34",
  nota: 5,
});

export function ConsultarPage() {
  const { researches, editions, responseRows, addResponseRow, deleteResponseRow } = useAppStore();

  const [selectedPesquisa, setSelectedPesquisa] = useState("1");
  const [selectedEdicao, setSelectedEdicao] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [newRowModal, setNewRowModal] = useState(false);
  const [newRow, setNewRow] = useState(emptyNewRow);

  const editionsForPesquisa = editions.filter(
    (e) => e.pesquisaId === parseInt(selectedPesquisa)
  );

  useEffect(() => {
    if (editionsForPesquisa.length > 0) {
      const active = editionsForPesquisa.find((e) => e.status === "ativa");
      setSelectedEdicao(String(active ? active.id : editionsForPesquisa[editionsForPesquisa.length - 1].id));
    } else {
      setSelectedEdicao("");
    }
    setPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPesquisa]);

  const pesquisaId = parseInt(selectedPesquisa);
  const edicaoId = selectedEdicao ? parseInt(selectedEdicao) : null;

  const filtered = responseRows.filter((r) => {
    if (r.pesquisaId !== undefined && r.pesquisaId !== pesquisaId) return false;
    if (edicaoId !== null && r.edicaoId !== undefined && r.edicaoId !== edicaoId) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.cidade.toLowerCase().includes(q) ||
      r.pesquisador.toLowerCase().includes(q) ||
      r.motivo.toLowerCase().includes(q)
    );
  });

  const PER_PAGE = 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const pesquisaAtual = researches.find((p) => p.id === pesquisaId);
  const edicaoAtual = editions.find((e) => e.id === edicaoId);

  const exportCSV = () => {
    const headers = ["ID", "Data", "Pesquisador", "Cidade", "Motivo", "Visitas", "Dias", "Hospedagem", "Faixa Etária", "Avaliação"];
    const rows = filtered.map((r) => [
      `#${r.id.toString().padStart(4, "0")}`,
      r.data,
      r.pesquisador,
      r.cidade,
      r.motivo,
      r.visitas,
      r.dias,
      r.hospedagem,
      r.faixa,
      r.nota,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consulta_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDateBR = (iso: string): string => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const handleAddRow = () => {
    if (!newRow.pesquisador.trim() || !newRow.cidade.trim()) return;
    const row: ResponseRow = {
      id: Date.now(),
      pesquisaId,
      edicaoId: edicaoId ?? undefined,
      data: formatDateBR(newRow.data),
      pesquisador: newRow.pesquisador,
      cidade: newRow.cidade,
      motivo: newRow.motivo,
      visitas: newRow.visitas,
      dias: newRow.dias,
      hospedagem: newRow.hospedagem,
      faixa: newRow.faixa,
      nota: newRow.nota,
    };
    addResponseRow(row);
    setNewRowModal(false);
    setNewRow(emptyNewRow());
  };

  const nota = (n: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: i <= n ? "#F5C100" : "#E5E7EB",
            display: "inline-block",
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="p-6" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="mb-6">
        <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1B1D40" }}>Consultar Dados</h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
          Visualize e gerencie os registros de respostas de cada edição
        </p>
      </div>

      {/* Filter bar */}
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
            onChange={(e) => { setSelectedPesquisa(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1B1D40" }}
          >
            {researches.map((r) => (
              <option key={r.id} value={r.id}>{r.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
            Edição
          </label>
          <select
            value={selectedEdicao}
            onChange={(e) => { setSelectedEdicao(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1B1D40" }}
          >
            {editionsForPesquisa.length === 0 ? (
              <option value="">Nenhuma edição</option>
            ) : (
              editionsForPesquisa.map((e) => (
                <option key={e.id} value={e.id}>{e.nome}</option>
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
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cidade, pesquisador..."
              className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1B1D40" }}
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: "#1B1D40", color: "white" }}
          >
            <Download size={14} />
            Exportar CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
          >
            <FileText size={14} />
            PDF
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: edicaoAtual?.status === "ativa" ? "#E8F5E9" : "#F0EDE8",
              color: edicaoAtual?.status === "ativa" ? "#2E7D32" : "#6B7280",
            }}
          >
            {edicaoAtual?.status === "ativa" ? "✓ Edição ativa" : "Edição encerrada"}
          </div>
          <span style={{ fontSize: 12, color: "#6B7280" }}>
            {pesquisaAtual?.nome} — {edicaoAtual?.nome ?? "Nenhuma edição"} | {edicaoAtual?.inicio} a {edicaoAtual?.fim}
          </span>
        </div>
        <button
          onClick={() => setNewRowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
        >
          <Plus size={13} />
          Novo registro
        </button>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden shadow-sm"
        style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#1B1D40" }}>
                {["ID", "Data", "Pesquisador", "Cidade de origem", "Motivo", "Visitas", "Dias", "Hospedagem", "Faixa etária", "Avaliação", "Ações"].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left whitespace-nowrap"
                    style={{ fontSize: 11, fontWeight: 600, color: "white", letterSpacing: "0.04em" }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center" style={{ color: "#9CA3AF", fontSize: 13 }}>
                    Nenhum registro encontrado para esta edição.
                  </td>
                </tr>
              ) : (
                paginated.map((row, i) => (
                  <tr key={row.id} style={{ backgroundColor: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "#6B7280" }}>#{row.id.toString().padStart(4, "0")}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>{row.data}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: "#1B1D40" }}>{row.pesquisador}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>{row.cidade}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#FFF3CD", color: "#B8860B" }}>
                        {row.motivo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-center" style={{ color: "#374151" }}>{row.visitas}</td>
                    <td className="px-4 py-3 text-xs text-center" style={{ color: "#374151" }}>{row.dias}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>{row.hospedagem}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>{row.faixa}</td>
                    <td className="px-4 py-3">{nota(row.nota)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setConfirmDelete(row.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #F0EDE8" }}>
          <p style={{ fontSize: 12, color: "#6B7280" }}>
            {filtered.length === 0
              ? "Nenhum registro"
              : `Mostrando ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} de ${filtered.length} registros`}
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
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className="w-8 h-8 rounded-lg text-xs font-semibold"
                style={{
                  backgroundColor: page === i + 1 ? "#F5C100" : "transparent",
                  color: page === i + 1 ? "#1B1D40" : "#6B7280",
                  border: `1px solid ${page === i + 1 ? "#F5C100" : "#E5E7EB"}`,
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg disabled:opacity-30"
              style={{ border: "1px solid #E5E7EB" }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-sm mx-4 rounded-2xl shadow-2xl p-6" style={{ backgroundColor: "white" }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: "#1B1D40", marginBottom: 8 }}>
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
                onClick={() => { deleteResponseRow(confirmDelete); setConfirmDelete(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "#C8102E", color: "white" }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New row modal */}
      {newRowModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: "white" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: "#F5C100" }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1B1D40" }}>Novo Registro</h2>
                <p style={{ fontSize: 12, color: "#5A5A2A" }}>
                  {pesquisaAtual?.nome} — {edicaoAtual?.nome ?? "sem edição"}
                </p>
              </div>
              <button onClick={() => setNewRowModal(false)}>
                <X size={20} color="#1B1D40" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Data</label>
                  <input
                    type="date"
                    value={newRow.data}
                    onChange={(e) => setNewRow({ ...newRow, data: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Pesquisador *</label>
                  <input
                    type="text"
                    value={newRow.pesquisador}
                    onChange={(e) => setNewRow({ ...newRow, pesquisador: e.target.value })}
                    placeholder="Nome do pesquisador"
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Cidade de origem *</label>
                <input
                  type="text"
                  value={newRow.cidade}
                  onChange={(e) => setNewRow({ ...newRow, cidade: e.target.value })}
                  placeholder="Ex: São Paulo"
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Motivo</label>
                  <select
                    value={newRow.motivo}
                    onChange={(e) => setNewRow({ ...newRow, motivo: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1B1D40" }}
                  >
                    {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Hospedagem</label>
                  <select
                    value={newRow.hospedagem}
                    onChange={(e) => setNewRow({ ...newRow, hospedagem: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1B1D40" }}
                  >
                    {HOSPEDAGENS.map((h) => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Visitas</label>
                  <input
                    type="number"
                    min={1}
                    value={newRow.visitas}
                    onChange={(e) => setNewRow({ ...newRow, visitas: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Dias</label>
                  <input
                    type="number"
                    min={1}
                    value={newRow.dias}
                    onChange={(e) => setNewRow({ ...newRow, dias: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Faixa etária</label>
                  <select
                    value={newRow.faixa}
                    onChange={(e) => setNewRow({ ...newRow, faixa: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1B1D40" }}
                  >
                    {FAIXAS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Avaliação</label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setNewRow({ ...newRow, nota: v })}
                      className="flex-1 py-2 rounded-lg text-sm font-bold"
                      style={{
                        backgroundColor: newRow.nota === v ? "#F5C100" : "#F9F9F9",
                        color: newRow.nota === v ? "#1B1D40" : "#9CA3AF",
                        border: `1px solid ${newRow.nota === v ? "#F5C100" : "#E5E7EB"}`,
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
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
                  disabled={!newRow.pesquisador.trim() || !newRow.cidade.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                  style={{ backgroundColor: "#1B1D40", color: "white" }}
                >
                  <CheckCircle size={14} />
                  Adicionar registro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
