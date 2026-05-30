import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { FIELD_TYPES } from "../../lib/constants";
import type { FieldType } from "../../types";

interface FieldTypePickerProps {
  onSelect: (tipo: FieldType) => void;
}

export function FieldTypePicker({ onSelect }: FieldTypePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (tipo: FieldType) => {
    onSelect(tipo);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
        style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
      >
        <Plus size={13} />
        Adicionar campo
        <ChevronDown size={12} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-52 rounded-xl shadow-lg py-1 z-50"
          style={{ backgroundColor: "white", border: "1px solid #E5E7EB" }}
        >
          {FIELD_TYPES.map((ft) => {
            const Icon = ft.icon;
            return (
              <button
                key={ft.tipo}
                onClick={() => handleSelect(ft.tipo)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-yellow-50"
                style={{ color: "#374151" }}
              >
                <Icon size={14} color="#F5C100" />
                {ft.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
