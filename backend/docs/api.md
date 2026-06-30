# API Reference — Projeto Olímpia

Referência das rotas **implementadas** da API do Projeto Olímpia, fiel ao código em `backend/app/routers`.
Especificação interativa (Swagger UI / OpenAPI) sobe junto com a aplicação em `http://localhost:8000/docs`.

## Visão geral

- **Base URL (local):** `http://localhost:8000`
- **Formato:** requisições e respostas em `application/json` (UTF-8).
- **Versão:** `0.1.0`.
- **Autenticação:** JWT Bearer. Faça `POST /auth/login`, guarde o `access_token` e envie em cada
  requisição protegida no header `Authorization: Bearer <token>`.

### Autenticação e autorização

O token JWT carrega `sub` (id do usuário), `nome`, `role` e `exp`. Um usuário pode acumular mais de
um perfil (ex.: `servidor,pesquisador_campo`); a autorização exige que o perfil necessário esteja
presente no conjunto de roles do usuário.

| Nível de acesso | Como é aplicado | Comportamento |
|---|---|---|
| Público | _(sem dependência)_ | qualquer um acessa |
| Auth opcional | `get_optional_user` | aceita o token se houver (grava `usuario_id`); nunca exige |
| `servidor` | `require_servidor` | `401` sem token · `403` se o usuário não for `servidor` |
| `pesquisador_campo` | `require_pesquisador` | `401` sem token · `403` se o usuário não for `pesquisador_campo` |

### Convenções de status

- `200 OK` — leitura/atualização bem-sucedida.
- `201 Created` — recurso criado.
- `204 No Content` — exclusão bem-sucedida (sem corpo).
- `401 Unauthorized` — token ausente/ inválido em rota protegida.
- `403 Forbidden` — autenticado, mas sem o perfil necessário (ou ação proibida).
- `404 Not Found` — recurso inexistente.
- `409 Conflict` — violação de unicidade (e-mail, nome, CNPJ, registro duplicado).
- `422 Unprocessable Entity` — validação de payload/query falhou.

### Formato de erro

Erros seguem o padrão do FastAPI:

```json
{ "detail": "Mensagem legível do erro." }
```

Para `422` de validação automática, `detail` é uma lista de objetos descrevendo cada campo inválido.

---

## Quick reference

| Método | Rota | Recurso | Auth |
|---|---|---|---|
| POST | `/auth/login` | Autenticação | Público |
| POST | `/usuarios` | Usuários | Público |
| GET | `/usuarios` | Usuários | `servidor` |
| PUT | `/usuarios/{id}/roles` | Usuários | `servidor` |
| DELETE | `/usuarios/{id}` | Usuários | `servidor` |
| GET | `/pesquisas` | Pesquisas | Público |
| POST | `/pesquisas` | Pesquisas | `servidor` |
| GET | `/pesquisas/{id}` | Pesquisas | Público |
| PUT | `/pesquisas/{id}` | Pesquisas | `servidor` |
| DELETE | `/pesquisas/{id}` | Pesquisas | `servidor` |
| GET | `/pesquisas/{id}/edicoes` | Edições | Público |
| POST | `/pesquisas/{id}/edicoes` | Edições | `servidor` |
| POST | `/edicoes/{id}/status` | Edições | `servidor` |
| DELETE | `/edicoes/{id}` | Edições | `servidor` |
| GET | `/edicoes/{id}/campos` | Edições | Público |
| GET | `/publico/edicoes/{id}` | Formulário público | Público |
| POST | `/edicoes/{id}/respostas` | Respostas | Auth opcional |
| GET | `/edicoes/{id}/respostas` | Respostas | `servidor` |
| DELETE | `/edicoes/{id}/respostas/{rid}` | Respostas | `servidor` |
| GET | `/pesquisador/edicoes` | Coleta de campo | `pesquisador_campo` |
| GET | `/pesquisador/edicoes/{id}` | Coleta de campo | `pesquisador_campo` |
| POST | `/pesquisador/edicoes/{id}/respostas` | Coleta de campo | `pesquisador_campo` |
| GET | `/hospedagens` | Hospedagens | `servidor` |
| POST | `/hospedagens` | Hospedagens | `servidor` |
| GET | `/hospedagens/{cnpj}` | Hospedagens | `servidor` |
| PUT | `/hospedagens/{cnpj}` | Hospedagens | `servidor` |
| DELETE | `/hospedagens/{cnpj}` | Hospedagens | `servidor` |
| GET | `/diarias/pendentes` | Diárias | `servidor` |
| GET | `/diarias` | Diárias | `servidor` |
| POST | `/diarias` | Diárias | `servidor` |
| DELETE | `/diarias/{id}` | Diárias | `servidor` |

