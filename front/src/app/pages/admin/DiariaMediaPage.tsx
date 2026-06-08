import { useState } from "react";
import { Star, CheckCircle, Clock, X, Calendar, DollarSign, ImageOff } from "lucide-react";
import { hotels } from "../../data/mockData";

function HotelImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className={`bg-gray-100 flex flex-col items-center justify-center gap-2 ${className ?? ""}`}>
        <ImageOff size={28} color="#D1D5DB" />
        <span style={{ fontSize: 11, color: "#D1D5DB" }}>Imagem indisponível</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
}

interface HotelData {
  data: string;
  valorFDS: string;
  valorSemana: string;
  fonteBooking: string;
  obs: string;
}

export function DiariaMediaPage() {
  const [hotelList, setHotelList] = useState(hotels);
  const [selectedHotel, setSelectedHotel] = useState<typeof hotels[0] | null>(null);
  const [formData, setFormData] = useState<HotelData>({
    data: "",
    valorFDS: "",
    valorSemana: "",
    fonteBooking: "",
    obs: "",
  });
  const [saved, setSaved] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"todos" | "pendente" | "preenchido">("todos");

  const filtered = hotelList.filter((h) =>
    filterStatus === "todos" ? true : h.status === filterStatus
  );

  const pendingCount = hotelList.filter((h) => h.status === "pendente").length;

  const openFill = (hotel: typeof hotels[0]) => {
    setSelectedHotel(hotel);
    setFormData({ data: "", valorFDS: "", valorSemana: "", fonteBooking: "", obs: "" });
    setSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setHotelList((prev) =>
      prev.map((h) =>
        h.id === selectedHotel?.id
          ? { ...h, status: "preenchido", lastUpdate: new Date().toLocaleDateString("pt-BR") }
          : h
      )
    );
    setTimeout(() => setSelectedHotel(null), 1200);
  };

  return (
    <div className="p-6" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1D2E36" }}>Diária Média</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
            Insira os dados coletados do Booking para cada meio de hospedagem
          </p>
        </div>
        <div
          className="px-4 py-2 rounded-xl flex items-center gap-2"
          style={{ backgroundColor: pendingCount > 0 ? "#FFF3CD" : "#E8F5E9", border: `1px solid ${pendingCount > 0 ? "#F5C944" : "#A5D6A7"}` }}
        >
          <Clock size={14} style={{ color: pendingCount > 0 ? "#B8860B" : "#2E7D32" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: pendingCount > 0 ? "#B8860B" : "#2E7D32" }}>
            {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["todos", "pendente", "preenchido"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all"
            style={{
              backgroundColor: filterStatus === f ? "#F5C944" : "white",
              color: filterStatus === f ? "#1D2E36" : "#6B7280",
              border: `1px solid ${filterStatus === f ? "#F5C944" : "#E5E7EB"}`,
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((hotel) => (
          <div
            key={hotel.id}
            className="rounded-xl overflow-hidden shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
          >
            {/* Image */}
            <div className="relative h-44 overflow-hidden">
              <HotelImage
                src={hotel.image}
                alt={hotel.name}
                className="w-full h-full object-cover"
              />
              {/* Status badge */}
              <div
                className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: hotel.status === "pendente" ? "#FFF3CD" : "#E8F5E9",
                  color: hotel.status === "pendente" ? "#B8860B" : "#2E7D32",
                  border: `1px solid ${hotel.status === "pendente" ? "#F5C944" : "#A5D6A7"}`,
                }}
              >
                {hotel.status === "pendente" ? (
                  <Clock size={10} />
                ) : (
                  <CheckCircle size={10} />
                )}
                {hotel.status === "pendente" ? "Pendente" : "Preenchido"}
              </div>
              {/* Category badge */}
              <div
                className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: "#1D2E36CC", color: "white" }}
              >
                {hotel.category}
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              {/* Stars */}
              <div className="flex gap-0.5 mb-1">
                {Array.from({ length: hotel.stars }).map((_, i) => (
                  <Star key={i} size={11} fill="#F5C944" color="#F5C944" />
                ))}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1D2E36", lineHeight: 1.3 }}>
                {hotel.name}
              </h3>
              <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                {hotel.rooms} quartos/unidades
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Calendar size={11} style={{ color: "#9CA3AF" }} />
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                  Última atualização: {hotel.lastUpdate}
                </p>
              </div>
              <button
                onClick={() => openFill(hotel)}
                className="w-full mt-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: hotel.status === "pendente" ? "#F5C944" : "#E8F5E9",
                  color: hotel.status === "pendente" ? "#1D2E36" : "#2E7D32",
                }}
              >
                {hotel.status === "pendente" ? "Preencher dados" : "Editar dados"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedHotel && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div
            className="w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: "white" }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ backgroundColor: "#F5C944" }}
            >
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1D2E36" }}>
                  Preencher Diária Média
                </h2>
                <p style={{ fontSize: 12, color: "#5A5A2A" }}>{selectedHotel.name}</p>
              </div>
              <button onClick={() => setSelectedHotel(null)}>
                <X size={20} color="#1D2E36" />
              </button>
            </div>

            {/* Modal form */}
            {saved ? (
              <div className="p-8 flex flex-col items-center gap-3">
                <CheckCircle size={48} color="#2E7D32" />
                <p style={{ fontWeight: 700, fontSize: 16, color: "#1D2E36" }}>Dados salvos!</p>
                <p style={{ fontSize: 13, color: "#6B7280" }}>Registro atualizado com sucesso.</p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Data de referência *</label>
                    <input
                      type="date"
                      required
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Fonte Booking</label>
                    <input
                      type="text"
                      value={formData.fonteBooking}
                      onChange={(e) => setFormData({ ...formData, fonteBooking: e.target.value })}
                      placeholder="URL ou código"
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Diária fim de semana (R$) *</label>
                    <div className="relative mt-1">
                      <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        required
                        min={0}
                        step="0.01"
                        value={formData.valorFDS}
                        onChange={(e) => setFormData({ ...formData, valorFDS: e.target.value })}
                        placeholder="0,00"
                        className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Diária dia de semana (R$) *</label>
                    <div className="relative mt-1">
                      <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        required
                        min={0}
                        step="0.01"
                        value={formData.valorSemana}
                        onChange={(e) => setFormData({ ...formData, valorSemana: e.target.value })}
                        placeholder="0,00"
                        className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Observações</label>
                  <textarea
                    rows={3}
                    value={formData.obs}
                    onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                    placeholder="Informações adicionais..."
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedHotel(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ border: "1px solid #E5E7EB", color: "#374151" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ backgroundColor: "#F5C944", color: "#1D2E36" }}
                  >
                    Salvar dados
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}