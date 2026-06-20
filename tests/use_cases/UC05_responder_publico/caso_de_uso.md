# UC05 — Responder pesquisa pública

> Requisitos: **REQ 8** (cidadão responde Percepção do Turismo) e **REQ 9** (dono de hospedagem responde Taxa de Ocupação). Ambos via formulário público online.

## 1. Identificação

- **Nome:** Responder pesquisa pública (formulário online)
- **Ator(es):** Cidadão olimpense; Dono de meio de hospedagem (qualquer respondente anônimo). Opcionalmente um usuário logado.

## 2. Condições

- **Pré-condições:**
  - Existe uma edição de uma pesquisa do tipo `publica`.
  - A edição está **aberta** (`status == "ativa"`).
- **Pós-condições:**
  - A resposta é persistida e vinculada à edição.
  - Se o respondente estava autenticado, grava-se o `usuario_id`; caso contrário, `null` (anônimo).

## 3. Fluxos

### Fluxo principal (caminho feliz)
1. O respondente acessa o formulário via `GET /publico/edicoes/{id}`.
2. O sistema retorna `PublicEdicaoOut` (`pesquisa_nome`, `descricao`, `numero_edicao`, `aberta`, `campos`).
3. O respondente envia `POST /edicoes/{id}/respostas` com `{ respostas: [ { campo_id, atributo_* } ] }`.
4. O sistema valida que cada `campo_id` pertence à edição, sem duplicatas, e a edição está aberta.
5. O sistema persiste a resposta e responde `201` com `RespostaOut` (`id`, `edicao_id`, `timestamp_envio`, `total_campos`).

### Fluxos alternativos
- **A1 — Respondente autenticado:** há token válido no envio → grava `usuario_id` do respondente (auth opcional via `get_optional_user`).
- **A2 — Edição agendada/encerrada exibida:** `GET /publico/edicoes/{id}` retorna `aberta: false` quando fora do período (mas o formulário ainda pode ser exibido para leitura).

### Fluxos de exceção
- **E1 — Edição de campo:** a edição pertence a uma pesquisa `tipo=campo` → `GET /publico/edicoes/{id}` → `404` e `POST /edicoes/{id}/respostas` → `403` (use o fluxo do pesquisador, [UC06](../UC06_coleta_campo/caso_de_uso.md)).
- **E2 — Edição fechada:** envio em edição `encerrada` ou `agendada` → `409`.
- **E3 — Campo inválido:** `campo_id` que não pertence à edição → `422`.
- **E4 — Campo duplicado:** dois itens com o mesmo `campo_id` → `422`.
- **E5 — Lista vazia:** `respostas: []` → `422`.
- **E6 — Edição inexistente:** id inválido → `404`.

## 4. Regras de negócio

- **RN01:** Só pesquisas do tipo `publica` são respondidas por este fluxo; pesquisas `campo` são recusadas (`404`/`403`).
- **RN02:** A edição precisa estar `ativa` (dentro do período) para aceitar respostas; senão `409`.
- **RN03:** Cada `campo_id` enviado deve pertencer à edição (campos fixos + extras) e aparecer uma única vez.
- **RN04:** A lista de respostas não pode ser vazia.
- **RN05:** A autenticação é **opcional**: presença de token apenas registra `usuario_id`; ausência não impede o envio.
- **RN06:** Cada envio gera um registro de resposta com `timestamp_envio`.
