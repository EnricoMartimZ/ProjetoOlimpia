export interface Relatorio {
  id: string;
  titulo: string;
  descricao: string;
  periodo: string;
  tipo: string;
  arquivo?: string;
  publicadoPorPadrao?: boolean;
}

const TODOS: Relatorio[] = [
  {
    id: "perfil-demanda-2025",
    titulo: "Perfil da Demanda Turística 2025",
    descricao: "Análise do perfil dos visitantes que chegaram a Olímpia ao longo de 2025, incluindo origem, motivo da visita e avaliação da experiência.",
    periodo: "2025",
    tipo: "Demanda Turística",
    arquivo: "12_relatorio_perfil_da_demanda_2025_24030042.pdf",
    publicadoPorPadrao: true,
  },
  {
    id: "expectativa-carnaval-2026",
    titulo: "Boletim de Expectativa — Carnaval 2026",
    descricao: "Projeção de fluxo de turistas, taxa de ocupação e diária média para o período do Carnaval 2026 em Olímpia.",
    periodo: "Carnaval 2026",
    tipo: "Taxa de Ocupação",
    arquivo: "boletim_expectativa_carnaval_2026_19114714.pdf",
    publicadoPorPadrao: true,
  },
  {
    id: "to-consolidada-jan-2026",
    titulo: "Taxa de Ocupação Consolidada — Janeiro 2026",
    descricao: "Boletim com a taxa de ocupação consolidada dos meios de hospedagem cadastrados em Olímpia no mês de janeiro de 2026.",
    periodo: "Jan 2026",
    tipo: "Taxa de Ocupação",
    arquivo: "boletim_to_consolidada_janeiro_2026_09073659.pdf",
    publicadoPorPadrao: true,
  },
  {
    id: "percepcao-destino-expo-sp",
    titulo: "Percepção do Destino Olímpia — 1ª Expo Turismo SP",
    descricao: "Relatório de percepção do destino Olímpia coletado durante a 1ª Expo Turismo SP, com avaliação dos atributos da cidade pelos visitantes.",
    periodo: "2025",
    tipo: "Percepção do Destino",
    arquivo: "relatOrio_percepCAo_destino_olimpia_-_1_expo_turismo_sp_202_28082644.pdf",
    publicadoPorPadrao: true,
  },
];

const STORAGE_KEY = "olimpia_relatorios_publicados";

export function getRelatoriosPublicados(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function setRelatoriosPublicados(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function getRelatoriosDisponiveis(): Relatorio[] {
  return TODOS;
}
