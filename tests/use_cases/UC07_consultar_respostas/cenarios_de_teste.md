# Cenários de Teste — UC07 Visualizar respostas tabuladas

Base: `GET /edicoes/{id}/respostas`, `DELETE /edicoes/{id}/respostas/{rid}`.
Fixtures `client`, `servidor`, `pesquisador`.

| ID | Tipo | Título |
|---|---|---|
| UC07-CT01 | Principal | Consultar respostas tabuladas com cabeçalho |
| UC07-CT02 | Alternativo | Paginação (pagina/por_pagina) |
| UC07-CT03 | Alternativo | Busca por texto (ILIKE) |
| UC07-CT04 | Alternativo | Edição sem respostas |
| UC07-CT05 | Alternativo | Coletado por (usuario_nome) em coleta de campo |
| UC07-CT06 | Alternativo | Remover resposta (204) |
| UC07-CT07 | Exceção | Consultar sem ser servidor |
| UC07-CT08 | Exceção | Edição inexistente (404) |
| UC07-CT09 | Exceção | Remover resposta de outra edição (404) |
| UC07-CT10 | Exceção | Parâmetros de paginação inválidos (422) |

---

### UC07-CT01 — Consultar tabulado (Principal)
- **Pré-condições:** edição com ≥1 resposta; servidor autenticado.
- **Passos:** `GET /edicoes/{id}/respostas` (headers do servidor).
- **Resultado esperado:**
  - `200`; `total` ≥ 1; `campos_header` com os campos; `dados[i].valores` mapeia `campo_id → valor`.
  - Linha pública anônima: `usuario_nome == null`.

### UC07-CT02 — Paginação (Alternativo)
- **Pré-condições:** edição com 3 respostas.
- **Passos:** `GET /edicoes/{id}/respostas?pagina=1&por_pagina=2`.
- **Resultado esperado:** `200`; `len(dados) == 2`; `total == 3`; `por_pagina == 2`.

### UC07-CT03 — Busca por texto (Alternativo)
- **Pré-condições:** respostas com valores "São Paulo" e "Campinas".
- **Passos:** `GET /edicoes/{id}/respostas?busca=são`.
- **Resultado esperado:** `200`; apenas linhas que casam com o termo (case-insensitive).

### UC07-CT04 — Edição sem respostas (Alternativo)
- **Pré-condições:** edição recém-criada, 0 respostas.
- **Passos:** `GET /edicoes/{id}/respostas`.
- **Resultado esperado:** `200`; `total == 0`; `dados == []`; `campos_header` preenchido.

### UC07-CT05 — Coletado por em coleta de campo (Alternativo)
- **Pré-condições:** resposta registrada via UC06 pelo pesquisador "Pesq Campo".
- **Passos:** `GET /edicoes/{id}/respostas` (servidor).
- **Resultado esperado:** a linha correspondente tem `usuario_nome == "Pesq Campo"` e `usuario_id` do pesquisador.

### UC07-CT06 — Remover resposta (Alternativo)
- **Pré-condições:** edição com resposta `rid`.
- **Passos:** `DELETE /edicoes/{id}/respostas/{rid}` (servidor).
- **Resultado esperado:** `204`; nova consulta não traz mais aquela resposta; `total` decrementa.

### UC07-CT07 — Consultar sem ser servidor (Exceção)
- **Passos:**
  1. `GET /edicoes/{id}/respostas` sem token → `401`.
  2. Idem com headers de `pesquisador` → `403`.

### UC07-CT08 — Edição inexistente (Exceção)
- **Passos:** `GET /edicoes/999999/respostas` (servidor).
- **Resultado esperado:** `404`.

### UC07-CT09 — Remover resposta de outra edição (Exceção)
- **Pré-condições:** resposta `rid` pertence à edição B.
- **Passos:** `DELETE /edicoes/{A}/respostas/{rid}` (servidor).
- **Resultado esperado:** `404`.

### UC07-CT10 — Paginação inválida (Exceção)
- **Passos:**
  1. `GET /edicoes/{id}/respostas?pagina=0`.
  2. `GET /edicoes/{id}/respostas?por_pagina=1000`.
- **Resultado esperado:** `422` em cada.
