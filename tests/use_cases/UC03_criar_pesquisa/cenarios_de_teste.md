# Cenários de Teste — UC03 Criar e gerenciar pesquisa

Base: `POST/GET/PUT/DELETE /pesquisas`. Fixtures `client`, `servidor`, `pesquisador`.

| ID | Tipo | Título |
|---|---|---|
| UC03-CT01 | Principal | Criar pesquisa com campos (status rascunho) |
| UC03-CT02 | Alternativo | Tipo omitido assume `publica` |
| UC03-CT03 | Alternativo | Criar pesquisa tipo `campo` |
| UC03-CT04 | Alternativo | Detalhar pesquisa com campos |
| UC03-CT05 | Alternativo | Listar pesquisas (campos derivados) |
| UC03-CT06 | Alternativo | Editar pesquisa substituindo campos |
| UC03-CT07 | Alternativo | Excluir pesquisa em cascata |
| UC03-CT08 | Exceção | Criar sem autenticação / sem ser servidor |
| UC03-CT09 | Exceção | Nome duplicado |
| UC03-CT10 | Exceção | Pesquisa inexistente (GET/PUT/DELETE) |
| UC03-CT11 | Exceção | Tipo de campo inválido |

---

### UC03-CT01 — Criar pesquisa com campos (Principal)
- **Pré-condições:** servidor autenticado.
- **Passos:**
  1. `POST /pesquisas` (headers do servidor) com `nome`, `descricao`, `campos` com 2 itens (ex.: `texto` obrigatório + `multipla_escolha` com `opcoes`).
- **Resultado esperado:**
  - Status `201`.
  - `status == "rascunho"`, `total_edicoes == 0`, `edicao_atual_id == null`.
  - `campos` retornados com `id`, `hash_pergunta`, `ordem`.

### UC03-CT02 — Tipo omitido assume `publica` (Alternativo)
- **Passos:** `POST /pesquisas` sem o campo `tipo`.
- **Resultado esperado:** `201`; `tipo == "publica"`.

### UC03-CT03 — Criar pesquisa tipo `campo` (Alternativo)
- **Passos:** `POST /pesquisas` com `tipo: "campo"`.
- **Resultado esperado:** `201`; `tipo == "campo"`.

### UC03-CT04 — Detalhar pesquisa (Alternativo)
- **Pré-condições:** pesquisa criada (CT01).
- **Passos:** `GET /pesquisas/{id}` (sem auth).
- **Resultado esperado:** `200`; corpo com `campos` completos.

### UC03-CT05 — Listar pesquisas (Alternativo)
- **Pré-condições:** ao menos uma pesquisa criada.
- **Passos:** `GET /pesquisas` (sem auth).
- **Resultado esperado:** `200`; cada item traz `status`, `total_edicoes`, `edicao_atual_id`, `tipo`.

### UC03-CT06 — Editar substituindo campos (Alternativo)
- **Pré-condições:** pesquisa criada com 2 campos.
- **Passos:** `PUT /pesquisas/{id}` (servidor) com `campos` contendo 1 campo novo.
- **Resultado esperado:**
  - `200`; a pesquisa passa a ter **apenas** o novo campo (substituição, não merge).
  - Campos antigos não aparecem mais.

### UC03-CT07 — Excluir em cascata (Alternativo)
- **Pré-condições:** pesquisa com edição e respostas.
- **Passos:** `DELETE /pesquisas/{id}` (servidor).
- **Resultado esperado:**
  - `204`.
  - `GET /pesquisas/{id}` posterior → `404`.
  - Edições/respostas associadas removidas.

### UC03-CT08 — Criar sem ser servidor (Exceção)
- **Passos:**
  1. `POST /pesquisas` sem token → `401`.
  2. `POST /pesquisas` com headers de `pesquisador` → `403`.
- **Resultado esperado:** status conforme acima; nada é criado.

### UC03-CT09 — Nome duplicado (Exceção)
- **Pré-condições:** pesquisa "Demanda Turística" já existe.
- **Passos:** `POST /pesquisas` (servidor) com o mesmo `nome`.
- **Resultado esperado:** `409`.

### UC03-CT10 — Pesquisa inexistente (Exceção)
- **Passos:** `GET`, `PUT`, `DELETE` em `/pesquisas/999999`.
- **Resultado esperado:** `404` em cada (PUT/DELETE com headers de servidor).

### UC03-CT11 — Tipo de campo inválido (Exceção)
- **Passos:** `POST /pesquisas` com um campo `tipo: "cor_favorita"`.
- **Resultado esperado:** `422`.
