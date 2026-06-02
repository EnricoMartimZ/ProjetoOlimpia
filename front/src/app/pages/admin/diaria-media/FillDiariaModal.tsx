import { useState } from "react";
import { X, CheckCircle, DollarSign } from "lucide-react";
import { createDiaria } from "../../../../services/api";

interface Props {
  cnpj: string;
  nome: string;
  /** Data inicial sugerida (ISO yyyy-mm-dd). */
  defaultDate?: string;
  /** Link do Booking da hospedagem (atalho de consulta). */
  urlBooking?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Modal para registrar a diária média (data + preço) de uma hospedagem. */
export function FillDiariaModal({ cnpj, nome, defaultDate, urlBooking, onClose, onSaved }: Props) {
  const [data, setData] = useState(defaultDate ?? new Date().toISOString().slice(0, 10));
  const [preco, setPreco] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createDiaria({ hospedagem_cnpj: cnpj, data, preco: Number(preco) });
      setSaved(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: "white" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: "#F5C100" }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1B1D40" }}>Registrar Diária Média</h2>
            <p style={{ fontSize: 12, color: "#5A5A2A" }}>{nome}</p>
          </div>
          <button onClick={onClose} aria-label="Fechar">
            <X size={20} color="#1B1D40" />
          </button>
        </div>

        {saved ? (
          <div className="p-8 flex flex-col items-center gap-3">
            <CheckCircle size={48} color="#2E7D32" />
            <p style={{ fontWeight: 700, fontSize: 16, color: "#1B1D40" }}>Registro salvo!</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-4">
            {urlBooking && (
              <a
                href={urlBooking}
                target="_blank"
                rel="noreferrer"
                className="block text-sm underline"
                style={{ color: "#1B1D40" }}
              >
                Abrir página no Booking ↗
              </a>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Data de referência *</label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Diária (R$) *</label>
              <div className="relative mt-1">
                <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                />
              </div>
            </div>

            {error && <p style={{ fontSize: 12, color: "#DC2626" }}>{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: "1px solid #E5E7EB", color: "#374151" }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
