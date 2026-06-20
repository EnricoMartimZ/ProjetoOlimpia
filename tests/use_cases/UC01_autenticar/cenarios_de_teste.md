# Cenários de Teste — UC01 Autenticar no sistema

Base: `POST /auth/login`. Reutiliza fixtures `client`, `servidor`, `pesquisador`.

| ID | Tipo | Título |
|---|---|---|
| UC01-CT01 | Principal | Login de servidor com credenciais válidas |
| UC01-CT02 | Principal | Login de pesquisador de campo (mesmo fluxo, outro ator) |
| UC01-CT03 | Exceção | E-mail inexistente |
| UC01-CT04 | Exceção | Senha incorreta |
| UC01-CT05 | Exceção | Payload incompleto/ inválido |
| UC01-CT06 | Principal | Conteúdo do token (claims gerados pelo fluxo principal) |

> **Nota:** o fluxo alternativo A1 (validação da aba ADM/Pesquisador) é regra de UI do
> frontend, sem cenário de teste de backend nesta camada.

---

### UC01-CT01 — Login de servidor com credenciais válidas (Principal)
- **Pré-condições:** usuário `servidor` cadastrado (`admin@teste.com` / `senha123`).
- **Passos:**
  1. `POST /auth/login` com `{ "email": "admin@teste.com", "senha": "senha123" }`.
- **Resultado esperado:**
  - Status `200`.
  - Corpo contém `access_token` (string não vazia) e `token_type == "bearer"`.

### UC01-CT02 — Login de pesquisador de campo (Principal — mesmo fluxo, outro ator)
- **Pré-condições:** usuário `pesquisador_campo` cadastrado (`pesq@teste.com` / `senha123`).
- **Passos:**
  1. `POST /auth/login` com as credenciais do pesquisador.
- **Resultado esperado:**
  - Status `200`; `access_token` presente.
  - Ao decodificar o token, `role == "pesquisador_campo"`.

### UC01-CT03 — E-mail inexistente (Exceção)
- **Passos:**
  1. `POST /auth/login` com `{ "email": "naoexiste@teste.com", "senha": "qualquer" }`.
- **Resultado esperado:** Status `401`; mensagem genérica de credenciais inválidas.

### UC01-CT04 — Senha incorreta (Exceção)
- **Pré-condições:** servidor cadastrado.
- **Passos:**
  1. `POST /auth/login` com e-mail correto e senha errada (`"errada"`).
- **Resultado esperado:** Status `401`; resposta idêntica à de e-mail inexistente (não distingue).

### UC01-CT05 — Payload incompleto/ inválido (Exceção)
- **Passos:**
  1. `POST /auth/login` com `{ "email": "admin@teste.com" }` (sem `senha`).
  2. (variação) corpo vazio `{}`.
- **Resultado esperado:** Status `422` (validação).

### UC01-CT06 — Conteúdo do token (Principal — verificação do artefato gerado)
- **Pré-condições:** servidor logado (CT01).
- **Passos:**
  1. Decodificar o `access_token` com a `SECRET_KEY` de teste.
- **Resultado esperado:**
  - Claims presentes: `sub` (id do usuário), `nome`, `role == "servidor"`, `exp` (futuro).