---

## Modelos compartilhados

### Enums

- **`RoleType`** (perfil de usuário): `servidor` | `pesquisador_campo`.
- **`TipoPesquisa`**: `publica` | `campo` (default `publica`).
- **`FieldType`** (tipo de um campo): `texto` · `texto_longo` · `numero` · `multipla_escolha` · `data` · `escala` · `sim_nao`.

### Status derivados

- **Edição:** `agendada` (ainda não abriu) · `ativa` (aceitando respostas) · `encerrada` (fechada).
- **Pesquisa** (derivado das edições): `rascunho` (sem edições) · `ativa` · `encerrada`.

### `Campo`

Saída (`CampoOut`):

```json
{ "id": 1, "hash_pergunta": "…", "texto_pergunta": "Cidade de origem",
  "tipo": "texto", "opcoes": [], "obrigatorio": true, "ordem": 0 }
```

Entrada (`CampoCreate`):

```json
{ "texto_pergunta": "Cidade de origem", "tipo": "texto", "opcoes": [], "obrigatorio": false, "ordem": 0 }
```

`opcoes` é usado por campos `multipla_escolha`. `ordem` define a posição no formulário (default `0`,
preenchido por índice quando omitido).

---

## Autenticação

### `POST /auth/login`

Gera o token de acesso. **Público.**

Request:

```json
{ "email": "admin@olimpia.sp.gov.br", "senha": "string" }
```

Response `200`:

```json
{ "access_token": "<jwt>", "token_type": "bearer" }
```

**Erros:** `401` credenciais inválidas.

---

## Usuários

### `POST /usuarios`

Cria um usuário. **Público** (autocadastro). Um usuário pode receber mais de um perfil.

Request (`UsuarioCreate`):

```json
{ "nome": "Ana", "email": "ana@x.com", "senha": "string", "roles": ["pesquisador_campo"] }
```

`roles` é uma lista não vazia de `RoleType` (duplicatas são removidas).

Response `201` (`UsuarioOut`):

```json
{ "id": 1, "nome": "Ana", "email": "ana@x.com",
  "role": "pesquisador_campo", "roles": ["pesquisador_campo"], "criado_em": "…" }
```

`role` é a string armazenada (perfis separados por vírgula); `roles` é a mesma informação como lista.

**Erros:** `409` e-mail já cadastrado · `422` lista de roles vazia.

### `GET /usuarios`

Lista todos os usuários (ordenados por data de criação). **`servidor`.**

Response `200`: `[UsuarioOut]`.

### `PUT /usuarios/{usuario_id}/roles`

Substitui o conjunto de perfis de um usuário. **`servidor`.**

Request (`UsuarioRoleUpdate`):

```json
{ "roles": ["servidor", "pesquisador_campo"] }
```

Response `200` (`UsuarioOut`).

**Erros:** `404` usuário não encontrado · `422` lista de roles vazia.

### `DELETE /usuarios/{usuario_id}`

Remove um usuário. **`servidor`.** Não é possível remover a própria conta.

Response `204`.

**Erros:** `403` tentativa de remover a própria conta · `404` usuário não encontrado.

