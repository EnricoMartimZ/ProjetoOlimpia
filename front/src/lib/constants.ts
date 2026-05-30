import type { ComponentType } from "react";

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
import {
  List,
  Hash,
  AlignLeft,
  Calendar,
  ToggleLeft,
  Star,
  Type,
} from "lucide-react";
import type { FieldType } from "../types";

export interface FieldTypeOption {
  tipo: FieldType;
  label: string;
  icon: ComponentType<{ size?: number; color?: string }>;
}

export const FIELD_TYPES: FieldTypeOption[] = [
  { tipo: "texto", label: "Texto curto", icon: Type },
  { tipo: "texto_longo", label: "Texto longo", icon: AlignLeft },
  { tipo: "numero", label: "Número", icon: Hash },
  { tipo: "multipla_escolha", label: "Múltipla escolha", icon: List },
  { tipo: "data", label: "Data", icon: Calendar },
  { tipo: "escala", label: "Escala (1–5)", icon: Star },
  { tipo: "sim_nao", label: "Sim / Não", icon: ToggleLeft },
];

export const STRIPE_COLORS = [
  "#C8102E",
  "#F5C100",
  "#00538C",
  "#009688",
  "#2E7D32",
  "#7B1C1C",
] as const;

export const CHART_TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "none",
  boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
} as const;
