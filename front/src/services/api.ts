import type { FieldType } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeader(): HeadersInit {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Erro ${res.status}`);
  }

  // 204 No Content não tem body
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function login(email: string, senha: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });
}

// ---------------------------------------------------------------------------
// Usuários
// ---------------------------------------------------------------------------

export interface CadastroInput {
  nome: string;
  email: string;
  senha: string;
  role: "servidor" | "pesquisador_campo";
}

export async function cadastrar(dados: CadastroInput): Promise<void> {
  return request<void>("/usuarios", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

// ---------------------------------------------------------------------------
// Pesquisas
// ---------------------------------------------------------------------------

export interface CampoCreateInput {
  texto_pergunta: string;
  tipo: FieldType;
  opcoes: string[];
  obrigatorio: boolean;
  ordem: number;
}

/** Natureza da pesquisa: respondida pelo público ou coletada por pesquisador de campo. */
export type TipoPesquisa = "publica" | "campo";

export interface PesquisaCreateInput {
  nome: string;
  descricao: string;
  tipo: TipoPesquisa;
  campos: CampoCreateInput[];
}

export interface CampoAPI {
  id: number;
  hash_pergunta: string;
  texto_pergunta: string;
  tipo: FieldType;
  opcoes: string[];
  obrigatorio: boolean;
  ordem: number;
}

/** Pesquisa retornada na listagem (sem campos). */
export interface PesquisaListItem {
  id: number;
  nome: string;
  descricao: string | null;
  tipo: TipoPesquisa;
  status: "rascunho" | "ativa" | "encerrada";
  total_edicoes: number;
  /** ID da edição cujo link público compartilhar (ativa ou mais recente); null se rascunho. */
  edicao_atual_id: number | null;
}

/** Pesquisa retornada no detalhe (com campos). */
export interface PesquisaDetalhada extends PesquisaListItem {
  criado_em: string;
  campos: CampoAPI[];
}

export async function getPesquisas(): Promise<PesquisaListItem[]> {
  return request<PesquisaListItem[]>("/pesquisas");
}

export async function getPesquisa(id: number): Promise<PesquisaDetalhada> {
  return request<PesquisaDetalhada>(`/pesquisas/${id}`);
}

export async function createPesquisa(dados: PesquisaCreateInput): Promise<PesquisaDetalhada> {
  return request<PesquisaDetalhada>("/pesquisas", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export async function updatePesquisa(
  id: number,
  dados: Partial<PesquisaCreateInput>,
): Promise<PesquisaDetalhada> {
  return request<PesquisaDetalhada>(`/pesquisas/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

export async function deletePesquisa(id: number): Promise<void> {
  return request<void>(`/pesquisas/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Edições
// ---------------------------------------------------------------------------

export interface EdicaoCreateInput {
  data_abertura: string;            // ISO yyyy-mm-dd
  data_fechamento?: string | null;  // ISO yyyy-mm-dd
  campos_extras?: CampoCreateInput[];
}

export interface EdicaoAPI {
  id: number;
  pesquisa_id: number;
  pesquisa_nome: string;
  numero_edicao: number;
  data_abertura: string;
  data_fechamento: string | null;
  criado_em: string;
  total_respostas: number;
  status: "agendada" | "ativa" | "encerrada";
}

export async function getEdicoes(pesquisaId: number): Promise<EdicaoAPI[]> {
  return request<EdicaoAPI[]>(`/pesquisas/${pesquisaId}/edicoes`);
}

export async function launchEdicao(
  pesquisaId: number,
  dados: EdicaoCreateInput,
): Promise<EdicaoAPI> {
  return request<EdicaoAPI>(`/pesquisas/${pesquisaId}/edicoes`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

// ---------------------------------------------------------------------------
// Formulário público (sem autenticação)
// ---------------------------------------------------------------------------

export interface PublicEdicaoAPI {
  edicao_id: number;
  pesquisa_id: number;
  pesquisa_nome: string;
  descricao: string | null;
  numero_edicao: number;
  data_abertura: string;
  data_fechamento: string | null;
  aberta: boolean;
  campos: CampoAPI[];
}

export async function getPublicEdicao(edicaoId: number): Promise<PublicEdicaoAPI> {
  return request<PublicEdicaoAPI>(`/publico/edicoes/${edicaoId}`);
}

// ---------------------------------------------------------------------------
// Respostas
// ---------------------------------------------------------------------------

export interface ColetouItemInput {
  campo_id: number;
  atributo_texto: string;
}

export interface RespostaOutAPI {
  id: number;
  edicao_id: number;
  timestamp_envio: string;
  total_campos: number;
}

/**
 * Envia uma resposta a uma edição. Funciona sem autenticação (formulário público);
 * se houver token no localStorage, o helper `request` o anexa e o backend grava o usuario_id.
 */
export async function submitResposta(
  edicaoId: number,
  respostas: ColetouItemInput[],
): Promise<RespostaOutAPI> {
  return request<RespostaOutAPI>(`/edicoes/${edicaoId}/respostas`, {
    method: "POST",
    body: JSON.stringify({ respostas }),
  });
}

// --- Tabulação para o admin (ConsultarPage) ---

export interface CampoHeader {
  id: number;
  texto_pergunta: string;
  tipo: FieldType;
}

export interface RespostaLinha {
  resposta_id: number;
  timestamp_envio: string;
  usuario_id: number | null;
  usuario_nome: string | null; // nome de quem coletou (null se anônima/pública)
  valores: Record<string, string>; // chave = campo_id (string)
}

export interface RespostasTabela {
  total: number;
  pagina: number;
  por_pagina: number;
  campos_header: CampoHeader[];
  dados: RespostaLinha[];
}

export interface GetRespostasParams {
  pagina?: number;
  por_pagina?: number;
  busca?: string;
}

export async function getRespostas(
  edicaoId: number,
  params: GetRespostasParams = {},
): Promise<RespostasTabela> {
  const qs = new URLSearchParams();
  if (params.pagina) qs.set("pagina", String(params.pagina));
  if (params.por_pagina) qs.set("por_pagina", String(params.por_pagina));
  if (params.busca) qs.set("busca", params.busca);
  const suffix = qs.toString() ? `?${qs}` : "";
  return request<RespostasTabela>(`/edicoes/${edicaoId}/respostas${suffix}`);
}

export async function deleteResposta(edicaoId: number, respostaId: number): Promise<void> {
  return request<void>(`/edicoes/${edicaoId}/respostas/${respostaId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Pesquisador de campo (rotas autenticadas — role pesquisador_campo)
// ---------------------------------------------------------------------------

/**
 * Lista as edições abertas de pesquisas do tipo "campo" disponíveis para coleta.
 * Requer token de um usuário com role pesquisador_campo.
 */
export async function getEdicoesCampo(): Promise<EdicaoAPI[]> {
  return request<EdicaoAPI[]>("/pesquisador/edicoes");
}

// ---------------------------------------------------------------------------
// Diária Média — Hospedagens + registros de preço (rotas de servidor)
// ---------------------------------------------------------------------------

export interface HospedagemAPI {
  cnpj: string;
  nome_fantasia: string;
  local: string;
  categoria: string;
  estrelas: number;
  quartos: number;
  url_booking: string | null;
  foto_url: string | null;
  criado_em: string;
}

export interface HospedagemCreateInput {
  cnpj: string;
  nome_fantasia: string;
  local: string;
  categoria: string;
  estrelas: number;
  quartos: number;
  url_booking?: string | null;
  foto_url?: string | null;
}

/** Hospedagem que ainda não teve diária registrada na data de referência. */
export interface HospedagemPendenteAPI {
  cnpj: string;
  nome_fantasia: string;
  categoria: string;
  estrelas: number;
  foto_url: string | null;
  url_booking: string | null;
}

export interface DiariaAPI {
  id: number;
  hospedagem_cnpj: string;
  nome_fantasia: string;
  data: string; // ISO yyyy-mm-dd
  preco: number;
  registrado_em: string;
}

export interface DiariaCreateInput {
  hospedagem_cnpj: string;
  data: string; // ISO yyyy-mm-dd
  preco: number;
}

export async function getHospedagens(): Promise<HospedagemAPI[]> {
  return request<HospedagemAPI[]>("/hospedagens");
}

export async function createHospedagem(dados: HospedagemCreateInput): Promise<HospedagemAPI> {
  return request<HospedagemAPI>("/hospedagens", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export async function updateHospedagem(
  cnpj: string,
  dados: Partial<Omit<HospedagemCreateInput, "cnpj">>,
): Promise<HospedagemAPI> {
  // cnpj pode conter "/" (formato XX.XXX.XXX/0001-XX); a rota usa {cnpj:path}, então
  // mandamos o valor cru (sem encodeURIComponent, que viraria %2F e não casaria).
  return request<HospedagemAPI>(`/hospedagens/${cnpj}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

export async function deleteHospedagem(cnpj: string): Promise<void> {
  return request<void>(`/hospedagens/${cnpj}`, { method: "DELETE" });
}

export async function getPendentes(data?: string): Promise<HospedagemPendenteAPI[]> {
  const suffix = data ? `?data=${data}` : "";
  return request<HospedagemPendenteAPI[]>(`/diarias/pendentes${suffix}`);
}

export async function getDiarias(
  params: { hospedagem_cnpj?: string; data?: string } = {},
): Promise<DiariaAPI[]> {
  const qs = new URLSearchParams();
  if (params.hospedagem_cnpj) qs.set("hospedagem_cnpj", params.hospedagem_cnpj);
  if (params.data) qs.set("data", params.data);
  const suffix = qs.toString() ? `?${qs}` : "";
  return request<DiariaAPI[]>(`/diarias${suffix}`);
}

export async function createDiaria(dados: DiariaCreateInput): Promise<DiariaAPI> {
  return request<DiariaAPI>("/diarias", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export async function deleteDiaria(id: number): Promise<void> {
  return request<void>(`/diarias/${id}`, { method: "DELETE" });
}

/** Carrega o formulário de uma edição de campo (campos fixos + extras). */
export async function getEdicaoCampoForm(edicaoId: number): Promise<PublicEdicaoAPI> {
  return request<PublicEdicaoAPI>(`/pesquisador/edicoes/${edicaoId}`);
}

/**
 * Registra uma coleta de campo. A resposta é vinculada automaticamente ao
 * pesquisador autenticado (usuario_id) e à edição.
 */
export async function submitRespostaCampo(
  edicaoId: number,
  respostas: ColetouItemInput[],
): Promise<RespostaOutAPI> {
  return request<RespostaOutAPI>(`/pesquisador/edicoes/${edicaoId}/respostas`, {
    method: "POST",
    body: JSON.stringify({ respostas }),
  });
}