---

## Pesquisas

Uma pesquisa agrupa os campos base reaproveitados em todas as suas edições. `status` e
`edicao_atual_id` são **derivados** das edições — não ficam gravados.

### `GET /pesquisas`

Lista resumida de todas as pesquisas. **Público.**

Response `200` (`[PesquisaListOut]`):

```json
[ { "id": 1, "nome": "Demanda Turística", "descricao": "…", "tipo": "campo",
    "status": "ativa", "total_edicoes": 3, "edicao_atual_id": 7 } ]
```

`edicao_atual_id`: edição cujo link compartilhar (a ativa, ou a mais recente); `null` se rascunho.

### `POST /pesquisas`

Cria uma pesquisa e seus campos base. **`servidor`.**

Request (`PesquisaCreate`):

```json
{
  "nome": "Demanda Turística",
  "descricao": "Perfil do turista",
  "tipo": "campo",
  "campos": [
    { "texto_pergunta": "Cidade de origem", "tipo": "texto", "obrigatorio": true, "ordem": 0 },
    { "texto_pergunta": "Motivo", "tipo": "multipla_escolha", "opcoes": ["Lazer", "Negócios"], "ordem": 1 }
  ]
}
```

`tipo` é opcional (default `publica`).

Response `201` (`PesquisaOut`):

```json
{ "id": 1, "nome": "…", "descricao": "…", "tipo": "campo", "criado_em": "…",
  "status": "rascunho", "total_edicoes": 0, "edicao_atual_id": null, "campos": [ /* CampoOut */ ] }
```

**Erros:** `403` não-servidor · `409` nome duplicado · `422` validação.

### `GET /pesquisas/{id}`

Detalha uma pesquisa com seus campos. **Público.**

Response `200` (`PesquisaOut`). **Erros:** `404`.

### `PUT /pesquisas/{id}`

Atualiza uma pesquisa. **`servidor`.** Campos do `PesquisaUpdate` são todos opcionais
(`nome?`, `descricao?`, `tipo?`, `campos?`). Se `campos` for enviado, **substitui** todos os campos base.

Response `200` (`PesquisaOut`). **Erros:** `403` · `404` · `409` nome duplicado.

### `DELETE /pesquisas/{id}`

Remove a pesquisa e seus dados em cascata (campos, edições, respostas). **`servidor`.**

Response `204`. **Erros:** `403` · `404`.

---

## Edições

Cada edição é uma instância de uma pesquisa num período e gera um link público
(`/pesquisa/{edicaoId}`). Pode ter campos extras próprios, além dos campos fixos da pesquisa.

### `GET /pesquisas/{id}/edicoes`

Lista as edições de uma pesquisa (ordenadas por número). **Público.**

Response `200` (`[EdicaoOut]`):

```json
[ { "id": 7, "pesquisa_id": 1, "pesquisa_nome": "Demanda Turística", "numero_edicao": 3,
    "data_abertura": "2026-06-01", "data_fechamento": null, "criado_em": "…",
    "total_respostas": 42, "status": "ativa" } ]
```

**Erros:** `404` pesquisa não encontrada.

### `POST /pesquisas/{id}/edicoes`

Lança uma edição, auto-incrementando `numero_edicao`. **`servidor`.**

Request (`EdicaoCreate`):

```json
{ "data_abertura": "2026-06-01", "data_fechamento": null, "campos_extras": [ /* CampoCreate */ ] }
```

Response `201` (`EdicaoOut`). **Erros:** `403` · `404` · `422` `data_fechamento` < `data_abertura`.

> Se a nova edição já nasce **ativa** (`data_abertura ≤ hoje` e ainda não fechada), as demais edições
> ativas da mesma pesquisa são **encerradas automaticamente** (`data_fechamento = ontem`). Garante no
> máximo uma edição ativa por pesquisa.

### `POST /edicoes/{id}/status`

