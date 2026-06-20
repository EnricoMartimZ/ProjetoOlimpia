# UC09 — Registrar diária média

> Requisito: **REQ 7** (alimentar a pesquisa de Diária Média inserindo os dados coletados do Booking). Este UC cobre o registro das diárias por hospedagem/data; o cadastro das hospedagens está em [UC08](../UC08_gerenciar_hospedagens/caso_de_uso.md).

## 1. Identificação

- **Nome:** Registrar diária média de uma hospedagem
- **Ator(es):** Servidor da Secretaria de Turismo (`servidor`).

## 2. Condições

- **Pré-condições:**
  - Ator autenticado com role `servidor`.
  - A hospedagem do registro já existe.
  - Não há ainda registro para aquela hospedagem **na mesma data**.
- **Pós-condições:**
  - Um registro de diária (`data` + `preco`) é persistido e vinculado à hospedagem.
  - A hospedagem deixa de aparecer como "pendente" naquela data.

## 3. Fluxos

### Fluxo principal (caminho feliz)
1. O servidor consulta as pendências: `GET /diarias/pendentes?data=YYYY-MM-DD` (default hoje) → hospedagens sem diária na data.
2. O servidor consulta o Booking e envia `POST /diarias` com `{ hospedagem_cnpj, data, preco }`.
3. O sistema valida (`preco` ≥ 0, hospedagem existe, sem registro duplicado na data).
4. O sistema persiste e responde `201` com `DiariaMediaOut` (inclui `nome_fantasia` via join).

### Fluxos alternativos
- **A1 — Data default (hoje):** `GET /diarias/pendentes` sem `data` usa a data de hoje.
- **A2 — Listar registros:** `GET /diarias` com filtros opcionais `hospedagem_cnpj` e/ou `data`; mais recentes primeiro.
- **A3 — Registrar mesma hospedagem em datas diferentes:** permitido (a unicidade é por hospedagem **+ data**).
- **A4 — Remover registro:** `DELETE /diarias/{id}` → `204`; a hospedagem volta a constar como pendente naquela data.

### Fluxos de exceção
- **E1 — Não autenticado / não-servidor:** sem token → `401`; `pesquisador_campo` → `403`.
- **E2 — Hospedagem inexistente:** `hospedagem_cnpj` não cadastrado → `404`.
- **E3 — Registro duplicado:** já existe diária para a hospedagem naquela data → `409`.
- **E4 — Preço negativo:** `preco` < 0 → `422`.
- **E5 — Remover registro inexistente:** `DELETE /diarias/{id}` com id inválido → `404`.

## 4. Regras de negócio

- **RN01:** Apenas `servidor` registra/lista/remove diárias (`401`/`403` caso contrário).
- **RN02:** Há **no máximo um** registro de diária por hospedagem **+ data** (unicidade) → duplicata é `409`.
- **RN03:** `preco` deve ser ≥ 0.
- **RN04:** O registro só pode referenciar uma hospedagem existente.
- **RN05:** `GET /diarias/pendentes` lista as hospedagens **sem** diária na data informada (default hoje).
- **RN06:** A diária guarda apenas o que varia por coleta (`data`, `preco`); os dados fixos ficam na hospedagem.
