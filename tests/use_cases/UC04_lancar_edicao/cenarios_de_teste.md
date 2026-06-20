# Cenários de Teste — UC04 Lançar edição de pesquisa

Base: `POST /pesquisas/{id}/edicoes`, `GET /pesquisas/{id}/edicoes`, `GET /edicoes/{id}/campos`.
Fixtures `client`, `servidor`, `pesquisador`. Datas relativas a `date.today()`.

| ID | Tipo | Título |
|---|---|---|
| UC04-CT01 | Principal | Lançar primeira edição (numero_edicao = 1, ativa) |
| UC04-CT02 | Alternativo | Segunda edição auto-incrementa o número |
| UC04-CT03 | Alternativo | Edição agendada (abertura no futuro) |
| UC04-CT04 | Alternativo | Edição sem data de fechamento fica ativa |
| UC04-CT05 | Alternativo | Edição com campos extras + combinação ordenada |
| UC04-CT06 | Alternativo | Listar edições da pesquisa |
| UC04-CT07 | Exceção | Lançar sem ser servidor |
| UC04-CT08 | Exceção | Pesquisa inexistente |
| UC04-CT09 | Exceção | data_fechamento anterior à abertura |
| UC04-CT10 | Exceção | Campos de edição inexistente |

---

### UC04-CT01 — Lançar primeira edição (Principal)
- **Pré-condições:** pesquisa criada (UC03-CT01).
- **Passos:**
  1. `POST /pesquisas/{id}/edicoes` (servidor) com `data_abertura = hoje`, `data_fechamento = null`.
- **Resultado esperado:**
  - `201`; `numero_edicao == 1`; `status == "ativa"`; `total_respostas == 0`.

### UC04-CT02 — Segunda edição incrementa número (Alternativo)
- **Pré-condições:** pesquisa com 1 edição.
- **Passos:** `POST /pesquisas/{id}/edicoes` novamente.
- **Resultado esperado:** `201`; `numero_edicao == 2`.

### UC04-CT03 — Edição agendada (Alternativo)
- **Passos:** `POST` com `data_abertura = hoje + 5 dias`.
- **Resultado esperado:** `201`; `status == "agendada"`.

### UC04-CT04 — Edição sem fechamento fica ativa (Alternativo)
- **Passos:** `POST` com `data_abertura = hoje`, sem `data_fechamento`.
- **Resultado esperado:** `201`; `status == "ativa"`.

### UC04-CT05 — Campos extras e combinação (Alternativo)
- **Pré-condições:** pesquisa com 1 campo fixo (`ordem 0`).
- **Passos:**
  1. `POST` com `campos_extras` contendo 1 campo (`ordem 0`).
  2. `GET /edicoes/{id}/campos`.
- **Resultado esperado:**
  - `200`; lista começa pelo campo **fixo** da pesquisa, seguido do **extra** da edição.

### UC04-CT06 — Listar edições (Alternativo)
- **Pré-condições:** pesquisa com 2 edições.
- **Passos:** `GET /pesquisas/{id}/edicoes` (sem auth).
- **Resultado esperado:** `200`; 2 itens com `numero_edicao`, `status`, `total_respostas`.

### UC04-CT07 — Lançar sem ser servidor (Exceção)
- **Passos:**
  1. `POST /pesquisas/{id}/edicoes` sem token → `401`.
  2. Idem com headers de `pesquisador` → `403`.

### UC04-CT08 — Pesquisa inexistente (Exceção)
- **Passos:** `POST /pesquisas/999999/edicoes` (servidor).
- **Resultado esperado:** `404`.

### UC04-CT09 — Datas inconsistentes (Exceção)
- **Passos:** `POST` com `data_fechamento = hoje - 1`, `data_abertura = hoje`.
- **Resultado esperado:** `422`.

### UC04-CT10 — Campos de edição inexistente (Exceção)
- **Passos:** `GET /edicoes/999999/campos`.
- **Resultado esperado:** `404`.
