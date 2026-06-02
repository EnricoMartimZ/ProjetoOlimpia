import { useEffect, useState } from "react";
import { Plus, Trash2, MapPin, BedDouble, ExternalLink } from "lucide-react";
import { getHospedagens, deleteHospedagem, type HospedagemAPI } from "../../../../services/api";
import { HotelImage, Stars } from "./HotelImage";
import { AddHospedagemModal } from "./AddHospedagemModal";
import { FillDiariaModal } from "./FillDiariaModal";

/** Aba: cadastrar / remover hospedagens e registrar a diária de cada uma. */
export function HospedagensTab() {
  const [hospedagens, setHospedagens] = useState<HospedagemAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [fill, setFill] = useState<HospedagemAPI | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      setHospedagens(await getHospedagens());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const remover = async (h: HospedagemAPI) => {
    if (!confirm(`Remover "${h.nome_fantasia}"? Todos os registros de diária dela também serão apagados.`)) return;
    try {
      await deleteHospedagem(h.cnpj);
      carregar();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao remover.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p style={{ fontSize: 13, color: "#6B7280" }}>
          {hospedagens.length} hospedagem{hospedagens.length !== 1 ? "ns" : ""} cadastrada{hospedagens.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "#1B1D40", color: "white" }}
        >
          <Plus size={16} /> Nova hospedagem
        </button>
      </div>

      {loading && <p style={{ fontSize: 13, color: "#6B7280" }}>Carregando...</p>}
      {error && <p style={{ fontSize: 13, color: "#DC2626" }}>{error}</p>}

      {!loading && !error && hospedagens.length === 0 && (
        <p className="py-16 text-center" style={{ fontSize: 14, color: "#6B7280" }}>
          Nenhuma hospedagem cadastrada. Comece adicionando uma.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {hospedagens.map((h) => (
          <div key={h.cnpj} className="rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
            <div className="relative h-40 overflow-hidden">
              <HotelImage src={h.foto_url} alt={h.nome_fantasia} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: "#1B1D40CC", color: "white" }}>
                {h.categoria}
              </div>
              <button
                onClick={() => remover(h)}
                className="absolute top-3 right-3 p-1.5 rounded-full"
                style={{ backgroundColor: "#FEE2E2" }}
                aria-label="Remover"
              >
                <Trash2 size={14} color="#DC2626" />
              </button>
            </div>
            <div className="p-4">
              <Stars count={h.estrelas} />
              <h3 className="mt-1" style={{ fontWeight: 700, fontSize: 15, color: "#1B1D40", lineHeight: 1.3 }}>
                {h.nome_fantasia}
              </h3>
              <div className="flex items-center gap-1 mt-1.5" style={{ fontSize: 12, color: "#6B7280" }}>
                <MapPin size={12} style={{ color: "#9CA3AF" }} /> {h.local}
              </div>
              <div className="flex items-center gap-1 mt-1" style={{ fontSize: 12, color: "#6B7280" }}>
                <BedDouble size={12} style={{ color: "#9CA3AF" }} /> {h.quartos} quartos/unidades
              </div>
              <p className="mt-1" style={{ fontSize: 11, color: "#9CA3AF" }}>CNPJ: {h.cnpj}</p>
              {h.url_booking && (
                <a
                  href={h.url_booking}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 mt-1"
                  style={{ fontSize: 12, color: "#1B1D40" }}
                >
                  <ExternalLink size={12} /> Booking
                </a>
              )}
              <button
                onClick={() => setFill(h)}
                className="w-full mt-3 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
              >
                Registrar diária
              </button>
            </div>
          </div>
        ))}
      </div>

      {adding && <AddHospedagemModal onClose={() => setAdding(false)} onSaved={carregar} />}
      {fill && (
        <FillDiariaModal
          cnpj={fill.cnpj}
          nome={fill.nome_fantasia}
          urlBooking={fill.url_booking}
          onClose={() => setFill(null)}
          onSaved={() => { /* registro feito; nada a recarregar nesta aba */ }}
        />
      )}
    </div>
  );
}
