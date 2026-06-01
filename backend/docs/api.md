# API — Referência atual

Referência das rotas **implementadas** da API do Projeto Olímpia, fiel ao código.
Documentação interativa (Swagger) sobe junto com a app em `http://localhost:8000/docs`.

## Convenções

- Base URL local: `http://localhost:8000`
- Corpo das requisições/respostas em **JSON**.
- Autenticação: **JWT Bearer**. Faça `POST /auth/login`, pegue `access_token` e envie no header
  `Authorization: Bearer <token>`.

### Níveis de acesso

| Nível | Como é aplicado | Comportamento |
|---|---|---|
| Público | _(nenhuma dependência)_ | qualquer um acessa |
| Auth opcional | `get_optional_user` | aceita token se houver (grava `usuario_id`), nunca exige |
| `servidor` | `require_servidor` | 401 sem token · 403 se role ≠ servidor |
| `pesquisador_campo` | `require_pesquisador` | 401 sem token · 403 se role ≠ pesquisador_campo |

### Tipos compartilhados

`FieldType` (tipo de um campo): `texto`, `texto_longo`, `numero`, `multipla_escolha`, `data`, `escala`, `sim_nao`.

`TipoPesquisa`: `publica` | `campo` (default `publica`).

Status de **edição**: `agendada` (ainda não abriu) · `ativa` (aceitando respostas) · `encerrada` (fechada).
Status de **pesquisa** (derivado): `rascunho` (sem edições) · `ativa` · `encerrada`.

**Campo** (saída — `CampoOut`):
```json
{ "id": 1, "hash_pergunta": "…", "texto_pergunta": "Cidade de origem",
  "tipo": "texto", "opcoes": [], "obrigatorio": true, "ordem": 0 }
```
**Campo** (entrada — `CampoCreate`): `{ "texto_pergunta", "tipo", "opcoes": [], "obrigatorio": false, "ordem": 0 }`.

---

## 1. Autenticação

### `POST /auth/login` · Público
Request:
```json
{ "email": "admin@olimpia.sp.gov.br", "senha": "string" }
```
Response `200`:
```json
{ "access_token": "<jwt>", "token_type": "bearer" }
```
O JWT carrega `sub` (id), `nome`, `role`, `exp`. Erros: `401` credenciais inválidas.

---

## 2. Usuários

### `POST /usuarios` · Público
Request:
```json
{ "nome": "Ana", "email": "ana@x.com", "senha": "string", "role": "pesquisador_campo" }
```
`role` ∈ {`servidor`, `pesquisador_campo`}. Response `201` (`UsuarioOut`):
```json
{ "id": 1, "nome": "Ana", "email": "ana@x.com", "role": "pesquisador_campo", "criado_em": "…" }
```
Erros: `409` e-mail já cadastrado.

---

## 3. Pesquisas

### `GET /pesquisas` · Público
Response `200` — lista resumida (`PesquisaListOut`):
```json
[ { "id": 1, "nome": "Demanda Turística", "descricao": "…", "tipo": "campo",
    "status": "ativa", "total_edicoes": 3, "edicao_atual_id": 7 } ]
```
`edicao_atual_id`: edição cujo link compartilhar (ativa, ou a mais recente); `null` se rascunho.

### `POST /pesquisas` · `servidor`
Request (`PesquisaCreate`):
```json
{
  "nome": "Demanda Turística",
  "descricao": "Perfil do turista",
  "tipo": "campo",
  "campos": [
    { "texto_pergunta": "Cidade de origem", "tipo": "texto", "obrigatorio": true, "ordem": 0 },
    { "texto_pergunta": "Motivo", "tipo": "multipla_escolha", "opcoes": ["Lazer","Negócios"], "ordem": 1 }
  ]
}
```
`tipo` é opcional (default `publica`). Response `201` (`PesquisaOut`):
```json
{ "id": 1, "nome": "…", "descricao": "…", "tipo": "campo", "criado_em": "…",
  "status": "rascunho", "total_edicoes": 0, "edicao_atual_id": null, "campos": [ /* CampoOut */ ] }
```
Erros: `403` não-servidor · `409` nome duplicado.

### `GET /pesquisas/{id}` · Público
Response `200` (`PesquisaOut`, com `campos`). Erros: `404`.

### `PUT /pesquisas/{id}` · `servidor`
Request (`PesquisaUpdate`, todos opcionais): `{ "nome?", "descricao?", "tipo?", "campos?" }`.
Se `campos` vier, **substitui** todos os campos base. Response `200` (`PesquisaOut`).
Erros: `403` · `404` · `409` nome duplicado.

