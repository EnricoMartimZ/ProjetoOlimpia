import { useEffect, useState } from "react";
import { Trash2, Filter, TrendingUp } from "lucide-react";
import {
  getDiarias,
  getHospedagens,
  deleteDiaria,
  type DiariaAPI,
  type HospedagemAPI,
} from "../../../../services/api";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtData = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

/** Aba: registros de diária média já inseridos, com filtro por data/hospedagem e remoção. */
export function RegistrosTab() {
  const [registros, setRegistros] = useState<DiariaAPI[]>([]);
  const [hospedagens, setHospedagens] = useState<HospedagemAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroHosp, setFiltroHosp] = useState("");
  const [filtroData, setFiltroData] = useState("");

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      setRegistros(
        await getDiarias({
          hospedagem_cnpj: filtroHosp || undefined,
          data: filtroData || undefined,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  };

  // Carrega as hospedagens uma vez (para o seletor de filtro).
  useEffect(() => {
    getHospedagens().then(setHospedagens).catch(() => { /* ignora; filtro fica vazio */ });
  }, []);

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroHosp, filtroData]);

  const remover = async (r: DiariaAPI) => {
    if (!confirm(`Remover o registro de ${fmtData(r.data)} de "${r.nome_fantasia}"?`)) return;
    try {
      await deleteDiaria(r.id);
      carregar();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao remover.");
    }
  };

  const inputStyle = { border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" } as const;

  return (
    <div>
      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Filter size={16} style={{ color: "#9CA3AF" }} />
        <select
          value={filtroHosp}
          onChange={(e) => setFiltroHosp(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm outline-none"
          style={inputStyle}
        >
          <option value="">Todas as hospedagens</option>
          {hospedagens.map((h) => (
            <option key={h.cnpj} value={h.cnpj}>{h.nome_fantasia}</option>
          ))}
        </select>
        <input
          type="date"
          value={filtroData}
          onChange={(e) => setFiltroData(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm outline-none"
          style={inputStyle}
        />
        {(filtroHosp || filtroData) && (
          <button
            onClick={() => { setFiltroHosp(""); setFiltroData(""); }}
            className="text-sm underline"
            style={{ color: "#6B7280" }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {loading && <p style={{ fontSize: 13, color: "#6B7280" }}>Carregando...</p>}
      {error && <p style={{ fontSize: 13, color: "#DC2626" }}>{error}</p>}

      {!loading && !error && registros.length === 0 && (
        <p className="py-16 text-center" style={{ fontSize: 14, color: "#6B7280" }}>
          Nenhum registro encontrado.
        </p>
      )}

      {registros.length > 0 && (
        <div
          className="flex items-center gap-4 rounded-xl px-5 py-4 mb-4"
          style={{ backgroundColor: "white", border: "1px solid #F0EDE8", borderLeft: "4px solid #F5C944" }}
        >
          <TrendingUp size={18} style={{ color: "#F5C944", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {filtroHosp
                ? `Diária média — ${hospedagens.find(h => h.cnpj === filtroHosp)?.nome_fantasia ?? filtroHosp}`
                : "Diária média — todas as hospedagens"}
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#1D2E36", lineHeight: 1.2 }}>
              {brl(registros.reduce((s, r) => s + r.preco, 0) / registros.length)}
            </p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>
              {registros.length} {registros.length === 1 ? "registro" : "registros"}
            </p>
          </div>
        </div>
      )}

      {registros.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #F0EDE8" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#FAFAF7", color: "#6B7280" }}>
                <th className="text-left px-4 py-3" style={{ fontWeight: 600 }}>Hospedagem</th>
                <th className="text-left px-4 py-3" style={{ fontWeight: 600 }}>Data</th>
                <th className="text-right px-4 py-3" style={{ fontWeight: 600 }}>Diária</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #F0EDE8" }}>
                  <td className="px-4 py-3" style={{ color: "#1B1D40", fontWeight: 600 }}>{r.nome_fantasia}</td>
                  <td className="px-4 py-3" style={{ color: "#374151" }}>{fmtData(r.data)}</td>
                  <td className="px-4 py-3 text-right" style={{ color: "#374151" }}>{brl(r.preco)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remover(r)} aria-label="Remover registro">
                      <Trash2 size={15} color="#DC2626" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
