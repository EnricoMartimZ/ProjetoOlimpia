# UC03 — Criar e gerenciar pesquisa

> Requisito: **REQ 5** (criar pesquisa definindo nome e campos a partir dos tipos disponíveis). Inclui detalhar/editar/excluir como gestão da mesma entidade.

## 1. Identificação

- **Nome:** Criar e gerenciar pesquisa
- **Ator(es):** Servidor da Secretaria de Turismo (`servidor`). Leitura (`GET`) é pública.

## 2. Condições

- **Pré-condições:**
  - Ator autenticado com role `servidor` (para criar/editar/excluir).
  - O nome da pesquisa não colide com outra existente.
- **Pós-condições:**
  - Uma pesquisa é criada com seus **campos base** e `tipo` (`publica` | `campo`).
  - A pesquisa nasce com status derivado `rascunho` (sem edições).

## 3. Fluxos

### Fluxo principal — Criar (caminho feliz)
1. O servidor envia `POST /pesquisas` com `{ nome, descricao, tipo?, campos: [CampoCreate] }`.
2. O sistema valida o payload; cada campo tem `tipo` ∈ {`texto`, `texto_longo`, `numero`, `multipla_escolha`, `data`, `escala`, `sim_nao`}.
3. O sistema verifica que o `nome` é único.
4. O sistema persiste a pesquisa + campos (gerando `hash_pergunta`, `ordem`).
5. O sistema responde `201` com `PesquisaOut` (`status: "rascunho"`, `total_edicoes: 0`, `edicao_atual_id: null`, `campos`).

### Fluxos alternativos
- **A1 — Tipo omitido:** sem `tipo` → assume `publica` (default).
- **A2 — Pesquisa de campo:** `tipo: "campo"` → pesquisa destinada à coleta presencial ([UC06](../UC06_coleta_campo/caso_de_uso.md)).
- **A3 — Detalhar:** `GET /pesquisas/{id}` (público) devolve a pesquisa com `campos`.
- **A4 — Listar:** `GET /pesquisas` (público) devolve resumo com `status`, `total_edicoes`, `edicao_atual_id`, `tipo` derivados.
- **A5 — Editar:** `PUT /pesquisas/{id}` com campos opcionais; se `campos` vier, **substitui** todos os campos base.
- **A6 — Excluir:** `DELETE /pesquisas/{id}` remove em cascata (campos, edições, respostas) → `204`.

### Fluxos de exceção
- **E1 — Não autenticado / não-servidor:** `POST/PUT/DELETE` sem token → `401`; com role `pesquisador_campo` → `403`.
- **E2 — Nome duplicado:** já existe pesquisa com o mesmo nome → `409` (no create e no update).
- **E3 — Pesquisa inexistente:** `GET/PUT/DELETE /pesquisas/{id}` para id inexistente → `404`.
- **E4 — Tipo de campo inválido:** `tipo` de algum campo fora da lista permitida → `422`.

## 4. Regras de negócio

- **RN01:** O `nome` da pesquisa é único.
- **RN02:** O `tipo` da pesquisa (`publica`/`campo`) define o canal de resposta e é default `publica`.
- **RN03:** O status da pesquisa é **derivado**: `rascunho` (sem edições), `ativa`, `encerrada`.
- **RN04:** Editar com `campos` **substitui** o conjunto de campos base (não faz merge).
- **RN05:** Excluir uma pesquisa apaga em cascata seus campos, edições e respostas.
- **RN06:** Os campos seguem os tipos suportados (`FieldType`); cada campo pode ser obrigatório e ter `opcoes` (para `multipla_escolha`).
