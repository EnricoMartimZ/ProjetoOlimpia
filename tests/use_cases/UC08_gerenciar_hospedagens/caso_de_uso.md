# UC08 — Gerenciar hospedagens (Diária Média)

> Requisito: **REQ 7** (alimentar a pesquisa de Diária Média, podendo cadastrar novas hospedagens). Este UC cobre o cadastro/gestão das hospedagens; o registro das diárias está em [UC09](../UC09_registrar_diaria/caso_de_uso.md).

## 1. Identificação

- **Nome:** Cadastrar e gerenciar hospedagens
- **Ator(es):** Servidor da Secretaria de Turismo (`servidor`).

## 2. Condições

- **Pré-condições:**
  - Ator autenticado com role `servidor`.
  - Para criar: o CNPJ ainda não está cadastrado.
- **Pós-condições:**
  - A hospedagem é persistida com seus dados fixos (incl. `url_booking`).
  - Excluir remove em cascata os registros de diária da hospedagem.

## 3. Fluxos

### Fluxo principal — Cadastrar (caminho feliz)
1. O servidor envia `POST /hospedagens` com `{ cnpj, nome_fantasia, local, categoria?, estrelas, quartos, url_booking?, foto_url? }`.
2. O sistema valida (`estrelas` ∈ 0–5, `quartos` ≥ 0, campos obrigatórios não vazios).
3. O sistema confirma que o CNPJ ainda não existe.
4. O sistema persiste e responde `201` com `HospedagemOut`.

### Fluxos alternativos
- **A1 — Categoria omitida:** sem `categoria` → assume `Hotel` (default).
- **A2 — Listar:** `GET /hospedagens` → todas, ordenadas por nome.
- **A3 — Detalhar:** `GET /hospedagens/{cnpj}` (o CNPJ vai cru na URL, `:path`, pode conter `/`).
- **A4 — Editar (parcial):** `PUT /hospedagens/{cnpj}` com campos opcionais; o CNPJ não muda.
- **A5 — Excluir:** `DELETE /hospedagens/{cnpj}` → `204`, removendo em cascata as diárias.

### Fluxos de exceção
- **E1 — Não autenticado / não-servidor:** sem token → `401`; `pesquisador_campo` → `403`.
- **E2 — CNPJ duplicado:** já existe hospedagem com o CNPJ → `409`.
- **E3 — Validação:** `estrelas` fora de 0–5, `quartos` negativo, ou campos obrigatórios vazios → `422`.
- **E4 — Hospedagem inexistente:** `GET/PUT/DELETE /hospedagens/{cnpj}` para CNPJ inexistente → `404`.

## 4. Regras de negócio

- **RN01:** O CNPJ é a chave da hospedagem; é único e **imutável** (o `PUT` não altera o CNPJ).
- **RN02:** O CNPJ pode conter `/` e vai **cru** na URL (rota `{cnpj:path}`) — sem `encodeURIComponent`.
- **RN03:** `estrelas` deve estar entre 0 e 5; `quartos` ≥ 0.
- **RN04:** `categoria` default é `Hotel`.
- **RN05:** Excluir uma hospedagem apaga em cascata todos os seus registros de diária.
- **RN06:** `url_booking` é o link fixo do Booking, guardado na hospedagem (não por coleta).
