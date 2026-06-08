import type { Hotel, Research, Edition, ResponseRow } from "../../types";

// ─── Hotels / Diária Média ────────────────────────────────────────────────────
export const hotels: Hotel[] = [
  {
    id: 1,
    name: "Grand Thermas Hotel & Resort",
    category: "Resort",
    stars: 5,
    status: "pendente",
    lastUpdate: "Sem registro",
    image: "https://images.unsplash.com/photo-1715191904112-4a5d9c3089fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    rooms: 280,
  },
  {
    id: 2,
    name: "Therma Park Hotel",
    category: "Hotel",
    stars: 4,
    status: "preenchido",
    lastUpdate: "08/05/2026",
    image: "https://images.unsplash.com/photo-1658211342682-de25dd8b3e74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    rooms: 142,
  },
  {
    id: 3,
    name: "Pousada Vida Natural",
    category: "Pousada",
    stars: 3,
    status: "pendente",
    lastUpdate: "02/05/2026",
    image: "https://images.unsplash.com/photo-1648636548177-b2173621b28a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    rooms: 28,
  },
  {
    id: 4,
    name: "Serra Dourada Hotel",
    category: "Hotel",
    stars: 4,
    status: "pendente",
    lastUpdate: "29/04/2026",
    image: "https://images.unsplash.com/photo-1771918522305-9d78f9cf9751?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    rooms: 96,
  },
  {
    id: 5,
    name: "Acqua Fun Resort",
    category: "Resort",
    stars: 5,
    status: "preenchido",
    lastUpdate: "09/05/2026",
    image: "https://images.unsplash.com/photo-1713473843215-1b95a775230e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    rooms: 320,
  },
  {
    id: 6,
    name: "Recanto das Fontes",
    category: "Pousada",
    stars: 3,
    status: "pendente",
    lastUpdate: "Sem registro",
    image: "https://images.unsplash.com/photo-1679586493827-7f7c3ad09a63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    rooms: 18,
  },
];

// ─── Charts / Dashboard ───────────────────────────────────────────────────────
export const monthlyData = [
  { mes: "Jan", turistas: 12400, respostas: 856, ocupacao: 72 },
  { mes: "Fev", turistas: 15800, respostas: 1140, ocupacao: 81 },
  { mes: "Mar", turistas: 18900, respostas: 1380, ocupacao: 88 },
  { mes: "Abr", turistas: 16200, respostas: 1170, ocupacao: 79 },
  { mes: "Mai", turistas: 14500, respostas: 1020, ocupacao: 75 },
];

export const originData = [
  { name: "São Paulo capital", value: 38.2, color: "#F5C944" },
  { name: "Ribeirão Preto", value: 22.4, color: "#1565C0" },
  { name: "Outros SP", value: 19.6, color: "#00796B" },
  { name: "Minas Gerais", value: 12.3, color: "#C8102E" },
  { name: "Outros", value: 7.5, color: "#7B1C1C" },
];

export const occupancyByType = [
  { tipo: "Resort", ocupacao: 87, receita: 485 },
  { tipo: "Hotel", ocupacao: 72, receita: 310 },
  { tipo: "Pousada", ocupacao: 65, receita: 185 },
  { tipo: "Chalé", ocupacao: 58, receita: 145 },
  { tipo: "Airbnb", ocupacao: 71, receita: 220 },
];

export const kpiData = [
  { label: "Turistas Atendidos", value: "77.800", change: "+12,4%", positive: true },
  { label: "Respostas Coletadas", value: "5.566", change: "+8,7%", positive: true },
  { label: "Pesquisas Ativas", value: "4", change: "0", positive: true },
  { label: "Taxa de Ocupação Média", value: "76,6%", change: "+3,2%", positive: true },
];

