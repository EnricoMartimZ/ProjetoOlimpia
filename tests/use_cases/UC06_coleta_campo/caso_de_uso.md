# UC06 — Coletar resposta de pesquisa de campo

> Requisitos: **REQ 3** (pesquisador se autentica para registrar) e **REQ 10** (registrar respostas coletadas presencialmente com turistas — Demanda Turística).

## 1. Identificação

- **Nome:** Coletar e registrar resposta de pesquisa de campo
- **Ator(es):** Pesquisador de campo (`pesquisador_campo`), autenticado.

## 2. Condições

- **Pré-condições:**
  - Existe uma pesquisa do tipo `campo` com edição **aberta** (`ativa`).
  - O ator está autenticado com role `pesquisador_campo`.
- **Pós-condições:**
  - A resposta coletada é persistida e **vinculada ao `usuario_id` do pesquisador** (rastreabilidade) e à edição.

## 3. Fluxos

### Fluxo principal (caminho feliz)
1. O pesquisador faz login ([UC01](../UC01_autenticar/caso_de_uso.md)).
2. `GET /pesquisador/edicoes` → lista as edições **abertas** de pesquisas `tipo=campo`.
3. O pesquisador escolhe uma edição e abre o formulário: `GET /pesquisador/edicoes/{id}` → `PublicEdicaoOut`.
4. Em campo, preenche em nome do turista e envia `POST /pesquisador/edicoes/{id}/respostas` com `{ respostas: [...] }`.
5. O sistema valida (campos pertencem à edição, sem duplicatas, edição aberta) e grava a resposta com `usuario_id` do pesquisador.
6. O sistema responde `201` com `RespostaOut`.

### Fluxos alternativos
- **A1 — Nenhuma edição aberta:** `GET /pesquisador/edicoes` retorna lista vazia (não há coleta disponível).
- **A2 — Múltiplas coletas:** o pesquisador registra várias respostas na mesma edição (uma por turista), todas vinculadas a ele.

### Fluxos de exceção
- **E1 — Servidor tentando acessar:** role `servidor` em rota `/pesquisador/*` → `403`.
- **E2 — Anônimo:** sem token em `/pesquisador/*` → `401`.
- **E3 — Edição não é de campo:** `GET`/`POST /pesquisador/edicoes/{id}` para edição de pesquisa `publica` → `404`.
- **E4 — Edição fechada:** envio em edição `encerrada`/`agendada` → `409`.
- **E5 — Campo inválido/duplicado/lista vazia:** → `422`.
- **E6 — Edição inexistente:** id inválido → `404`.

## 4. Regras de negócio

- **RN01:** Apenas role `pesquisador_campo` acessa as rotas `/pesquisador/*` (`servidor` → 403, anônimo → 401).
- **RN02:** A coleta é **sempre vinculada ao pesquisador autenticado** (`usuario_id`), garantindo rastreabilidade.
- **RN03:** Só edições de pesquisas `tipo=campo` são acessíveis por este fluxo; pesquisas `publica` → `404`.
- **RN04:** `GET /pesquisador/edicoes` lista somente edições **abertas** (`ativa`).
- **RN05:** Mesmas validações de resposta do fluxo público (campo pertence à edição, sem duplicata, lista não vazia, edição aberta).
