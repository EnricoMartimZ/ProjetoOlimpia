import { useState } from "react";
import { X } from "lucide-react";
import { createHospedagem } from "../../../../services/api";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIAS = ["Hotel", "Pousada", "Resort", "Airbnb", "Hostel"];

// Máscara de CNPJ: 00.000.000/0001-00 (só formato — não valida dígitos verificadores).
const CNPJ_REGEX = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

/** Formata os dígitos digitados na máscara XX.XXX.XXX/XXXX-XX, conforme o usuário digita. */
function maskCnpj(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length > 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  if (d.length > 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  if (d.length > 5) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length > 2) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return d;
}

const inputStyle = { border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" } as const;
const labelStyle = { fontSize: 12, fontWeight: 600, color: "#374151" } as const;

/** Modal de cadastro de uma nova hospedagem. */
export function AddHospedagemModal({ onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    cnpj: "",
    nome_fantasia: "",
    local: "",
    categoria: "Hotel",
    estrelas: "0",
    quartos: "0",
    url_booking: "",
    foto_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!CNPJ_REGEX.test(form.cnpj.trim())) {
      setError("CNPJ inválido. Use o formato 00.000.000/0001-00.");
      return;
    }
    setSaving(true);
    try {
      await createHospedagem({
        cnpj: form.cnpj.trim(),
        nome_fantasia: form.nome_fantasia.trim(),
        local: form.local.trim(),
        categoria: form.categoria,
        estrelas: Number(form.estrelas),
        quartos: Number(form.quartos),
        url_booking: form.url_booking.trim() || null,
        foto_url: form.foto_url.trim() || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: "white" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: "#F5C100" }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1B1D40" }}>Nova hospedagem</h2>
          <button onClick={onClose} aria-label="Fechar">
            <X size={20} color="#1B1D40" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label style={labelStyle}>CNPJ *</label>
              <input
                required
                inputMode="numeric"
                maxLength={18}
                value={form.cnpj}
                onChange={(e) => set("cnpj", maskCnpj(e.target.value))}
                placeholder="00.000.000/0001-00"
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div className="col-span-2">
              <label style={labelStyle}>Nome fantasia *</label>
              <input
                required
                value={form.nome_fantasia}
                onChange={(e) => set("nome_fantasia", e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div className="col-span-2">
              <label style={labelStyle}>Local *</label>
              <input
                required
                value={form.local}
                onChange={(e) => set("local", e.target.value)}
                placeholder="Bairro, cidade/UF"
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select
                value={form.categoria}
                onChange={(e) => set("categoria", e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Estrelas (0–5)</label>
              <input
                type="number"
                min={0}
                max={5}
                value={form.estrelas}
                onChange={(e) => set("estrelas", e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Quartos/unidades</label>
              <input
                type="number"
                min={0}
                value={form.quartos}
                onChange={(e) => set("quartos", e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Link do Booking</label>
              <input
                value={form.url_booking}
                onChange={(e) => set("url_booking", e.target.value)}
                placeholder="https://booking.com/..."
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div className="col-span-2">
              <label style={labelStyle}>URL da foto</label>
              <input
                value={form.foto_url}
                onChange={(e) => set("foto_url", e.target.value)}
                placeholder="https://..."
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
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
              {saving ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