### `DELETE /pesquisas/{id}` · `servidor`
Remove em cascata (campos, edições, respostas). Response `204`. Erros: `403` · `404`.

---

## 4. Edições

### `GET /pesquisas/{id}/edicoes` · Público
Response `200` — lista de `EdicaoOut`:
```json
[ { "id": 7, "pesquisa_id": 1, "pesquisa_nome": "Demanda Turística", "numero_edicao": 3,
    "data_abertura": "2026-06-01", "data_fechamento": null, "criado_em": "…",
    "total_respostas": 42, "status": "ativa" } ]
```
Erros: `404` pesquisa não encontrada.

### `POST /pesquisas/{id}/edicoes` · `servidor`
Auto-incrementa `numero_edicao`. Request (`EdicaoCreate`):
```json
{ "data_abertura": "2026-06-01", "data_fechamento": null, "campos_extras": [ /* CampoCreate */ ] }
```
Response `201` (`EdicaoOut`). Erros: `403` · `404` · `422` `data_fechamento` < `data_abertura`.

### `GET /edicoes/{id}/campos` · Público
Campos fixos da pesquisa + extras da edição (ordenados). Response `200`: `[CampoOut]`. Erros: `404`.

---

## 5. Público (formulário aberto)

### `GET /publico/edicoes/{id}` · Público
Formulário para o link `/pesquisa/{edicaoId}`. Response `200` (`PublicEdicaoOut`):
```json
{ "edicao_id": 7, "pesquisa_id": 1, "pesquisa_nome": "…", "descricao": "…",
  "numero_edicao": 3, "data_abertura": "…", "data_fechamento": null,
  "aberta": true, "campos": [ /* CampoOut */ ] }
```
Erros: `404` — inclui o caso de a edição pertencer a uma pesquisa **`tipo=campo`** (o formulário de campo não é exposto publicamente).

---

## 6. Respostas

### `POST /edicoes/{id}/respostas` · Auth opcional
Envio público. Se houver token válido, grava `usuario_id`. Request (`RespostaCreate`):
```json
{ "respostas": [ { "campo_id": 1, "atributo_texto": "São Paulo" } ] }
```
Response `201` (`RespostaOut`):
```json
{ "id": 10, "edicao_id": 7, "timestamp_envio": "…", "total_campos": 1 }
```
Erros: `403` edição de pesquisa **`campo`** (use o fluxo do pesquisador) · `404` · `409` edição fechada ·
`422` campo não pertence à edição / duplicado / lista vazia.

### `GET /edicoes/{id}/respostas` · `servidor`
Tabulado e paginado. Query: `pagina` (≥1), `por_pagina` (1–500, default 20), `busca` (ILIKE no texto).
Response `200` (`RespostasTabela`):
```json
{
  "total": 42, "pagina": 1, "por_pagina": 20,
  "campos_header": [ { "id": 1, "texto_pergunta": "Cidade", "tipo": "texto" } ],
  "dados": [
    { "resposta_id": 10, "timestamp_envio": "…", "usuario_id": 5,
      "usuario_nome": "Ana Paula Silva", "valores": { "1": "São Paulo" } }
  ]
}
```
`usuario_nome` = quem coletou (`null` se resposta pública anônima). Erros: `403` · `404`.

### `DELETE /edicoes/{id}/respostas/{rid}` · `servidor`
Remove a resposta (e `coletou` em cascata). Response `204`. Erros: `403` · `404` (resposta não é da edição).

---

## 7. Pesquisador de campo

Todas exigem role `pesquisador_campo`. Servidor → `403`; anônimo → `401`.

### `GET /pesquisador/edicoes` · `pesquisador_campo`
Edições **abertas** de pesquisas `tipo=campo`, para o pesquisador escolher. Response `200`: `[EdicaoOut]`.

### `GET /pesquisador/edicoes/{id}` · `pesquisador_campo`
Formulário de uma edição de campo. Response `200` (`PublicEdicaoOut`).
Erros: `404` se a edição não existe **ou** não é de uma pesquisa `campo`.

### `POST /pesquisador/edicoes/{id}/respostas` · `pesquisador_campo`
Registra a coleta, **sempre vinculada ao pesquisador autenticado** (`usuario_id`) e à edição.
Request (`RespostaCreate`) e Response `201` (`RespostaOut`) iguais ao envio público.
Erros: `404` (não é edição de campo) · `409` edição fechada · `422` campo inválido/duplicado/vazio.
