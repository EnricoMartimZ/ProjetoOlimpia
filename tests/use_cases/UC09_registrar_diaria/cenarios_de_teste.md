# Cenários de Teste — UC09 Registrar diária média

Base: `POST /diarias`, `GET /diarias`, `GET /diarias/pendentes`, `DELETE /diarias/{id}`.
Fixtures `client`, `servidor`, `pesquisador`. Pré: hospedagem cadastrada (UC08).

| ID | Tipo | Título |
|---|---|---|
| UC09-CT01 | Principal | Registrar diária para hospedagem existente |
| UC09-CT02 | Alternativo | Pendentes (default hoje) deixa de listar após registro |
| UC09-CT03 | Alternativo | Listar registros com filtro por cnpj/data |
| UC09-CT04 | Alternativo | Mesma hospedagem em datas diferentes |
| UC09-CT05 | Alternativo | Remover registro (204) e voltar a pendente |
| UC09-CT06 | Exceção | Registrar sem ser servidor |
| UC09-CT07 | Exceção | Hospedagem inexistente (404) |
| UC09-CT08 | Exceção | Registro duplicado hospedagem+data (409) |
| UC09-CT09 | Exceção | Preço negativo (422) |
| UC09-CT10 | Exceção | Remover registro inexistente (404) |

---

### UC09-CT01 — Registrar diária (Principal)
- **Pré-condições:** hospedagem `12.345.678/0001-90` cadastrada; servidor autenticado.
- **Passos:** `POST /diarias` com `{ hospedagem_cnpj, data: hoje, preco: 450.50 }`.
- **Resultado esperado:** `201`; corpo com `id`, `nome_fantasia` (join), `data`, `preco == 450.50`, `registrado_em`.

### UC09-CT02 — Pendentes deixa de listar (Alternativo)
- **Passos:**
  1. `GET /diarias/pendentes` (sem `data`) → hospedagem consta como pendente.
  2. `POST /diarias` para a hospedagem na data de hoje.
  3. `GET /diarias/pendentes` novamente.
- **Resultado esperado:** após o registro, a hospedagem **não** aparece mais na lista de pendentes de hoje.

### UC09-CT03 — Listar com filtros (Alternativo)
- **Pré-condições:** ≥2 registros de diferentes hospedagens/datas.
- **Passos:**
  1. `GET /diarias` → todos, mais recentes primeiro.
  2. `GET /diarias?hospedagem_cnpj={cnpj}`.
  3. `GET /diarias?data=YYYY-MM-DD`.
- **Resultado esperado:** `200`; resultados filtrados corretamente; ordem por mais recente.

### UC09-CT04 — Mesma hospedagem em datas diferentes (Alternativo)
- **Passos:** `POST /diarias` para o mesmo CNPJ em `hoje` e em `hoje - 1`.
- **Resultado esperado:** ambos `201` (unicidade é por hospedagem + data).

### UC09-CT05 — Remover registro (Alternativo)
- **Pré-condições:** diária `id` registrada para hoje.
- **Passos:**
  1. `DELETE /diarias/{id}` (servidor).
  2. `GET /diarias/pendentes`.
- **Resultado esperado:** `204`; a hospedagem volta a constar como pendente na data.

### UC09-CT06 — Registrar sem ser servidor (Exceção)
- **Passos:**
  1. `POST /diarias` sem token → `401`.
  2. Idem com headers de `pesquisador` → `403`.

### UC09-CT07 — Hospedagem inexistente (Exceção)
- **Passos:** `POST /diarias` com `hospedagem_cnpj` não cadastrado.
- **Resultado esperado:** `404`.

### UC09-CT08 — Registro duplicado (Exceção)
- **Pré-condições:** já existe diária para a hospedagem na data X.
- **Passos:** `POST /diarias` para a mesma hospedagem e data X.
- **Resultado esperado:** `409`.

### UC09-CT09 — Preço negativo (Exceção)
- **Passos:** `POST /diarias` com `preco: -10`.
- **Resultado esperado:** `422`.

### UC09-CT10 — Remover inexistente (Exceção)
- **Passos:** `DELETE /diarias/999999` (servidor).
- **Resultado esperado:** `404`.
