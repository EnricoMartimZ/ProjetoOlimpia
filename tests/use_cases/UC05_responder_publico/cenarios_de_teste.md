# Cenários de Teste — UC05 Responder pesquisa pública

Base: `GET /publico/edicoes/{id}`, `POST /edicoes/{id}/respostas`.
Fixtures `client`, `servidor` (para preparar pesquisa/edição), `pesquisador`.

| ID | Tipo | Título |
|---|---|---|
| UC05-CT01 | Principal | Abrir formulário e enviar resposta anônima |
| UC05-CT02 | Alternativo | Envio autenticado grava usuario_id |
| UC05-CT03 | Alternativo | Formulário de edição fora do período (aberta=false) |
| UC05-CT04 | Exceção | Formulário público de edição de campo (404) |
| UC05-CT05 | Exceção | Envio em edição de campo (403) |
| UC05-CT06 | Exceção | Envio em edição encerrada (409) |
| UC05-CT07 | Exceção | campo_id que não pertence à edição (422) |
| UC05-CT08 | Exceção | campo_id duplicado (422) |
| UC05-CT09 | Exceção | Lista de respostas vazia (422) |
| UC05-CT10 | Exceção | Edição inexistente (404) |

---

### UC05-CT01 — Abrir formulário e enviar resposta anônima (Principal)
- **Pré-condições:** pesquisa `publica` com edição `ativa` (abertura = hoje).
- **Passos:**
  1. `GET /publico/edicoes/{id}` (sem auth).
  2. `POST /edicoes/{id}/respostas` com 1 item válido (`campo_id` da edição, `atributo_texto`).
- **Resultado esperado:**
  - GET `200` com `aberta == true` e `campos`.
  - POST `201`; `total_campos == 1`; `timestamp_envio` presente.
  - Resposta persistida com `usuario_id == null`.

### UC05-CT02 — Envio autenticado grava usuario_id (Alternativo)
- **Pré-condições:** edição `ativa`; usuário logado (ex.: `servidor`).
- **Passos:** `POST /edicoes/{id}/respostas` com header `Authorization`.
- **Resultado esperado:** `201`; a resposta gravada tem `usuario_id` = id do usuário do token.

### UC05-CT03 — Formulário fora do período (Alternativo)
- **Pré-condições:** edição `agendada` (abertura no futuro) **ou** `encerrada`.
- **Passos:** `GET /publico/edicoes/{id}`.
- **Resultado esperado:** `200`; `aberta == false`.

### UC05-CT04 — Formulário público de edição de campo (Exceção)
- **Pré-condições:** pesquisa `tipo=campo` com edição ativa.
- **Passos:** `GET /publico/edicoes/{id}`.
- **Resultado esperado:** `404` (não expõe formulário de campo).

### UC05-CT05 — Envio em edição de campo (Exceção)
- **Pré-condições:** edição de pesquisa `campo`.
- **Passos:** `POST /edicoes/{id}/respostas`.
- **Resultado esperado:** `403`.

### UC05-CT06 — Envio em edição encerrada (Exceção)
- **Pré-condições:** edição `publica` com `data_fechamento` no passado.
- **Passos:** `POST /edicoes/{id}/respostas` com item válido.
- **Resultado esperado:** `409`.

### UC05-CT07 — campo_id de outra edição (Exceção)
- **Pré-condições:** edição A ativa; `campo_id` que pertence à edição B.
- **Passos:** `POST /edicoes/{A}/respostas` com `campo_id` de B.
- **Resultado esperado:** `422`.

### UC05-CT08 — campo_id duplicado (Exceção)
- **Passos:** `POST` com dois itens de mesmo `campo_id`.
- **Resultado esperado:** `422`.

### UC05-CT09 — Lista vazia (Exceção)
- **Passos:** `POST` com `respostas: []`.
- **Resultado esperado:** `422`.

### UC05-CT10 — Edição inexistente (Exceção)
- **Passos:** `POST /edicoes/999999/respostas` e `GET /publico/edicoes/999999`.
- **Resultado esperado:** `404` em ambos.
