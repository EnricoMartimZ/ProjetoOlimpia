# CLAUDE.md — Projeto Olímpia

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
├── tests/                       # Testes do sistema (raiz — não só do backend)
│   ├── use_cases/               # Casos de uso + cenários + casos_de_uso.xlsx
│   ├── conftest.py              # Fixtures pytest (SQLite em memória)
│   └── test_*.py                # Testes automatizados (unit + integração)
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
    │   ├── database.py          # Conexão com o Neon (PostgreSQL); lê .env da raiz
    │   ├── dependencies.py      # get_db; get_current_user / require_servidor / require_pesquisador / get_optional_user
    │   ├── models/              # Tabelas do banco (SQLAlchemy) — pesquisa.tipo, resposta.usuario, etc.
    │   ├── schemas/             # Validação entrada/saída (Pydantic)
    │   ├── routers/             # Endpoints — auth, usuarios, pesquisas, edicoes, publico, respostas, pesquisador
    │   └── services/            # Lógica de negócio — edicao.py, resposta.py, auth.py
    ├── docs/
    │   ├── api.md               # Referência das rotas (request/response)
    │   ├── requisitos.md        # Requisitos do sistema
    │   └── arquitetura-backend.md
    ├── requirements.txt
    ├── requirements-dev.txt     # deps só de teste (pytest, httpx)
    └── alembic.ini
# .env fica na RAIZ do projeto (ProjetoOlimpia/.env), não em backend/
```

## Variáveis de ambiente

### Backend — `.env` (na **raiz do projeto**)
O `database.py` usa `load_dotenv()` (`find_dotenv()`), que sobe os diretórios e
acha o `.env` em `ProjetoOlimpia/.env` — **não** em `backend/.env`. Peça os valores
reais ao tech lead.
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
- Roles existentes: `"servidor"` (admin da Secretaria — cria pesquisas/edições, consulta dados) e `"pesquisador_campo"` (coleta presencial de pesquisas do tipo `campo`; **não** cria pesquisas)
- O frontend armazena o token em `localStorage` via `AuthContext`
- Rotas protegidas usam o guard `RequireRole` em `routes.tsx`
- A aba selecionada no login (ADM / Pesquisador) é validada contra o role do token — login na aba errada retorna erro

## Endpoints implementados no backend

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/auth/login` | Gera token JWT | Não |
| POST | `/usuarios` | Cria usuário | Não |
| GET | `/pesquisas` | Lista pesquisas (status + edicao_atual_id + tipo) | Não |
| POST | `/pesquisas` | Cria pesquisa + campos base (campo `tipo`: publica/campo) | servidor |
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
| GET | `/pesquisador/edicoes` | Edições abertas de pesquisas tipo `campo` | pesquisador_campo |
| GET | `/pesquisador/edicoes/{id}` | Formulário de uma edição de campo | pesquisador_campo |
| POST | `/pesquisador/edicoes/{id}/respostas` | Coleta de campo (vincula `usuario_id`) | pesquisador_campo |
| GET | `/hospedagens` | Lista hospedagens (Diária Média) | servidor |
| POST | `/hospedagens` | Cadastra hospedagem | servidor |
| GET | `/hospedagens/{cnpj}` | Detalha hospedagem (`cnpj` é `:path`) | servidor |
| PUT | `/hospedagens/{cnpj}` | Edita hospedagem | servidor |
| DELETE | `/hospedagens/{cnpj}` | Exclui hospedagem (cascata nas diárias) | servidor |
| GET | `/diarias/pendentes` | Hospedagens sem diária na data (default hoje) | servidor |
| GET | `/diarias` | Lista registros (filtro `hospedagem_cnpj`/`data`) | servidor |
| POST | `/diarias` | Registra diária (1 por hospedagem+data) | servidor |
| DELETE | `/diarias/{id}` | Remove um registro de diária | servidor |

> Referência precisa das rotas atuais (request/response) em `backend/docs/api.md`.
> Sequência de integração incremental em `TASKS.md` (raiz).

## Tipos de pesquisa e coleta de campo

A coluna `pesquisa.tipo` (`publica` | `campo`, default `publica`) define como a pesquisa é respondida:

