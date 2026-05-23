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
| Frontend | React |

## Estrutura do repositório

```
ProjetoOlimpia/
├── CLAUDE.md
├── README.md
├── architecture_modeling/       # Arquivos de modelagem (draw.io, xlsx)
├── schema/                      # Schema SQL gerado (gerado após models fechados)
├── frontend/                    # Aplicação React
└── backend/
    ├── alembic/                 # Migrations
    │   └── versions/
    ├── app/
    │   ├── main.py              # Entrada da aplicação, registra routers
    │   ├── database.py          # Conexão com o Neon (PostgreSQL)
    │   ├── dependencies.py      # get_db, get_current_user
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

Copie `.env.example` para `.env` e preencha com os valores reais (peça ao tech lead).

```
DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require
SECRET_KEY=sua_chave_secreta
```

## Como rodar local

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

A API estará disponível em `http://localhost:8000`.
Documentação automática em `http://localhost:8000/docs`.

## Regras do time

- **Nunca rodar migrations sozinho** — migrations passam pelo tech lead (P1)
- **Nunca subir o `.env`** — apenas o `.env.example` vai para o git
- **Nunca commitar direto na main** — usar branches e Pull Requests
- Cada pessoa é responsável pelos módulos descritos em `docs/arquitetura-backend.md`

## Documentação interna

- Modelo do banco → `backend/docs/modelo-banco.md`
- Requisitos do sistema → `backend/docs/requisitos.md`
- Arquitetura e divisão do time → `backend/docs/arquitetura-backend.md`
- Arquivos de modelagem originais → `architecture_modeling/`
