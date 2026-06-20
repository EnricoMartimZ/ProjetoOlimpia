# UC07 — Visualizar respostas tabuladas

> Requisito: **REQ 11** (visualizar as respostas tabuladas de cada edição de cada pesquisa).

## 1. Identificação

- **Nome:** Visualizar (e remover) respostas tabuladas de uma edição
- **Ator(es):** Servidor da Secretaria de Turismo (`servidor`).

## 2. Condições

- **Pré-condições:**
  - Ator autenticado com role `servidor`.
  - A edição existe (pode ter 0 ou mais respostas).
- **Pós-condições:**
  - O servidor obtém as respostas em formato tabular, paginadas, com cabeçalho de colunas.
  - Em remoção: a resposta (e o vínculo de coleta) é apagada.

## 3. Fluxos

### Fluxo principal (caminho feliz)
1. O servidor envia `GET /edicoes/{id}/respostas` (opcionalmente `pagina`, `por_pagina`, `busca`).
2. O sistema monta o cabeçalho (`campos_header`) com os campos da edição.
3. O sistema retorna `RespostasTabela` (`total`, `pagina`, `por_pagina`, `campos_header`, `dados`).
4. Cada linha traz `resposta_id`, `timestamp_envio`, `usuario_id`, `usuario_nome` (quem coletou; `null` se anônimo) e `valores` (mapa `campo_id → valor`).

### Fluxos alternativos
- **A1 — Paginação:** `pagina`/`por_pagina` (1–500, default 20) controlam o fatiamento; `total` reflete o conjunto completo.
- **A2 — Busca:** `busca` filtra por ILIKE no texto das respostas.
- **A3 — Edição sem respostas:** retorna `total: 0` e `dados: []`, mas com `campos_header` preenchido.
- **A4 — Coletado por (campo):** respostas vindas de coleta de campo trazem `usuario_nome` do pesquisador.
- **A5 — Remover resposta:** `DELETE /edicoes/{id}/respostas/{rid}` → `204` (remove em cascata o vínculo `coletou`).

### Fluxos de exceção
- **E1 — Não autenticado / não-servidor:** sem token → `401`; `pesquisador_campo` → `403`.
- **E2 — Edição inexistente:** id inválido → `404`.
- **E3 — Remover resposta de outra edição:** `rid` não pertence à edição `{id}` → `404`.
- **E4 — Parâmetros de paginação inválidos:** `pagina` < 1 ou `por_pagina` fora de 1–500 → `422`.

## 4. Regras de negócio

- **RN01:** Apenas `servidor` consulta/remove respostas (`401`/`403` caso contrário).
- **RN02:** O resultado é paginado: `por_pagina` entre 1 e 500 (default 20); `pagina` ≥ 1.
- **RN03:** `usuario_nome` indica quem coletou a resposta; é `null` para respostas públicas anônimas.
- **RN04:** A busca (`busca`) é case-insensitive (ILIKE) sobre o texto das respostas.
- **RN05:** A remoção exige que a resposta pertença à edição informada; senão `404`.