- **`publica`** — respondida por qualquer pessoa pelo link `/pesquisa/{edicaoId}`. Sem login (mas grava `usuario_id` se houver token). Endpoints: `GET /publico/edicoes/{id}` + `POST /edicoes/{id}/respostas`.
- **`campo`** — coletada presencialmente por um **pesquisador de campo autenticado**. O servidor cria a pesquisa escolhendo o tipo; o pesquisador loga, lista as edições de campo abertas, abre o formulário e envia a resposta, que fica **vinculada ao `usuario_id` dele**.

**Regras de acesso (aplicadas no backend):**
- Rotas `/pesquisador/*` exigem role `pesquisador_campo` (`require_pesquisador`): servidor → 403, anônimo → 401.
- O fluxo público recusa pesquisas de campo: `POST /edicoes/{id}/respostas` → 403 e `GET /publico/edicoes/{id}` → 404 quando a edição é de uma pesquisa `campo` (não expõe o formulário publicamente).
- Na consulta do admin (`GET /edicoes/{id}/respostas`) cada linha traz `usuario_nome` (quem coletou) + `timestamp_envio`; `null` para respostas públicas anônimas.

> Migração aplicada no Neon: `schema/migrations/003_add_pesquisa_tipo.sql`.

## Frontend — páginas, rotas e integração

Raiz: `App.tsx` → `AuthProvider` > `AppStoreProvider` > `RouterProvider`. Guard `RequireRole` em `routes.tsx`.
`AppStore` (localStorage + `mockData.ts`) é legado e está sendo esvaziado conforme as páginas integram com a API.

| Rota | Página | Role | Estado |
|---|---|---|---|
| `/` | `LoginPage` | — | ✅ Integrado (`POST /auth/login`) |
| `/cadastro` | `CadastroPage` | — | ✅ Integrado (`POST /usuarios`) |
| `/admin` | `DashboardPage` | servidor | ⚠️ Mock (KPIs/gráficos do `mockData` — Task 7) |
| `/admin/adicionar-pesquisa` | `AdicionarPesquisaPage` | servidor | ✅ Integrado — CRUD de pesquisas, **seletor de tipo publica/campo**, lançar edição, links públicos |
| `/admin/consultar` | `ConsultarPage` | servidor | ✅ Integrado — tabela dinâmica, busca, paginação, delete, CSV, novo registro, **coluna "Coletado por"** |
| `/admin/diaria-media` | `DiariaMediaPage` | servidor | ✅ Integrado — abas Pendentes/Hospedagens/Registros; CRUD de hospedagem + registro de diária (REQ 6) |
| `/pesquisador` | `ResearcherDashboard` | pesquisador_campo | ⚠️ Mock (stats hardcoded; nome vem do `AuthContext` via layout) |
| `/pesquisador/responder` | `ResponderPage` | pesquisador_campo | ✅ Integrado — lista edições de campo abertas, carrega form, envia coleta vinculada ao usuário logado |
| `/pesquisa/:id` | `PublicSurveyPage` | — | ✅ Integrado — form público; recusa edições de campo |
| `/dados-publicos` | `PublicStatsPage` | — | ⚠️ Mock (Task 7) |

> **Removido:** a rota `/pesquisador/nova-pesquisa` e a página `NovaPesquisaPage` — pesquisador de campo **não cria pesquisas** (UI removida; backend já barrava via `require_servidor`).

**`services/api.ts`** centraliza as chamadas. Helper `request()` injeta `Authorization: Bearer` automático. Funções: `login`, `cadastrar`, `getPesquisas`/`getPesquisa`/`createPesquisa`/`updatePesquisa`/`deletePesquisa` (incluem `tipo`), `getEdicoes`/`launchEdicao`, `getPublicEdicao`, `submitResposta`, `getRespostas`/`deleteResposta`, e o fluxo de campo `getEdicoesCampo`/`getEdicaoCampoForm`/`submitRespostaCampo`.

## Testes

A pasta `tests/` fica na **raiz do projeto** (compartilhada — cobre o sistema todo, não só o backend).

### Casos de uso e cenários — `tests/use_cases/`

