import { useState } from "react";
import { Clock, Building2, ListChecks } from "lucide-react";
import { PendentesTab } from "./PendentesTab";
import { HospedagensTab } from "./HospedagensTab";
import { RegistrosTab } from "./RegistrosTab";

type Tab = "pendentes" | "hospedagens" | "registros";

const TABS: { id: Tab; label: string; icon: typeof Clock }[] = [
  { id: "pendentes", label: "Pendentes de hoje", icon: Clock },
  { id: "hospedagens", label: "Hospedagens", icon: Building2 },
  { id: "registros", label: "Registros", icon: ListChecks },
];

/** Interface dedicada da Diária Média (REQ 6) — preenchida pelo servidor. */
export function DiariaMediaPage() {
  const [tab, setTab] = useState<Tab>("pendentes");

  return (
    <div className="p-6" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="mb-6">
        <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1B1D40" }}>Diária Média</h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
          Cadastre hospedagens e insira os preços consultados no Booking
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-6 border-b" style={{ borderColor: "#F0EDE8" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all"
            style={{
              color: tab === id ? "#1B1D40" : "#6B7280",
              borderBottom: `2px solid ${tab === id ? "#F5C100" : "transparent"}`,
              marginBottom: -1,
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "pendentes" && <PendentesTab />}
      {tab === "hospedagens" && <HospedagensTab />}
      {tab === "registros" && <RegistrosTab />}
    </div>
  );
}
