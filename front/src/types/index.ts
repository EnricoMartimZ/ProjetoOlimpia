export type FieldType =
  | "texto"
  | "texto_longo"
  | "numero"
  | "multipla_escolha"
  | "data"
  | "escala"
  | "sim_nao";

export interface Field {
  id: number;
  tipo: FieldType;
  label: string;
  required: boolean;
  opcoes?: string[];
}

export type TipoPesquisa = "publica" | "campo";

export interface Research {
  id: number;
  nome: string;
  descricao: string;
  tipo: TipoPesquisa;
  status: string;
  edicoes: number;
  publicLink?: string;
  campos: Field[];
}

export interface Hotel {
  id: number;
  name: string;
  category: string;
  stars: number;
  status: string;
  lastUpdate: string;
  image: string;
  rooms: number;
}

export interface Edition {
  id: number;
  pesquisaId: number;
  nome: string;
  inicio: string;
  fim: string;
  respostas: number;
  status: string;
}

export interface ResponseRow {
  id: number;
  pesquisaId?: number;
  edicaoId?: number;
  data: string;
  pesquisador: string;
  cidade: string;
  motivo: string;
  visitas: number;
  dias: number;
  hospedagem: string;
  faixa: string;
  nota: number;
}
