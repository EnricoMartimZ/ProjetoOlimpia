# Arquitetura do Backend

## Estrutura de pastas

```
backend/
├── alembic/                  # Migrations (Alembic) + versions/
│   └── versions/
├── app/
│   ├── main.py               # Entrada da aplicação, CORS, registra os routers
│   ├── database.py           # Conexão com o Neon (PostgreSQL); lê o .env da raiz
│   ├── dependencies.py       # get_db, get_current_user, require_servidor,
│   │                         #   require_pesquisador, get_optional_user
│   │
│   ├── models/               # Tabelas do banco (SQLAlchemy)
│   │   ├── usuario.py
│   │   ├── pesquisa.py
│   │   ├── edicao.py
│   │   ├── resposta.py
│   │   ├── hospedagem.py
│   │   └── diaria_media.py
│   │
│   ├── schemas/              # Validação de entrada/saída (Pydantic)
│   │   ├── auth.py
│   │   ├── usuario.py
│   │   ├── pesquisa.py
│   │   ├── edicao.py
│   │   ├── resposta.py
│   │   ├── hospedagem.py
│   │   └── diaria_media.py
│   │
│   ├── routers/              # Endpoints da API (um módulo por recurso)
│   │   ├── auth.py           # autenticação / login
│   │   ├── usuarios.py       # cadastro e gestão de usuários
│   │   ├── pesquisas.py      # pesquisas (templates de formulário)
│   │   ├── edicoes.py        # edições de uma pesquisa
│   │   ├── respostas.py      # envio, consulta e remoção de respostas
│   │   ├── publico.py        # formulário público (sem auth)
│   │   ├── pesquisador.py    # fluxo de coleta de campo (role pesquisador_campo)
│   │   ├── hospedagem.py     # cadastro de hospedagens
│   │   └── diaria_media.py   # registros de diária média
│   │
│   └── services/             # Lógica de negócio
│       ├── auth.py           # gerar/validar JWT, hash de senha
│       ├── edicao.py         # status, campos combinados, hash, contagem
│       └── resposta.py       # validação/gravação de respostas + tabulação
│
├── docs/
│   ├── requisitos.md
│   ├── api.md                # Referência das rotas atuais (request/response)
│   └── arquitetura-backend.md
├── tests/                    # pytest (SQLite em memória) — ver CLAUDE.md
├── ../schema/migrations/     # Migrações SQL incrementais (001, 002…)
├── .env                      # fica na RAIZ do projeto — NÃO sobe no git
├── requirements.txt
├── requirements-dev.txt
└── alembic.ini
```

> O modelo de dados (entidades, atributos, relacionamentos) é descrito no schema
> SQL em `schema/` e refletido nos `models/`. A referência das rotas fica em `api.md`.

---

## Responsabilidade de cada camada

| Camada | Responsabilidade |
|---|---|
| `models/` | Define as tabelas e relacionamentos no banco via SQLAlchemy |
| `schemas/` | Valida e serializa dados de entrada e saída via Pydantic |
| `routers/` | Define as rotas HTTP, chama services ou acessa o banco via dependências |
| `services/` | Lógica de negócio — JWT/senha, status e campos de edição, validação/tabulação de respostas |
| `dependencies.py` | Injeção de acesso (ver abaixo) |

### Controle de acesso por rota

As rotas declaram o nível de acesso via dependência, sem repetir checagens de role:

| Dependência | Comportamento |
|---|---|
| _(nenhuma)_ | público — qualquer um acessa (ex.: `GET /pesquisas`, `POST /usuarios`) |
| `get_optional_user` | auth opcional — aceita token se houver (grava `usuario_id`), nunca exige (ex.: envio de resposta pública) |
| `get_current_user` | exige login válido (401 sem token) |
| `require_servidor` | 401 sem token · 403 se role ≠ `servidor` (ex.: criar pesquisa, lançar edição, consultar respostas, Diária Média) |
| `require_pesquisador` | 401 sem token · 403 se role ≠ `pesquisador_campo` (rotas `/pesquisador/*`) |

> A referência completa das rotas (paths, payloads de entrada/saída e códigos de erro) fica em
> [`api.md`](api.md). Este documento descreve apenas a arquitetura.

---

## Fluxo de uma requisição

```
HTTP request
   │
   ▼
router  ──(Depends)──►  dependencies   (get_db, controle de acesso por role)
   │
   ├──►  schema (Pydantic)             valida o corpo de entrada
   │
   ├──►  service                       lógica de negócio (quando há)
   │        │
   │        └──►  model (SQLAlchemy)   acesso ao banco
   │
   └──►  schema (Pydantic)             serializa a resposta de saída
```

Routers finos: declaram o acesso via dependência, validam a entrada com um `schema` e delegam a
lógica de negócio aos `services` (ou acessam o `model` diretamente em casos simples de CRUD).

---

## Regras importantes

- **Migrations:** apenas o P1 (tech lead) aplica migrações no Neon. As mudanças vão em
  scripts SQL incrementais e idempotentes em `schema/migrations/` (`001…`). Nunca rodar sem avisar o time.
- **`.env`:** fica na **raiz do projeto** (não em `backend/`) e nunca sobe no git.
  Compartilhar `DATABASE_URL` e `SECRET_KEY` por canal privado.
- **Branches:** nunca commitar direto na `main`. Criar branch por feature e abrir PR.
- **Testes:** rodam contra SQLite em memória (não tocam o Neon) — ver seção de testes no `CLAUDE.md`.
- **A API é o contrato com o front:** mudança que quebra o shape de uma rota é avisada antes e
  documentada em `api.md` + na tabela de endpoints do `CLAUDE.md`.
