# UC01 — Autenticar no sistema (Login)

> Requisitos: **REQ 2** (servidor faz login) e **REQ 3** (pesquisador de campo se autentica).

## 1. Identificação

- **Nome:** Autenticar no sistema
- **Ator(es):** Servidor da Secretaria de Turismo (`servidor`); Pesquisador de campo (`pesquisador_campo`)

## 2. Condições

- **Pré-condições:**
  - O usuário já possui uma conta cadastrada (e-mail + senha) — ver [UC02](../UC02_cadastrar_usuario/caso_de_uso.md).
  - A aplicação está disponível e o banco acessível.
- **Pós-condições:**
  - Em caso de sucesso, o sistema devolve um **JWT** (`access_token`) válido contendo `sub` (id), `nome`, `role` e `exp`.
  - O token permite acessar rotas protegidas conforme o `role`.
  - Nenhuma sessão de servidor é criada (autenticação stateless por token).

## 3. Fluxos

### Fluxo principal (caminho feliz)
> Vale igualmente para o **servidor** e o **pesquisador de campo** — o login é o mesmo para os dois atores; o papel só muda o **valor** do claim `role`, não os passos.

1. O ator (servidor ou pesquisador) envia `POST /auth/login` com `{ email, senha }`.
2. O sistema localiza o usuário pelo e-mail.
3. O sistema verifica a senha contra o hash armazenado (`passlib`).
4. O sistema gera um JWT assinado com `SECRET_KEY`, com claims `sub`, `nome`, `role` (o papel do usuário) e `exp`.
5. O sistema responde `200` com `{ access_token, token_type: "bearer" }`.

### Fluxos alternativos
- **A1 — Validação da aba no frontend:** a UI valida a aba selecionada (ADM/Pesquisador) contra o `role` do token; login na aba errada é recusado pelo frontend (regra de UI, não do backend).

### Fluxos de exceção
- **E1 — E-mail inexistente:** não há usuário com aquele e-mail → `401` (credenciais inválidas), sem distinguir de senha errada.
- **E2 — Senha incorreta:** hash não confere → `401`.
- **E3 — Payload inválido:** falta `email` ou `senha`, ou formato inválido → `422` (validação Pydantic).

## 4. Regras de negócio

- **RN01:** A resposta de erro de credenciais é genérica (`401`) — não revela se o e-mail existe.
- **RN02:** O claim `role` do token **deriva do papel do usuário cadastrado** (`servidor` ou `pesquisador_campo`) e determina a autorização nas demais rotas (`require_servidor`, `require_pesquisador`). O fluxo de login é idêntico para ambos — o papel é dado, não caminho.
- **RN03:** O token tem expiração (`exp`); após expirar, exige novo login.
- **RN04:** A senha nunca é armazenada nem retornada em texto puro — apenas o hash é persistido.
