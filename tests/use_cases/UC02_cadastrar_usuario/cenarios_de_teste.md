# Cenários de Teste — UC02 Cadastrar usuário

Base: `POST /usuarios`. Rota pública.

| ID | Tipo | Título |
|---|---|---|
| UC02-CT01 | Principal | Cadastrar servidor com dados válidos |
| UC02-CT02 | Alternativo | Cadastrar pesquisador de campo |
| UC02-CT03 | Alternativo | Cadastrar usuário com múltiplos papéis (deduplicação) |
| UC02-CT04 | Exceção | E-mail já cadastrado |
| UC02-CT05 | Exceção | Lista de roles vazia |
| UC02-CT06 | Exceção | Role inválido |
| UC02-CT07 | Exceção | E-mail inválido / campo faltando |
| UC02-CT08 | Alternativo | Senha não é retornada e está hasheada |

---

### UC02-CT01 — Cadastrar servidor com dados válidos (Principal)
- **Passos:**
  1. `POST /usuarios` com `{ "nome": "Ana", "email": "ana@x.com", "senha": "senha123", "roles": ["servidor"] }`.
- **Resultado esperado:**
  - Status `201`.
  - Corpo: `id` presente, `email == "ana@x.com"`, `roles == ["servidor"]`, `criado_em` presente.
  - Corpo **não** contém `senha`.

### UC02-CT02 — Cadastrar pesquisador de campo (Alternativo)
- **Passos:**
  1. `POST /usuarios` com `roles: ["pesquisador_campo"]`.
- **Resultado esperado:** Status `201`; `roles == ["pesquisador_campo"]`.

### UC02-CT03 — Múltiplos papéis com duplicata (Alternativo)
- **Passos:**
  1. `POST /usuarios` com `roles: ["servidor", "servidor", "pesquisador_campo"]`.
- **Resultado esperado:**
  - Status `201`.
  - `roles == ["servidor", "pesquisador_campo"]` (deduplicado, ordem preservada).

### UC02-CT04 — E-mail já cadastrado (Exceção)
- **Pré-condições:** usuário com `dup@x.com` já criado.
- **Passos:**
  1. `POST /usuarios` novamente com `email: "dup@x.com"`.
- **Resultado esperado:** Status `409`.

### UC02-CT05 — Lista de roles vazia (Exceção)
- **Passos:**
  1. `POST /usuarios` com `roles: []`.
- **Resultado esperado:** Status `422`.

### UC02-CT06 — Role inválido (Exceção)
- **Passos:**
  1. `POST /usuarios` com `roles: ["admin_supremo"]`.
- **Resultado esperado:** Status `422`.

### UC02-CT07 — E-mail inválido / campo faltando (Exceção)
- **Passos:**
  1. `POST /usuarios` com `email: "nao-eh-email"`.
  2. (variação) corpo sem `senha`.
- **Resultado esperado:** Status `422` em ambos.

### UC02-CT08 — Senha hasheada e não exposta (Alternativo)
- **Pré-condições:** usuário criado em CT01.
- **Passos:**
  1. Inspecionar o registro persistido via sessão de banco (`db`).
- **Resultado esperado:**
  - O campo de senha no banco **difere** de `"senha123"` (é hash).
  - O login com a senha original (UC01) funciona.
