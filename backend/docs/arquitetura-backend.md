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
│   ├── routers/              # Endpoints da API
│   │   ├── auth.py           # POST /auth/login
│   │   ├── usuarios.py       # POST /usuarios
│   │   ├── pesquisas.py      # CRUD de pesquisas + edições
│   │   ├── edicoes.py        # campos da edição
│   │   ├── respostas.py      # envio + consulta tabulada + remoção
│   │   ├── publico.py        # formulário público (sem auth)
│   │   ├── pesquisador.py    # fluxo de coleta de campo (role pesquisador_campo)
│   │   ├── hospedagem.py     # CRUD de hospedagem (Diária Média — REQ 6)
│   │   └── diaria_media.py   # registros de diária + pendentes (REQ 6)
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

---

## Endpoints

Detalhes e exemplos de payload em `api.md`. Resumo por grupo:

### Autenticação
```
POST   /auth/login
```

### Usuários
```
POST   /usuarios                      # cadastro (público)
```

### Pesquisas e edições
```
GET    /pesquisas                     # lista (status + edicao_atual_id + tipo derivados)
POST   /pesquisas                     # servidor — cria pesquisa + campos base
GET    /pesquisas/{id}                # detalhe com campos
PUT    /pesquisas/{id}                # servidor — substitui campos
DELETE /pesquisas/{id}                # servidor — cascata
GET    /pesquisas/{id}/edicoes        # lista edições
POST   /pesquisas/{id}/edicoes        # servidor — lança edição (auto-incrementa)
GET    /edicoes/{id}/campos           # campos fixos + extras, ordenados
```

### Respostas
```
POST   /edicoes/{id}/respostas        # envio público (auth opcional; grava usuario_id)
GET    /edicoes/{id}/respostas        # servidor — tabulado, paginado, com busca
DELETE /edicoes/{id}/respostas/{rid}  # servidor — remoção manual
```

### Público (sem autenticação)
```
GET    /publico/edicoes/{id}          # formulário da edição (recusa edições de campo)
```

### Pesquisador de campo (role pesquisador_campo)
```
GET    /pesquisador/edicoes           # edições abertas de pesquisas tipo `campo`
GET    /pesquisador/edicoes/{id}      # formulário de uma edição de campo
POST   /pesquisador/edicoes/{id}/respostas  # coleta vinculada ao usuario_id
```

### Diária Média — REQ 6 (servidor)
```
GET    /hospedagens                   # lista hospedagens
POST   /hospedagens                   # cadastra
GET    /hospedagens/{cnpj}            # detalha (cnpj é :path)
PUT    /hospedagens/{cnpj}            # edita
DELETE /hospedagens/{cnpj}           # exclui (cascata nas diárias)
GET    /diarias/pendentes             # hospedagens sem diária na data (default hoje)
GET    /diarias                       # lista registros (filtro cnpj/data)
POST   /diarias                       # registra diária (1 por hospedagem+data)
DELETE /diarias/{id}                  # remove um registro
```

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
