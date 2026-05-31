# Arquitetura do Backend

## Estrutura de pastas

```
backend/
├── alembic/                  # Migrations do banco (a configurar)
│   └── versions/
├── app/
│   ├── main.py               # Entrada da aplicação, registra os routers
│   ├── database.py           # Conexão com o Neon (PostgreSQL)
│   ├── dependencies.py       # Dependências compartilhadas (get_db, get_current_user)
│   │
│   ├── models/               # Tabelas do banco (SQLAlchemy)
│   │   ├── usuario.py
│   │   ├── pesquisa.py
│   │   ├── edicao.py
│   │   ├── campo.py
│   │   ├── resposta.py
│   │   ├── hospedagem.py
│   │   └── diaria_media.py
│   │
│   ├── schemas/              # Validação de entrada/saída (Pydantic)
│   │   ├── usuario.py
│   │   ├── pesquisa.py
│   │   ├── edicao.py
│   │   ├── campo.py
│   │   ├── resposta.py
│   │   ├── hospedagem.py
│   │   └── diaria_media.py
│   │
│   ├── routers/              # Endpoints da API
│   │   ├── auth.py           # ✅ POST /auth/login
│   │   ├── usuarios.py       # ✅ POST /usuarios
│   │   ├── pesquisas.py      # ✅ CRUD de pesquisas
│   │   ├── edicoes.py        # ✅ edições + campos da edição
│   │   ├── respostas.py      # ✅ envio + consulta tabulada + remoção
│   │   ├── publico.py        # ✅ formulário público (sem auth)
│   │   ├── hospedagens.py    # ⏳ Task 5
│   │   └── diaria_media.py   # ⏳ Task 5
│   │
│   └── services/             # Lógica de negócio
│       ├── auth.py           # ✅ Gerar/validar JWT
│       ├── edicao.py         # ✅ status, campos combinados, hash, contagem
│       ├── mineracao.py      # ⏳ Aplicar REGEX nas respostas
│       └── relatorio.py      # ⏳ Montar dados para gráficos/PDF
│
├── docs/
│   ├── modelo-banco.md       # DER + migrações aplicadas
│   ├── requisitos.md
│   ├── rotas.md              # Mapa completo de rotas (status + payloads)
│   └── arquitetura-backend.md
├── ../schema/migrations/     # Migrações SQL incrementais (001, 002…)
├── .env                      # NÃO sobe no git
├── .env.example
├── requirements.txt
└── alembic.ini
```

---

## Responsabilidade de cada camada

| Camada | Responsabilidade |
|---|---|
| `models/` | Define as tabelas e relacionamentos no banco via SQLAlchemy |
| `schemas/` | Valida e serializa dados de entrada e saída via Pydantic |
| `routers/` | Define as rotas HTTP, chama services ou acessa o banco via dependências |
| `services/` | Lógica de negócio — status de edição, mineração REGEX, relatórios |
| `dependencies.py` | Injeção de acesso: `get_db`, `get_current_user`, `require_servidor` (403 se não-servidor), `get_optional_user` (auth opcional, não levanta erro) |

### Controle de acesso por rota

As rotas declaram o nível de acesso via dependência, sem repetir checagens de role:
- pública → sem dependência de auth (ex.: `GET /pesquisas`, `POST /usuarios`)
- pública com auth opcional → `Depends(get_optional_user)` (ex.: envio de resposta)
- exige login → `Depends(get_current_user)`
- exige servidor → `Depends(require_servidor)` (ex.: criar pesquisa, lançar edição, consultar respostas)

---

## Endpoints

Legenda: ✅ implementado · ⏳ planejado. Detalhes e exemplos de payload em `rotas.md`.

### Autenticação
```
✅ POST   /auth/login
```

### Usuários
```
✅ POST   /usuarios                    # cadastro (público)
```

### Pesquisas
```
✅ GET    /pesquisas                   # lista (status + edicao_atual_id derivados)
✅ POST   /pesquisas                   # servidor
✅ GET    /pesquisas/{id}              # detalhe com campos
✅ PUT    /pesquisas/{id}              # servidor — substitui campos
✅ DELETE /pesquisas/{id}              # servidor — cascata
✅ GET    /pesquisas/{id}/edicoes      # lista edições
✅ POST   /pesquisas/{id}/edicoes      # servidor — lança edição
```

### Edições
```
✅ GET    /edicoes/{id}/campos         # campos fixos + extras, ordenados
⏳ POST   /edicoes/{id}/campos         # adicionar campo extra avulso
```

### Respostas
```
✅ POST   /edicoes/{id}/respostas      # envio (auth opcional; grava usuario_id se logado)
✅ GET    /edicoes/{id}/respostas      # servidor — tabulado, paginado, com busca
✅ DELETE /edicoes/{id}/respostas/{rid}# servidor — remoção manual
```

### Hospedagens (admin) — ⏳ Task 5
```
⏳ GET    /hospedagens
⏳ POST   /hospedagens
⏳ GET    /hospedagens/{cnpj}
⏳ POST   /hospedagens/{cnpj}/diaria
⏳ GET    /hospedagens/{cnpj}/diaria
```

### Público (sem autenticação)
```
✅ GET    /publico/edicoes/{id}        # formulário da edição (flag `aberta`)
⏳ GET    /publico/resultados/{id}     # dados agregados para gráficos (Task 7)
```

---

## Regras importantes

- **Migrations:** apenas o P1 (tech lead) roda `alembic upgrade head`. Nunca rodar sem avisar o time.
- **`.env`:** nunca sobe no git. Compartilhar a `DATABASE_URL` e `SECRET_KEY` por canal privado.
- **Branches:** nunca commitar direto na `main`. Criar branch por feature (`feature/models-pesquisa`) e abrir PR.
- **Ciclo de dependência** (Campo → Pesquisa → Edição → Resposta → Coletou → Campo): resolvido no backend via lógica no `services/mineracao.py`, não no banco.