Ativa ou encerra uma edição ajustando suas datas. **`servidor`.**

Request (`EdicaoStatusUpdate`):

```json
{ "acao": "ativar" }
```

- `acao: "ativar"` — move `data_abertura` para hoje (se estava no futuro) e zera `data_fechamento`. As
  outras edições ativas da mesma pesquisa são **encerradas automaticamente**.
- `acao: "encerrar"` — define `data_fechamento = ontem` (status passa a `encerrada`).

Response `200` (`EdicaoOut`). **Erros:** `403` · `404` · `422` `acao` fora de `{ativar, encerrar}`.

### `DELETE /edicoes/{id}`

Exclui a edição e os dados associados em cascata. **`servidor`.**

Response `204`. **Erros:** `403` · `404`.

### `GET /edicoes/{id}/campos`

Campos fixos da pesquisa + extras da edição, ordenados. **Público.**

Response `200` (`[CampoOut]`). **Erros:** `404`.

---

## Formulário público

### `GET /publico/edicoes/{id}`

Serve o formulário aberto acessado pelo link `/pesquisa/{edicaoId}`. **Público.**

Response `200` (`PublicEdicaoOut`):

```json
{ "edicao_id": 7, "pesquisa_id": 1, "pesquisa_nome": "…", "descricao": "…",
  "numero_edicao": 3, "data_abertura": "…", "data_fechamento": null,
  "aberta": true, "campos": [ /* CampoOut */ ] }
```

**Erros:** `404` — inclui o caso de a edição pertencer a uma pesquisa **`tipo=campo`** (o formulário de
campo não é exposto publicamente).

---

## Respostas

### `POST /edicoes/{id}/respostas`

Envio público de um formulário. **Auth opcional** — se um Bearer token válido for enviado, grava o
`usuario_id` na resposta.

Request (`RespostaCreate`):

```json
{ "respostas": [ { "campo_id": 1, "atributo_texto": "São Paulo" } ] }
```

Response `201` (`RespostaOut`):

```json
{ "id": 10, "edicao_id": 7, "timestamp_envio": "…", "total_campos": 1 }
```

**Erros:** `403` edição de pesquisa **`campo`** (use o fluxo do pesquisador) · `404` · `409` edição
fechada · `422` campo não pertence à edição / duplicado / lista vazia.

### `GET /edicoes/{id}/respostas`

Respostas tabuladas (colunas dinâmicas por campo), paginadas. **`servidor`.**

Query params: `pagina` (≥1, default 1) · `por_pagina` (1–500, default 20) · `busca` (ILIKE no texto das respostas).

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

`usuario_nome` = quem coletou (`null` se resposta pública anônima). As chaves de `valores` são o
`campo_id` em string. **Erros:** `403` · `404`.

### `DELETE /edicoes/{id}/respostas/{rid}`

Remove uma resposta e suas coletas em cascata. **`servidor`.**

Response `204`. **Erros:** `403` · `404` (resposta não pertence à edição).

---

## Coleta de campo

Fluxo do pesquisador de campo: ele faz login, lista as edições abertas de pesquisas `tipo=campo`, abre
o formulário e envia a coleta. A resposta fica **vinculada ao seu `usuario_id`** e à edição. Todas as
rotas exigem role `pesquisador_campo` (servidor → `403`; anônimo → `401`).

### `GET /pesquisador/edicoes`

Edições **abertas** de pesquisas `tipo=campo`, para o pesquisador escolher. **`pesquisador_campo`.**

Response `200` (`[EdicaoOut]`).

### `GET /pesquisador/edicoes/{id}`

Formulário de uma edição de campo. **`pesquisador_campo`.**

Response `200` (`PublicEdicaoOut`). **Erros:** `404` se a edição não existe **ou** não é de uma
pesquisa `campo` (não vaza pesquisas públicas por este fluxo).

### `POST /pesquisador/edicoes/{id}/respostas`