// ─── Research / Surveys ───────────────────────────────────────────────────────
export const researches: Research[] = [
  {
    id: 1,
    nome: "Demanda Turística",
    descricao: "Pesquisa de perfil do turista que visita Olímpia",
    tipo: "campo",
    edicoes: 3,
    status: "ativa",
    publicLink: "/pesquisa/demanda-turistica",
    campos: [
      { id: 1, tipo: "texto", label: "Cidade de origem", required: true },
      { id: 2, tipo: "multipla_escolha", label: "Motivo da visita", required: true, opcoes: ["Lazer", "Negócios", "Saúde", "Eventos", "Outros"] },
      { id: 3, tipo: "numero", label: "Quantas vezes já visitou Olímpia?", required: true },
      { id: 4, tipo: "numero", label: "Quantos dias pretende ficar?", required: true },
      { id: 5, tipo: "multipla_escolha", label: "Tipo de hospedagem", required: true, opcoes: ["Resort", "Hotel", "Pousada", "Casa de parentes", "Airbnb", "Outros"] },
      { id: 6, tipo: "multipla_escolha", label: "Faixa etária", required: true, opcoes: ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"] },
      { id: 7, tipo: "escala", label: "Como avalia sua experiência em Olímpia?", required: true },
    ],
  },
  {
    id: 2,
    nome: "Percepção do Turismo",
    descricao: "Pesquisa com moradores sobre a percepção do turismo na cidade",
    tipo: "publica",
    edicoes: 2,
    status: "ativa",
    publicLink: "/pesquisa/percepcao-turismo",
    campos: [
      { id: 1, tipo: "sim_nao", label: "Você é morador de Olímpia há mais de 1 ano?", required: true },
      { id: 2, tipo: "multipla_escolha", label: "O turismo beneficia a cidade?", required: true, opcoes: ["Sim, muito", "Sim, um pouco", "Não sei", "Não", "Muito negativamente"] },
      { id: 3, tipo: "escala", label: "Como avalia o impacto do turismo na sua qualidade de vida?", required: true },
      { id: 4, tipo: "texto_longo", label: "Principais benefícios percebidos com o turismo:", required: false },
      { id: 5, tipo: "texto_longo", label: "Principais problemas trazidos pelo turismo:", required: false },
    ],
  },
  {
    id: 3,
    nome: "Taxa de Ocupação",
    descricao: "Pesquisa com donos de meios de hospedagem",
    tipo: "publica",
    edicoes: 5,
    status: "encerrada",
    publicLink: "/pesquisa/taxa-ocupacao",
    campos: [
      { id: 1, tipo: "texto", label: "Nome do estabelecimento", required: true },
      { id: 2, tipo: "numero", label: "Total de quartos/unidades", required: true },
      { id: 3, tipo: "numero", label: "Quartos/unidades ocupadas no período", required: true },
      { id: 4, tipo: "numero", label: "Número de hóspedes no período", required: true },
      { id: 5, tipo: "numero", label: "Receita total bruta (R$)", required: true },
    ],
  },
  {
    id: 4,
    nome: "Fluxo de Turistas",
    descricao: "Registro de fluxo diário de turistas nos pontos de controle",
    tipo: "campo",
    edicoes: 7,
    status: "ativa",
    publicLink: "/pesquisa/fluxo-turistas",
    campos: [
      { id: 1, tipo: "data", label: "Data de referência", required: true },
      { id: 2, tipo: "numero", label: "Número de chegadas", required: true },
      { id: 3, tipo: "numero", label: "Número de saídas", required: true },
      { id: 4, tipo: "numero", label: "Período médio de permanência (dias)", required: true },
      { id: 5, tipo: "texto", label: "Principal origem dos turistas", required: false },
    ],
  },
];

// ─── Response table data ──────────────────────────────────────────────────────
export const responseTableData: ResponseRow[] = [
  { id: 1, pesquisaId: 1, edicaoId: 2, data: "09/05/2026", pesquisador: "Carlos M.", cidade: "São Paulo", motivo: "Lazer", visitas: 3, dias: 4, hospedagem: "Resort", faixa: "35-44", nota: 5 },
  { id: 2, pesquisaId: 1, edicaoId: 2, data: "09/05/2026", pesquisador: "Ana P.", cidade: "Ribeirão Preto", motivo: "Lazer", visitas: 1, dias: 3, hospedagem: "Hotel", faixa: "25-34", nota: 4 },
  { id: 3, pesquisaId: 1, edicaoId: 1, data: "08/05/2026", pesquisador: "Carlos M.", cidade: "Campinas", motivo: "Eventos", visitas: 2, dias: 2, hospedagem: "Pousada", faixa: "45-54", nota: 5 },
  { id: 4, pesquisaId: 1, edicaoId: 1, data: "08/05/2026", pesquisador: "Fernanda L.", cidade: "Belo Horizonte", motivo: "Lazer", visitas: 1, dias: 5, hospedagem: "Resort", faixa: "55-64", nota: 4 },
  { id: 5, pesquisaId: 2, edicaoId: 4, data: "07/05/2026", pesquisador: "Ana P.", cidade: "São Paulo", motivo: "Saúde", visitas: 4, dias: 7, hospedagem: "Hotel", faixa: "65+", nota: 5 },
  { id: 6, pesquisaId: 2, edicaoId: 4, data: "07/05/2026", pesquisador: "Carlos M.", cidade: "Santos", motivo: "Lazer", visitas: 2, dias: 3, hospedagem: "Airbnb", faixa: "18-24", nota: 3 },
  { id: 7, pesquisaId: 2, edicaoId: 3, data: "06/05/2026", pesquisador: "Fernanda L.", cidade: "Bauru", motivo: "Lazer", visitas: 1, dias: 4, hospedagem: "Resort", faixa: "35-44", nota: 5 },
  { id: 8, pesquisaId: 2, edicaoId: 3, data: "06/05/2026", pesquisador: "Ana P.", cidade: "Marília", motivo: "Negócios", visitas: 3, dias: 2, hospedagem: "Hotel", faixa: "25-34", nota: 4 },
];

export const editions: Edition[] = [
  { id: 1, pesquisaId: 1, nome: "1ª Edição 2026", inicio: "01/01/2026", fim: "31/03/2026", respostas: 856, status: "encerrada" },
  { id: 2, pesquisaId: 1, nome: "2ª Edição 2026", inicio: "01/04/2026", fim: "30/06/2026", respostas: 312, status: "ativa" },
  { id: 3, pesquisaId: 2, nome: "1ª Edição 2026", inicio: "01/02/2026", fim: "30/04/2026", respostas: 540, status: "encerrada" },
  { id: 4, pesquisaId: 2, nome: "2ª Edição 2026", inicio: "01/05/2026", fim: "31/07/2026", respostas: 128, status: "ativa" },
];
