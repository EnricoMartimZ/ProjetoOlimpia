# Projeto Olímpia (MERX)

Sistema de Gestão de Pesquisas para o Turismo de Olímpia, desenvolvido para a Secretaria de Turismo.
Permite criar pesquisas, lançar edições, coletar respostas (do público ou por pesquisadores de campo)
e consultar os dados.

## Stack

- **Backend:** FastAPI + SQLAlchemy + Alembic · PostgreSQL (Neon) · JWT (python-jose + bcrypt)
- **Frontend:** React + Vite + TypeScript · Tailwind + shadcn/ui + MUI · react-router v7

## Como rodar local

Pré-requisitos: Python 3.9+, Node 18+, e um `.env` na **raiz do projeto** com `DATABASE_URL` e `SECRET_KEY`
(peça ao tech lead). O `front/` usa `front/.env.local` com `VITE_API_URL=http://localhost:8000`.

```bash
# Terminal 1 — backend
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload                       # API em http://localhost:8000

# Terminal 2 — frontend
cd front
npm install
npm run dev                                         # App em http://localhost:5173
```

- Swagger interativo: `http://localhost:8000/docs`
- Testes do backend: `cd backend && pip install -r requirements-dev.txt && pytest tests/`

## Autenticação

`POST /auth/login` com `{ email, senha }` retorna um JWT (`access_token`). Envie-o nas rotas protegidas
no header `Authorization: Bearer <token>`. O token carrega `sub` (id), `nome`, `role` e `exp`.

Papéis (`role`):
- **`servidor`** — admin da Secretaria: cria/edita pesquisas e edições, consulta respostas.
- **`pesquisador_campo`** — coleta presencial de pesquisas do tipo `campo`. Não cria pesquisas.

## Tipos de pesquisa

A coluna `pesquisa.tipo` define como uma pesquisa é respondida:
- **`publica`** — qualquer pessoa responde pelo link público `/pesquisa/{edicaoId}` (sem login).
- **`campo`** — coletada presencialmente por um pesquisador de campo autenticado; a resposta fica
  vinculada ao usuário que coletou. O formulário de campo **não** é exposto pela rota pública.

## API — rotas atuais

Base URL local: `http://localhost:8000`. Referência detalhada (request/response de cada rota) em
[`backend/docs/api.md`](backend/docs/api.md).

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/auth/login` | Gera token JWT | Público |
| POST | `/usuarios` | Cria usuário | Público |
| GET | `/pesquisas` | Lista pesquisas (status, tipo, edição atual derivados) | Público |
| POST | `/pesquisas` | Cria pesquisa + campos base | `servidor` |
| GET | `/pesquisas/{id}` | Detalha pesquisa com campos | Público |
| PUT | `/pesquisas/{id}` | Edita pesquisa (substitui campos) | `servidor` |
| DELETE | `/pesquisas/{id}` | Exclui pesquisa em cascata | `servidor` |
| GET | `/pesquisas/{id}/edicoes` | Lista edições da pesquisa | Público |
| POST | `/pesquisas/{id}/edicoes` | Lança edição (auto-incrementa número) | `servidor` |
| GET | `/edicoes/{id}/campos` | Campos fixos + extras da edição | Público |
| GET | `/publico/edicoes/{id}` | Formulário público (404 para pesquisa `campo`) | Público |
| POST | `/edicoes/{id}/respostas` | Envia resposta pública (403 para pesquisa `campo`) | Opcional |
| GET | `/edicoes/{id}/respostas` | Respostas tabuladas (paginação, busca, `usuario_nome`) | `servidor` |
| DELETE | `/edicoes/{id}/respostas/{rid}` | Remove uma resposta | `servidor` |
| GET | `/pesquisador/edicoes` | Edições abertas de pesquisas `campo` | `pesquisador_campo` |
| GET | `/pesquisador/edicoes/{id}` | Formulário de uma edição de campo | `pesquisador_campo` |
| POST | `/pesquisador/edicoes/{id}/respostas` | Coleta de campo (vincula `usuario_id`) | `pesquisador_campo` |

## Estrutura e contexto

- Contexto do projeto e regras do time: [`CLAUDE.md`](CLAUDE.md)
- Modelo do banco: [`backend/docs/modelo-banco.md`](backend/docs/modelo-banco.md)
- Requisitos: [`backend/docs/requisitos.md`](backend/docs/requisitos.md)
- Arquitetura do backend: [`backend/docs/arquitetura-backend.md`](backend/docs/arquitetura-backend.md)
- Sequência de tarefas: [`TASKS.md`](TASKS.md)
