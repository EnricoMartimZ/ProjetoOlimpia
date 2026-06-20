# UC02 — Cadastrar usuário

> Requisito: **REQ 4** (gerenciar cadastro de usuários — administradores e pesquisadores de campo).

## 1. Identificação

- **Nome:** Cadastrar usuário do sistema
- **Ator(es):** Servidor da Secretaria de Turismo (na prática quem cadastra). A rota é **pública** no backend, mas o fluxo de negócio é de gestão de acesso.

## 2. Condições

- **Pré-condições:**
  - O e-mail informado ainda não está cadastrado.
  - É informado pelo menos um `role` válido.
- **Pós-condições:**
  - Um novo usuário é persistido com a senha **hasheada** (nunca em texto puro).
  - O usuário passa a poder autenticar ([UC01](../UC01_autenticar/caso_de_uso.md)).

## 3. Fluxos

### Fluxo principal (caminho feliz)
1. O ator envia `POST /usuarios` com `{ nome, email, senha, roles: [...] }`.
2. O sistema valida o payload (e-mail válido, `roles` não vazio, valores ∈ {`servidor`, `pesquisador_campo`}).
3. O sistema verifica que o e-mail ainda não existe.
4. O sistema gera o hash da senha e persiste o usuário (as roles são guardadas como string separada por vírgula).
5. O sistema responde `201` com `UsuarioOut` (`id`, `nome`, `email`, `role`, `roles` derivado, `criado_em`) — **sem** a senha.

### Fluxos alternativos
- **A1 — Múltiplos papéis:** `roles` com mais de um valor (ex.: `["servidor", "pesquisador_campo"]`) → o usuário é criado acumulando os papéis; valores duplicados são deduplicados mantendo a ordem.
- **A2 — Cadastrar pesquisador de campo:** `roles: ["pesquisador_campo"]` → usuário habilitado apenas às rotas `/pesquisador/*`.

### Fluxos de exceção
- **E1 — E-mail já cadastrado:** já existe usuário com aquele e-mail → `409`.
- **E2 — `roles` vazio:** lista vazia → `422` ("deve ter pelo menos uma role").
- **E3 — Role inválido:** valor fora de {`servidor`, `pesquisador_campo`} → `422`.
- **E4 — E-mail inválido / campos faltando:** formato de e-mail inválido ou ausência de `nome`/`senha` → `422`.

## 4. Regras de negócio

- **RN01:** O e-mail é único no sistema (identificador de login).
- **RN02:** A senha é sempre armazenada como hash; o `UsuarioOut` jamais expõe a senha.
- **RN03:** Um usuário deve ter ao menos um papel; papéis duplicados são deduplicados.
- **RN04:** Papéis válidos: `servidor` e `pesquisador_campo`. O `role` persistido pode acumular vários (`"servidor,pesquisador_campo"`); `roles` no output é a lista derivada.
