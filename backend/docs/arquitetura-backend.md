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
│   │   ├── auth.py           # POST /auth/login
│   │   ├── usuarios.py       # POST /usuarios
│   │   ├── pesquisas.py
│   │   ├── edicoes.py
│   │   ├── campos.py
│   │   ├── respostas.py
│   │   ├── hospedagens.py
│   │   ├── diaria_media.py
│   │   └── publico.py        # Endpoints sem autenticação
│   │
│   └── services/             # Lógica de negócio
│       ├── auth.py           # Gerar/validar JWT
│       ├── mineracao.py      # Aplicar REGEX nas respostas
│       └── relatorio.py      # Montar dados para gráficos/PDF
│
├── docs/
│   ├── modelo-banco.md
│   ├── requisitos.md
│   └── arquitetura-backend.md
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
| `services/` | Lógica de negócio — mineração REGEX, geração de relatórios |

---

## Endpoints previstos

### Autenticação
```
POST   /auth/login
```

### Usuários (admin)
```
POST   /usuarios
```

### Pesquisas (admin)
```
GET    /pesquisas
POST   /pesquisas
GET    /pesquisas/{id}
GET    /pesquisas/{id}/edicoes
POST   /pesquisas/{id}/edicoes
```

### Edições (admin)
```
GET    /edicoes/{id}
GET    /edicoes/{id}/campos
POST   /edicoes/{id}/campos
GET    /edicoes/{id}/respostas        # tabulado para o admin
DELETE /edicoes/{id}/respostas/{rid}  # remoção manual
```

### Respostas (público)
```
POST   /edicoes/{id}/respostas        # envio do formulário público
```

### Hospedagens (admin)
```
GET    /hospedagens
POST   /hospedagens
GET    /hospedagens/{cnpj}
POST   /hospedagens/{cnpj}/diaria
GET    /hospedagens/{cnpj}/diaria     # histórico de diárias
```

### Público (sem autenticação)
```
GET    /publico/edicoes/{id}          # retorna o formulário da edição
GET    /publico/resultados/{id}       # retorna dados para gráficos
```

---

## Regras importantes

- **Migrations:** apenas o P1 (tech lead) roda `alembic upgrade head`. Nunca rodar sem avisar o time.
- **`.env`:** nunca sobe no git. Compartilhar a `DATABASE_URL` e `SECRET_KEY` por canal privado.
- **Branches:** nunca commitar direto na `main`. Criar branch por feature (`feature/models-pesquisa`) e abrir PR.
- **Ciclo de dependência** (Campo → Pesquisa → Edição → Resposta → Coletou → Campo): resolvido no backend via lógica no `services/mineracao.py`, não no banco.
