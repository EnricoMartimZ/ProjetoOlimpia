# UC04 — Lançar edição de pesquisa

> Requisito: **REQ 6** (lançar nova edição de uma pesquisa existente, podendo modificar os campos do formulário).

## 1. Identificação

- **Nome:** Lançar edição de uma pesquisa
- **Ator(es):** Servidor da Secretaria de Turismo (`servidor`). Listar edições e ver campos é público.

## 2. Condições

- **Pré-condições:**
  - A pesquisa já existe.
  - Ator autenticado com role `servidor` (para lançar).
- **Pós-condições:**
  - Uma nova edição é criada com `numero_edicao` auto-incrementado.
  - A edição combina os **campos fixos** da pesquisa com **campos extras** próprios.
  - O status da edição é derivado do período (`agendada` / `ativa` / `encerrada`).

## 3. Fluxos

### Fluxo principal (caminho feliz)
1. O servidor envia `POST /pesquisas/{id}/edicoes` com `{ data_abertura, data_fechamento?, campos_extras?: [CampoCreate] }`.
2. O sistema confirma que a pesquisa existe.
3. O sistema calcula `numero_edicao` = (maior número existente) + 1.
4. O sistema persiste a edição e os campos extras (hash por edição via `gerar_hash_campo_edicao`).
5. O sistema responde `201` com `EdicaoOut` (`numero_edicao`, datas, `total_respostas: 0`, `status` derivado).

### Fluxos alternativos
- **A1 — Sem data de fechamento:** `data_fechamento: null` → edição sem fim definido; fica `ativa` enquanto `data_abertura <= hoje`.
- **A2 — Edição agendada:** `data_abertura` no futuro → `status == "agendada"` (não aceita respostas ainda).
- **A3 — Sem campos extras:** `campos_extras` omitido/vazio → a edição usa só os campos fixos da pesquisa.
- **A4 — Listar edições:** `GET /pesquisas/{id}/edicoes` (público) lista as edições com `status` e `total_respostas`.
- **A5 — Ver campos combinados:** `GET /edicoes/{id}/campos` (público) retorna campos fixos + extras, ordenados (fixos primeiro).
- **A6 — Segunda edição:** lançar outra edição da mesma pesquisa → `numero_edicao` incrementa (2, 3, …).

### Fluxos de exceção
- **E1 — Não autenticado / não-servidor:** sem token → `401`; `pesquisador_campo` → `403`.
- **E2 — Pesquisa inexistente:** `POST /pesquisas/{id}/edicoes` com id inválido → `404`.
- **E3 — Datas inconsistentes:** `data_fechamento` < `data_abertura` → `422`.
- **E4 — Campos da edição:** `GET /edicoes/{id}/campos` para edição inexistente → `404`.

## 4. Regras de negócio

- **RN01:** `numero_edicao` é auto-incrementado por pesquisa (nunca informado pelo cliente).
- **RN02:** O status da edição é **derivado** do período: `agendada` (`data_abertura > hoje`), `encerrada` (`data_fechamento < hoje`), senão `ativa`.
- **RN03:** `data_fechamento` não pode ser anterior à `data_abertura`.
- **RN04:** Os campos do formulário da edição = campos fixos da pesquisa (primeiro) + campos extras da edição, ambos ordenados por `ordem`.
- **RN05:** Lançar edição não altera os campos base da pesquisa — os extras pertencem à edição.
