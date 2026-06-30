# Projeto Olímpia

Sistema de Gestão de Pesquisas para o Turismo de Olímpia, desenvolvido para a Secretaria de Turismo.
Permite criar pesquisas, lançar edições, coletar respostas (do público ou por pesquisadores de campo)
e consultar os dados.

## Stack

- **Backend:** FastAPI + SQLAlchemy + Alembic · PostgreSQL (Neon) · JWT
- **Frontend:** React + Vite + TypeScript · Tailwind + shadcn/ui + MUI · react-router v7

## Como rodar local

Pré-requisitos: Python 3.9+, Node 18+, e um `.env` na **raiz do projeto** com `DATABASE_URL` e
`SECRET_KEY` (peça ao tech lead). O frontend usa `front/.env.local` com `VITE_API_URL=http://localhost:8000`.

```bash
# Terminal 1 — backend
cd backend
python3 -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload                       # API em http://localhost:8000

# Terminal 2 — frontend
cd front
npm install
npm run dev                                         # App em http://localhost:5173
```

- Swagger interativo: `http://localhost:8000/docs`
- Testes do backend: `cd backend && pip install -r requirements-dev.txt && pytest tests/`

## Organização do repositório

```
ProjetoOlimpia/
├── backend/        # API FastAPI (models, schemas, routers, services, migrations)
│   └── docs/       # Documentação do backend (API, arquitetura, requisitos)
├── front/          # Aplicação React (páginas, componentes, services/api.ts)
├── schema/         # Schema SQL e migrações incrementais
├── tests/          # Testes do sistema (pytest) + casos de uso
└── architecture_modeling/   # Arquivos de modelagem (draw.io, xlsx)
```

## Documentação

- Referência da API (rotas, request/response): [`backend/docs/api.md`](backend/docs/api.md)
- Arquitetura do backend: [`backend/docs/arquitetura-backend.md`](backend/docs/arquitetura-backend.md)
