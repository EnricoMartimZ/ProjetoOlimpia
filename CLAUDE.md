# CLAUDE.md — Projeto Olímpia (MERX)

Arquivo de contexto para o Claude Code. Leia antes de qualquer ação no repositório.

## O que é o projeto

Sistema de Gestão de Pesquisas para o Turismo de Olímpia, desenvolvido para a Secretaria de Turismo. Permite criar pesquisas, lançar edições, coletar respostas do público e gerar dados para análise.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | FastAPI (Python) |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| Banco de dados | PostgreSQL (Neon — cloud) |
| Autenticação | JWT (python-jose + passlib) |
| Frontend | React + Vite + TypeScript |
| Estilo | Tailwind CSS + shadcn/ui + MUI |
| Roteamento | react-router v7 |

## Estrutura do repositório

```
ProjetoOlimpia/
├── CLAUDE.md
├── README.md
├── architecture_modeling/       # Arquivos de modelagem (draw.io, xlsx)
├── schema/                      # Schema SQL gerado
├── front/                       # Aplicação React
│   ├── .env.local               # NÃO sobe no git (VITE_API_URL)
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx          # Raiz: AuthProvider > AppStoreProvider > RouterProvider
│   │   │   ├── routes.tsx       # Rotas + guards (RequireRole)
│   │   │   ├── pages/           # Páginas da aplicação
│   │   │   ├── components/      # Componentes reutilizáveis + shadcn/ui
│   │   │   ├── context/
│   │   │   │   ├── AuthContext.tsx   # Auth: token JWT, user, login(), logout()
│   │   │   │   └── AppStore.tsx      # Estado local (pesquisas, respostas — ainda em localStorage)
│   │   │   └── data/
│   │   │       └── mockData.ts  # Dados mock (usados enquanto API não está integrada)
│   │   ├── services/
│   │   │   └── api.ts           # Funções de chamada à API (login, cadastrar, ...)
│   │   ├── types/               # Tipos TypeScript (Research, Edition, ResponseRow, Hotel)
│   │   └── lib/
│   │       └── constants.ts     # Cores da marca, utilitários
└── backend/
    ├── alembic/                 # Migrations
    │   └── versions/
    ├── app/
    │   ├── main.py              # Entrada da aplicação, CORS, registra routers
    │   ├── database.py          # Conexão com o Neon (PostgreSQL)
    │   ├── dependencies.py      # get_db, get_current_user (JWT)
    │   ├── models/              # Tabelas do banco (SQLAlchemy)
    │   ├── schemas/             # Validação entrada/saída (Pydantic)
    │   ├── routers/             # Endpoints da API
    │   └── services/            # Lógica de negócio
    ├── docs/
    │   ├── modelo-banco.md      # Resumo do DER
    │   ├── requisitos.md        # Requisitos do sistema
    │   └── arquitetura-backend.md
    ├── .env                     # NÃO sobe no git
    ├── .env.example             # Template do .env
    ├── requirements.txt
    └── alembic.ini
```

## Variáveis de ambiente

### Backend — `backend/.env`
Copie `.env.example` para `.env` e preencha com os valores reais (peça ao tech lead).
```
DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require
SECRET_KEY=sua_chave_secreta
```

### Frontend — `front/.env.local`
```
VITE_API_URL=http://localhost:8000
```

## Como rodar local

**Terminal 1 — Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

A API estará disponível em `http://localhost:8000`.
Documentação automática em `http://localhost:8000/docs`.

**Terminal 2 — Frontend**
```bash
cd front
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

## Autenticação

- O backend emite JWT via `POST /auth/login` com `{ email, senha }`
- O token contém: `sub` (id), `nome`, `role`, `exp`
- Roles existentes: `"servidor"` (admin) e `"pesquisador_campo"`
- O frontend armazena o token em `localStorage` via `AuthContext`
- Rotas protegidas usam o guard `RequireRole` em `routes.tsx`
- A aba selecionada no login (ADM / Pesquisador) é validada contra o role do token — login na aba errada retorna erro

## Endpoints implementados no backend

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/auth/login` | Gera token JWT | Não |
| POST | `/usuarios` | Cria usuário | Não |
| GET | `/pesquisas` | Lista pesquisas (status + edicao_atual_id derivados) | Não |
| POST | `/pesquisas` | Cria pesquisa + campos base | servidor |
| GET | `/pesquisas/{id}` | Detalha pesquisa com campos | Não |
| PUT | `/pesquisas/{id}` | Edita pesquisa (substitui campos) | servidor |
| DELETE | `/pesquisas/{id}` | Exclui pesquisa em cascata | servidor |
| GET | `/pesquisas/{id}/edicoes` | Lista edições da pesquisa | Não |
| POST | `/pesquisas/{id}/edicoes` | Lança edição (auto-incrementa número) | servidor |
| GET | `/edicoes/{id}/campos` | Campos fixos + extras da edição | Não |
| GET | `/publico/edicoes/{id}` | Formulário público da edição | Não |
| POST | `/edicoes/{id}/respostas` | Envia resposta (grava usuario_id se logado) | Opcional |
| GET | `/edicoes/{id}/respostas` | Respostas tabuladas (paginação + busca) | servidor |
| DELETE | `/edicoes/{id}/respostas/{rid}` | Remove uma resposta | servidor |

> Mapa completo das rotas (implementadas + planejadas) em `backend/docs/rotas.md`.
> Sequência de integração incremental em `TASKS.md` (raiz).

## Estado da integração front ↔ back

- **Integrado:** login, cadastro, guards por role, **CRUD de pesquisas**, **lançar edição + link público**, **formulário público (carrega e envia respostas)**, **consultar respostas (tabela dinâmica, busca, paginação, delete, CSV, novo registro)**
- **Pendente:** diária média (Task 5), pesquisador de campo (Task 6), dashboards (Task 7)

## Regras do time

- **Nunca rodar migrations sozinho** — migrations passam pelo tech lead (P1)
- **Nunca subir o `.env` ou `.env.local`** — apenas o `.env.example` vai para o git
- **Nunca commitar direto na main** — usar branches e Pull Requests
- Cada pessoa é responsável pelos módulos descritos em `docs/arquitetura-backend.md`

## Documentação interna

- Modelo do banco → `backend/docs/modelo-banco.md`
- Requisitos do sistema → `backend/docs/requisitos.md`
- Arquitetura e divisão do time → `backend/docs/arquitetura-backend.md`
- Arquivos de modelagem originais → `architecture_modeling/`
