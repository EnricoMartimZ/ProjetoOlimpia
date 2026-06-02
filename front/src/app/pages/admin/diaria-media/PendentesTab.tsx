import { useEffect, useState } from "react";
import { Clock, CheckCircle, Calendar } from "lucide-react";
import { getPendentes, type HospedagemPendenteAPI } from "../../../../services/api";
import { HotelImage, Stars } from "./HotelImage";
import { FillDiariaModal } from "./FillDiariaModal";

const hoje = () => new Date().toISOString().slice(0, 10);

/** Aba: hospedagens que ainda precisam ter a diária preenchida na data escolhida. */
export function PendentesTab() {
  const [data, setData] = useState(hoje());
  const [pendentes, setPendentes] = useState<HospedagemPendenteAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fill, setFill] = useState<HospedagemPendenteAPI | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      setPendentes(await getPendentes(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div
          className="px-4 py-2 rounded-xl flex items-center gap-2"
          style={{
            backgroundColor: pendentes.length > 0 ? "#FFF3CD" : "#E8F5E9",
            border: `1px solid ${pendentes.length > 0 ? "#F5C100" : "#A5D6A7"}`,
          }}
        >
          {pendentes.length > 0 ? (
            <Clock size={14} style={{ color: "#B8860B" }} />
          ) : (
            <CheckCircle size={14} style={{ color: "#2E7D32" }} />
          )}
          <span style={{ fontSize: 13, fontWeight: 600, color: pendentes.length > 0 ? "#B8860B" : "#2E7D32" }}>
            {pendentes.length} pendente{pendentes.length !== 1 ? "s" : ""}
          </span>
        </div>
        <label className="flex items-center gap-2" style={{ fontSize: 13, color: "#374151" }}>
          <Calendar size={14} style={{ color: "#9CA3AF" }} />
          Data de referência:
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
          />
        </label>
      </div>

      {loading && <p style={{ fontSize: 13, color: "#6B7280" }}>Carregando...</p>}
      {error && <p style={{ fontSize: 13, color: "#DC2626" }}>{error}</p>}

      {!loading && !error && pendentes.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16">
          <CheckCircle size={40} color="#2E7D32" />
          <p style={{ fontWeight: 600, color: "#1B1D40" }}>Tudo preenchido nesta data!</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendentes.map((h) => (
          <div key={h.cnpj} className="rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
            <div className="relative h-40 overflow-hidden">
              <HotelImage src={h.foto_url} alt={h.nome_fantasia} className="w-full h-full object-cover" />
              <div
                className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: "#FFF3CD", color: "#B8860B", border: "1px solid #F5C100" }}
              >
                <Clock size={10} /> Pendente
              </div>
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: "#1B1D40CC", color: "white" }}>
                {h.categoria}
              </div>
            </div>
            <div className="p-4">
              <Stars count={h.estrelas} />
              <h3 className="mt-1" style={{ fontWeight: 700, fontSize: 15, color: "#1B1D40", lineHeight: 1.3 }}>
                {h.nome_fantasia}
              </h3>
              <button
                onClick={() => setFill(h)}
                className="w-full mt-4 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
              >
                Preencher dados
              </button>
            </div>
          </div>
        ))}
      </div>

      {fill && (
        <FillDiariaModal
          cnpj={fill.cnpj}
          nome={fill.nome_fantasia}
          defaultDate={data}
          urlBooking={fill.url_booking}
          onClose={() => setFill(null)}
          onSaved={carregar}
        />
      )}
    </div>
  );
}
