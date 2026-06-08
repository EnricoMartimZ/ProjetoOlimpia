import type { Field } from "../../types";

interface SurveyFieldInputProps {
  field: Field;
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  variant?: "researcher" | "public";
  autoFocus?: boolean;
}

const INPUT_STYLE = {
  border: "2px solid #E5E7EB",
  backgroundColor: "#F9F9F9",
  color: "#1D2E36",
};

export function SurveyFieldInput({
  field,
  value,
  onChange,
  variant = "public",
  autoFocus,
}: SurveyFieldInputProps) {
  if (field.tipo === "texto") {
    return (
      <input
        type="text"
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={variant === "public" ? "Sua resposta..." : "Digite aqui..."}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={INPUT_STYLE}
        autoFocus={autoFocus}
      />
    );
  }

  if (field.tipo === "texto_longo") {
    return (
      <textarea
        rows={4}
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Sua resposta..."
        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
        style={INPUT_STYLE}
        autoFocus={autoFocus}
      />
    );
  }

  if (field.tipo === "numero") {
    return (
      <input
        type="number"
        min={0}
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={INPUT_STYLE}
        autoFocus={autoFocus}
      />
    );
  }

  if (field.tipo === "multipla_escolha") {
    if (variant === "researcher") {
      return (
        <div className="grid grid-cols-2 gap-2">
          {(field.opcoes || []).map((op, i) => (
            <button
              key={i}
              onClick={() => onChange(op)}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all"
              style={{
                backgroundColor: value === op ? "#1D2E36" : "#F9F9F9",
                color: value === op ? "white" : "#374151",
                border: `2px solid ${value === op ? "#1D2E36" : "#E5E7EB"}`,
              }}
            >
              {op}
            </button>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {(field.opcoes || []).map((op, i) => (
          <button
            key={i}
            onClick={() => onChange(op)}
            className="w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-left transition-all flex items-center gap-3"
            style={{
              backgroundColor: value === op ? "#F5C944" : "#F9F9F9",
              color: value === op ? "#1D2E36" : "#374151",
              border: `2px solid ${value === op ? "#F5C944" : "#E5E7EB"}`,
            }}
          >
            <span
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{
                borderColor: value === op ? "#1D2E36" : "#D1D5DB",
                backgroundColor: value === op ? "#1D2E36" : "transparent",
              }}
            >
              {value === op && <span className="w-2 h-2 rounded-full bg-white" />}
            </span>
            {op}
          </button>
        ))}
      </div>
    );
  }

  if (field.tipo === "escala") {
    return (
      <div>
        {variant === "public" && (
          <div className="flex justify-between text-xs mb-2" style={{ color: "#9CA3AF" }}>
            <span>Muito ruim</span>
            <span>Excelente</span>
          </div>
        )}
        <div className={`flex ${variant === "researcher" ? "gap-3" : "gap-2"}`}>
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => onChange(v)}
              className="flex-1 py-4 rounded-xl font-bold text-lg transition-all"
              style={{
                backgroundColor: value === v ? "#F5C944" : "#F9F9F9",
                color: value === v ? "#1D2E36" : "#374151",
                border: `2px solid ${value === v ? "#F5C944" : "#E5E7EB"}`,
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (field.tipo === "sim_nao") {
    return (
      <div className="flex gap-3">
        {["Sim", "Não"].map((op) => (
          <button
            key={op}
            onClick={() => onChange(op)}
            className="flex-1 py-4 rounded-xl font-bold text-base transition-all"
            style={{
              backgroundColor:
                value === op ? (op === "Sim" ? "#2E7D32" : "#C8102E") : "#F9F9F9",
              color: value === op ? "white" : "#374151",
              border: `2px solid ${
                value === op
                  ? op === "Sim"
                    ? "#2E7D32"
                    : "#C8102E"
                  : "#E5E7EB"
              }`,
            }}
          >
            {op}
          </button>
        ))}
      </div>
    );
  }

  if (field.tipo === "data") {
    return (
      <input
        type="date"
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={INPUT_STYLE}
      />
    );
  }

  return null;
}
