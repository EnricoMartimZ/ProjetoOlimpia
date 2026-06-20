# Cenários de Teste — UC08 Gerenciar hospedagens

Base: CRUD `/hospedagens`. Fixtures `client`, `servidor`, `pesquisador`.
CNPJ de exemplo: `12.345.678/0001-90` (contém `/`).

| ID | Tipo | Título |
|---|---|---|
| UC08-CT01 | Principal | Cadastrar hospedagem com dados válidos |
| UC08-CT02 | Alternativo | Categoria omitida assume "Hotel" |
| UC08-CT03 | Alternativo | Listar hospedagens ordenadas por nome |
| UC08-CT04 | Alternativo | Detalhar por CNPJ com barra |
| UC08-CT05 | Alternativo | Editar parcial (CNPJ imutável) |
| UC08-CT06 | Alternativo | Excluir com cascata nas diárias |
| UC08-CT07 | Exceção | Cadastrar sem ser servidor |
| UC08-CT08 | Exceção | CNPJ duplicado (409) |
| UC08-CT09 | Exceção | Estrelas fora de 0–5 (422) |
| UC08-CT10 | Exceção | Hospedagem inexistente (404) |

---

### UC08-CT01 — Cadastrar hospedagem (Principal)
- **Pré-condições:** servidor autenticado.
- **Passos:** `POST /hospedagens` com payload completo (estrelas=5, quartos=120, url_booking).
- **Resultado esperado:** `201`; `cnpj` ecoado; `nome_fantasia`, `url_booking` corretos; `criado_em` presente.

### UC08-CT02 — Categoria default (Alternativo)
- **Passos:** `POST /hospedagens` sem `categoria`.
- **Resultado esperado:** `201`; `categoria == "Hotel"`.

### UC08-CT03 — Listar ordenado (Alternativo)
- **Pré-condições:** 2 hospedagens cadastradas ("Zeta", "Alfa").
- **Passos:** `GET /hospedagens` (servidor).
- **Resultado esperado:** `200`; ordem por nome ("Alfa" antes de "Zeta").

### UC08-CT04 — Detalhar por CNPJ com barra (Alternativo)
- **Pré-condições:** hospedagem `12.345.678/0001-90`.
- **Passos:** `GET /hospedagens/12.345.678/0001-90` (CNPJ cru na URL).
- **Resultado esperado:** `200`; corpo da hospedagem correta.

### UC08-CT05 — Editar parcial (Alternativo)
- **Pré-condições:** hospedagem cadastrada.
- **Passos:** `PUT /hospedagens/{cnpj}` com `{ "estrelas": 4 }`.
- **Resultado esperado:** `200`; `estrelas == 4`; `cnpj` inalterado; demais campos preservados.

### UC08-CT06 — Excluir com cascata (Alternativo)
- **Pré-condições:** hospedagem com ≥1 registro de diária.
- **Passos:** `DELETE /hospedagens/{cnpj}` (servidor).
- **Resultado esperado:**
  - `204`; `GET /hospedagens/{cnpj}` → `404`.
  - `GET /diarias?hospedagem_cnpj={cnpj}` → sem registros.

### UC08-CT07 — Cadastrar sem ser servidor (Exceção)
- **Passos:**
  1. `POST /hospedagens` sem token → `401`.
  2. Idem com headers de `pesquisador` → `403`.

### UC08-CT08 — CNPJ duplicado (Exceção)
- **Pré-condições:** CNPJ já cadastrado.
- **Passos:** `POST /hospedagens` com o mesmo CNPJ.
- **Resultado esperado:** `409`.

### UC08-CT09 — Estrelas inválidas (Exceção)
- **Passos:**
  1. `POST /hospedagens` com `estrelas: 7`.
  2. (variação) `quartos: -1`.
- **Resultado esperado:** `422` em cada.

### UC08-CT10 — Hospedagem inexistente (Exceção)
- **Passos:** `GET`, `PUT`, `DELETE` em `/hospedagens/00.000.000/0000-00` (servidor).
- **Resultado esperado:** `404` em cada.
