# Cenários de Teste — UC06 Coletar resposta de pesquisa de campo

Base: `GET /pesquisador/edicoes`, `GET /pesquisador/edicoes/{id}`, `POST /pesquisador/edicoes/{id}/respostas`.
Fixtures `client`, `servidor` (prepara pesquisa `campo` + edição), `pesquisador`.

| ID | Tipo | Título |
|---|---|---|
| UC06-CT01 | Principal | Listar edições, abrir form e registrar coleta vinculada |
| UC06-CT02 | Alternativo | Sem edições de campo abertas → lista vazia |
| UC06-CT03 | Alternativo | Múltiplas coletas na mesma edição |
| UC06-CT04 | Exceção | Servidor acessando rota de pesquisador (403) |
| UC06-CT05 | Exceção | Anônimo acessando rota de pesquisador (401) |
| UC06-CT06 | Exceção | Edição de pesquisa pública via fluxo de campo (404) |
| UC06-CT07 | Exceção | Coleta em edição fechada (409) |
| UC06-CT08 | Exceção | Campo inválido/duplicado/lista vazia (422) |
| UC06-CT09 | Exceção | Edição inexistente (404) |

---

### UC06-CT01 — Coleta vinculada (Principal)
- **Pré-condições:** pesquisa `tipo=campo` com edição `ativa`; pesquisador autenticado.
- **Passos:**
  1. `GET /pesquisador/edicoes` (headers do pesquisador).
  2. `GET /pesquisador/edicoes/{id}`.
  3. `POST /pesquisador/edicoes/{id}/respostas` com 1 item válido.
- **Resultado esperado:**
  - Passo 1: `200`, edição presente na lista.
  - Passo 2: `200`, `PublicEdicaoOut` com `campos`.
  - Passo 3: `201`; a resposta gravada tem `usuario_id` == id do pesquisador.
  - Na consulta do servidor (UC07), `usuario_nome` == nome do pesquisador.

### UC06-CT02 — Lista vazia (Alternativo)
- **Pré-condições:** nenhuma edição de campo aberta (ex.: todas agendadas/encerradas, ou só pesquisas públicas).
- **Passos:** `GET /pesquisador/edicoes`.
- **Resultado esperado:** `200`; lista vazia `[]`.

### UC06-CT03 — Múltiplas coletas (Alternativo)
- **Passos:** `POST /pesquisador/edicoes/{id}/respostas` 3 vezes com dados diferentes.
- **Resultado esperado:** 3× `201`; 3 respostas, todas com `usuario_id` do pesquisador.

### UC06-CT04 — Servidor na rota de pesquisador (Exceção)
- **Passos:** `GET /pesquisador/edicoes` com headers de `servidor`.
- **Resultado esperado:** `403`.

### UC06-CT05 — Anônimo na rota de pesquisador (Exceção)
- **Passos:** `GET /pesquisador/edicoes` sem token.
- **Resultado esperado:** `401`.

### UC06-CT06 — Edição pública via fluxo de campo (Exceção)
- **Pré-condições:** edição de pesquisa `publica`.
- **Passos:** `GET /pesquisador/edicoes/{id}` e `POST .../respostas` (pesquisador).
- **Resultado esperado:** `404` (não é edição de campo).

### UC06-CT07 — Coleta em edição fechada (Exceção)
- **Pré-condições:** edição de campo `encerrada`.
- **Passos:** `POST /pesquisador/edicoes/{id}/respostas` com item válido.
- **Resultado esperado:** `409`.

### UC06-CT08 — Campo inválido/duplicado/lista vazia (Exceção)
- **Passos:**
  1. `POST` com `campo_id` de outra edição.
  2. `POST` com `campo_id` duplicado.
  3. `POST` com `respostas: []`.
- **Resultado esperado:** `422` em cada.

### UC06-CT09 — Edição inexistente (Exceção)
- **Passos:** `GET /pesquisador/edicoes/999999` e `POST .../999999/respostas`.
- **Resultado esperado:** `404`.