Registra a coleta, sempre vinculada ao pesquisador autenticado (`usuario_id`) e à edição.
**`pesquisador_campo`.** Request (`RespostaCreate`) e Response `201` (`RespostaOut`) iguais ao envio público.

**Erros:** `404` (não é edição de campo) · `409` edição fechada · `422` campo inválido/duplicado/vazio.

---

## Hospedagens

Cadastro dos hotéis/pousadas/resorts da coleta de Diária Média. **Todas exigem role `servidor`**
(`401` sem token · `403` se não for servidor). `hospedagem` guarda os dados fixos (incl. `url_booking`,
o link fixo do Booking); os preços por data ficam em `/diarias`.

> O `cnpj` é a chave e pode conter `/` (ex.: `12.345.678/0001-90`). As rotas usam `{cnpj:path}`, então
> o valor vai **cru** na URL (sem `encodeURIComponent`).

Saída (`HospedagemOut`):

```json
{ "cnpj": "12.345.678/0001-90", "nome_fantasia": "Hotel Termas", "local": "Olímpia/SP",
  "categoria": "Resort", "estrelas": 5, "quartos": 120,
  "url_booking": "https://booking.com/...", "foto_url": "https://...",
  "criado_em": "2026-06-02T12:00:00Z" }
```

### `GET /hospedagens`

Lista todas as hospedagens (ordenadas por nome). Response `200` (`[HospedagemOut]`).

### `POST /hospedagens`

Cadastra uma hospedagem. Request (`HospedagemCreate`): `cnpj` (formato `00.000.000/0001-00`),
`nome_fantasia`, `local`, `categoria` (default `Hotel`), `estrelas` (0–5, default 0),
`quartos` (≥0, default 0), `url_booking?`, `foto_url?`.

Response `201` (`HospedagemOut`). **Erros:** `409` CNPJ já existe · `422` validação (formato do CNPJ,
estrelas fora de 0–5, campos vazios, quartos negativo).

### `GET /hospedagens/{cnpj}`

Detalha uma hospedagem. Response `200` (`HospedagemOut`). **Erros:** `404`.

### `PUT /hospedagens/{cnpj}`

Atualização parcial (o CNPJ não muda). Request (`HospedagemUpdate`, todos os campos opcionais).
Response `200` (`HospedagemOut`). **Erros:** `404` · `422` validação.

### `DELETE /hospedagens/{cnpj}`

Remove a hospedagem e, em cascata, todos os seus registros de diária. Response `204`. **Erros:** `404`.

---

## Diárias

Registro contínuo de preço por hospedagem/data. **Todas exigem role `servidor`.** Um registro por
hospedagem por data.

Saída (`DiariaMediaOut`) — inclui `nome_fantasia` (join) para a tabela:

```json
{ "id": 1, "hospedagem_cnpj": "12.345.678/0001-90", "nome_fantasia": "Hotel Termas",
  "data": "2026-06-01", "preco": 450.50, "registrado_em": "2026-06-02T12:00:00Z" }
```

### `GET /diarias/pendentes`

Hospedagens que **ainda não** têm diária registrada na data de referência. Query param `data`
(`YYYY-MM-DD`, default hoje).

Response `200` (`[HospedagemPendente]`): `cnpj`, `nome_fantasia`, `categoria`, `estrelas`, `foto_url`, `url_booking`.

### `GET /diarias`

Lista os registros (datas mais recentes primeiro). Query params opcionais: `hospedagem_cnpj`, `data`.
Response `200` (`[DiariaMediaOut]`).

### `POST /diarias`

Registra a diária. Request (`DiariaMediaCreate`): `hospedagem_cnpj`, `data` (ISO), `preco` (≥0).

Response `201` (`DiariaMediaOut`). **Erros:** `404` hospedagem inexistente · `409` já existe registro
para essa hospedagem+data · `422` preço negativo.

### `DELETE /diarias/{id}`

Remove um registro específico. Response `204`. **Erros:** `404`.