Documentação dos casos de uso (1 por funcionalidade/requisito) e cenários de teste derivados,
servindo de base para os testes automatizados. Cada caso tem sua pasta com `caso_de_uso.md`
(identificação, condições, fluxos, regras de negócio) e `cenarios_de_teste.md`. Há ainda
`casos_de_uso.xlsx` (síntese em planilha) gerado por `_gerar_planilha.py`. Índice em `tests/use_cases/README.md`.

### Testes automatizados (backend) — **pytest**

Rodam contra **SQLite em memória** (não tocam o Neon). Para isso, `Campo.opcoes` usa
`ARRAY(String).with_variant(JSON, "sqlite")` — mesmo schema nos dois bancos. Como o `conftest`
importa `app.*`, rode com o `backend` no `PYTHONPATH`:

```bash
cd backend
source venv/bin/activate
pip install -r requirements-dev.txt        # pytest + httpx (deps só de teste)
PYTHONPATH=. pytest ../tests/              # unit + integração
```

- `conftest.py` — engine SQLite (StaticPool), override de `get_db`, fixtures `client`, `servidor`, `pesquisador`.
- `test_unit.py` — validações de schema (`tipo`), helpers de status/tipo de edição, dependências de acesso, token JWT.
- `test_pesquisas_campo.py` — integração: criar pesquisa de campo, authz (`pesquisador_campo` vs `servidor` vs anônimo), resposta vinculada ao pesquisador + edição, bloqueio do fluxo público para campo, nome do coletor na consulta.
- `test_diaria_media.py` — integração REQ 6: CRUD de hospedagem (authz, CNPJ duplicado, estrelas inválidas, cascata), registro de diária (unicidade hospedagem+data, preço negativo, filtros) e pendentes por data.

## Regras do time

Time atual: **3 pessoa no backend** (dona de `backend/`) e **3 pessoa no frontend** (dona de `front/`).

### Donos de cada área
- **Backend** → tudo em `backend/` (models, schemas, routers, services, migrations).
- **Frontend** → tudo em `front/` (páginas, componentes, `services/api.ts`).
- Arquivos de raiz (`CLAUDE.md`, `TASKS.md`, `docs/`, `schema/`) são compartilhados — quem mexer avisa o outro.

### A API é o contrato (a regra que evita pisar no pé do outro)
A fronteira entre back e front é o **contrato da API**: as rotas + os formatos de entrada/saída.
A fonte da verdade é a tabela de endpoints neste arquivo + `backend/docs/api.md`, e o espelho no front é `front/src/services/api.ts`.

- **Backend não edita `front/` para "fazer funcionar".** Se uma mudança no back exige mudança no front, o trabalho no front é da pessoa do front.
- **Prefira mudanças compatíveis:** adicionar campo/rota nova em vez de renomear/remover. Campo novo opcional não quebra o front.
- **Mudança que quebra o contrato** (renomear/remover campo, mudar status code, mudar shape): (1) avise a pessoa do front **antes**; (2) atualize a tabela de endpoints + `backend/docs/api.md`; (3) deixe o ajuste do `api.ts`/telas para o front, ou faça em PR separado que ela revisa.
- Quando o back terminar uma rota nova, o "handoff" é: documentar o contrato (request/response) e avisar — não implementar a tela.

### Git
- **Nunca commitar direto na main** — sempre branch + Pull Request.
- **Um PR não deve misturar `backend/` e `front/`** sem necessidade. Se precisar tocar a área do outro, faça PR separado e peça review de quem é dono daquela área.
- PR que altera `front/` precisa de review da pessoa do front; PR que altera `backend/`, da pessoa do back.

### Segredos e banco
- **Nunca rodar migrations sozinho** — migrations passam pelo tech lead (P1).
- **Nunca subir `.env` (raiz), `front/.env.local` nem `usuarios_test.txt`** — segredos/senhas ficam fora do git (ver `.gitignore`).

## Documentação interna

- Referência da API atual → `backend/docs/api.md`
- Requisitos do sistema → `backend/docs/requisitos.md`
- Arquitetura e divisão do time → `backend/docs/arquitetura-backend.md`
- Arquivos de modelagem originais → `architecture_modeling/`
