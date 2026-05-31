# Rotas do Backend — Projeto Olímpia

Mapeamento completo das rotas necessárias, cruzando os requisitos funcionais (`requisitos.md`), o modelo do banco (`modelo-banco.md`), a arquitetura planejada (`arquitetura-backend.md`) e as páginas do frontend.

**Legenda de prioridade:** `P1` = Alta · `P2` = Média · `P3` = Baixa  
**Legenda de auth:** `Público` = sem token · `servidor` = role servidor · `pesquisador_campo` = role pesquisador · `Qualquer auth` = qualquer role autenticado

### Como o controle de acesso é aplicado (backend)

Cada rota declara seu nível de acesso por uma dependência em `app/dependencies.py` — não há
`if role == ...` espalhado pelos endpoints:

| Nível | Dependência | Comportamento |
|---|---|---|
| Público | _(nenhuma)_ | Qualquer um acessa |
| Público + auth opcional | `get_optional_user` | Aceita token se houver (grava `usuario_id`), mas nunca exige |
| Exige login | `get_current_user` | 401 se token ausente/inválido |
| Exige servidor | `require_servidor` | 401 sem token · 403 se a role não for `servidor` |

---

## Status atual

| Rota | Status |
|---|---|
| `POST /auth/login` | ✅ Implementado |
| `POST /usuarios` | ✅ Implementado |
| `GET /pesquisas` | ✅ Implementado (Task 1) |
| `POST /pesquisas` | ✅ Implementado (Task 1) |
| `GET /pesquisas/{id}` | ✅ Implementado (Task 1) |
| `PUT /pesquisas/{id}` | ✅ Implementado (Task 1) |
| `DELETE /pesquisas/{id}` | ✅ Implementado (Task 1) |
| `GET /pesquisas/{id}/edicoes` | ✅ Implementado (Task 2) |
| `POST /pesquisas/{id}/edicoes` | ✅ Implementado (Task 2) |
| `GET /edicoes/{id}/campos` | ✅ Implementado (Task 2) |
| `GET /publico/edicoes/{id}` | ✅ Implementado (Task 2) |
| `POST /edicoes/{id}/respostas` | ✅ Implementado (Task 3) |
| `GET /edicoes/{id}/respostas` | ✅ Implementado (Task 4) |
| `DELETE /edicoes/{id}/respostas/{rid}` | ✅ Implementado (Task 4) |
| Todas as demais | ❌ Pendente |

---

## 1. Autenticação

| Método | Rota | Descrição | Auth | Prioridade |
|---|---|---|---|---|
| `POST` | `/auth/login` | Gera token JWT | Público | P1 ✅ |

**Corpo da requisição:**
```json
{ "email": "string", "senha": "string" }
```
**Resposta:**
```json
{ "access_token": "string", "token_type": "bearer" }
```
O token contém: `sub` (id), `nome`, `role`, `exp`.

---

## 2. Usuários

| Método | Rota | Descrição | Auth | Prioridade |
|---|---|---|---|---|
| `POST` | `/usuarios` | Cadastra usuário | Público | P1 ✅ |
| `GET` | `/usuarios/me` | Retorna dados do usuário logado | Qualquer auth | P2 |

**`GET /usuarios/me` — resposta:**
```json
{ "id": 1, "nome": "string", "email": "string", "role": "servidor" }
```
> Consumido pelo `AuthContext` no frontend para revalidar a sessão sem expor a senha.

---

## 3. Pesquisas

Páginas que consomem: `AdicionarPesquisaPage`, `ConsultarPage`, `ResearcherDashboard`, `ResponderPage`.

| Método | Rota | Descrição | Auth | Prioridade |
|---|---|---|---|---|
| `GET` | `/pesquisas` | Lista todas as pesquisas | Qualquer auth | P1 |
| `POST` | `/pesquisas` | Cria nova pesquisa com campos base | `servidor` | P1 |
| `GET` | `/pesquisas/{id}` | Detalha uma pesquisa e seus campos base | Qualquer auth | P1 |
| `GET` | `/pesquisas/{id}/edicoes` | Lista edições de uma pesquisa | Qualquer auth | P1 |
| `POST` | `/pesquisas/{id}/edicoes` | Lança nova edição | `servidor` | P1 |
| `POST` | `/pesquisas/{id}/campos` | Adiciona campo base (fixo) à pesquisa | `servidor` | P2 |

**`POST /pesquisas` — corpo:**
```json
{
  "nome": "string",
  "descricao": "string",
  "campos": [
    {
      "texto_pergunta": "string",
      "tipo": "multipla_escolha_1 | multipla_escolha_n | texto | data",
      "regex": "string (opcional)",
      "opcoes": ["string"] // para tipos multipla_escolha_*
    }
  ]
}
```

**`POST /pesquisas/{id}/edicoes` — corpo:**
```json
{
  "data_abertura": "2026-01-01",
  "data_fechamento": "2026-01-31 (opcional)",
  "campos_extras": [
    {
      "texto_pergunta": "string",
      "tipo": "...",
      "regex": "string (opcional)"
    }
  ]
}
```

---

## 4. Edições

Páginas que consomem: `ConsultarPage`, `ResponderPage`, `NovaPesquisaPage`, `PublicSurveyPage`, `PublicStatsPage`.

| Método | Rota | Descrição | Auth | Prioridade |
|---|---|---|---|---|
| `GET` | `/edicoes/{id}` | Detalha uma edição | Qualquer auth | P1 |
| `GET` | `/edicoes/{id}/campos` | Lista campos da edição (fixos + extras) | Qualquer auth | P1 |
| `POST` | `/edicoes/{id}/campos` | Adiciona campo extra à edição | `servidor` | P2 |
| `GET` | `/edicoes/{id}/respostas` | Lista respostas tabuladas (admin) | `servidor` | P2 |
| `POST` | `/edicoes/{id}/respostas` | Envia resposta ao formulário | Público ou `pesquisador_campo` | P1 |
| `DELETE` | `/edicoes/{id}/respostas/{rid}` | Remove resposta manualmente | `servidor` | P2 |
| `GET` | `/edicoes/{id}/relatorio` | Gera PDF da edição | `servidor` | P3 |

**`GET /edicoes/{id}/campos` — resposta:**
```json
{
  "edicao_id": 1,
  "campos": [
    {
      "id": 1,
      "hash_pergunta": "string",
      "texto_pergunta": "string",
      "tipo": "texto",
      "opcoes": [],
      "origem": "fixo | extra"
    }
  ]
}
```

**`POST /edicoes/{id}/respostas` — corpo:**
```json
{
  "respostas": [
    { "campo_id": 1, "atributo_texto": "string" }
  ]
}
```

**`GET /edicoes/{id}/respostas` — resposta:**
```json
{
  "total": 100,
  "pagina": 1,
  "por_pagina": 20,
  "dados": [
    {
      "resposta_id": 1,
      "timestamp_envio": "2026-01-15T10:30:00Z",
      "campos": [
        { "campo_id": 1, "texto_pergunta": "string", "atributo_texto": "string" }
      ]
    }
  ]
}
```
> Suporta query params: `?pagina=1&por_pagina=20&busca=termo` para o `ConsultarPage`.

---

## 5. Hospedagens e Diária Média

Página que consome: `DiariaMediaPage`.

| Método | Rota | Descrição | Auth | Prioridade |
|---|---|---|---|---|
| `GET` | `/hospedagens` | Lista hospedagens cadastradas | `servidor` | P1 |
| `POST` | `/hospedagens` | Cadastra nova hospedagem | `servidor` | P1 |
| `GET` | `/hospedagens/{cnpj}` | Detalha hospedagem | `servidor` | P1 |
| `POST` | `/hospedagens/{cnpj}/diaria` | Insere registro de diária média | `servidor` | P1 |
| `GET` | `/hospedagens/{cnpj}/diaria` | Histórico de diárias da hospedagem | `servidor` | P1 |

**`POST /hospedagens` — corpo:**
```json
{
  "cnpj": "00.000.000/0001-00",
  "nome_fantasia": "string",
  "local": "string"
}
```

**`POST /hospedagens/{cnpj}/diaria` — corpo:**
```json
{
  "data": "2026-01-15",
  "preco": 350.00
}
```

**`GET /hospedagens/{cnpj}/diaria` — resposta:**
```json
{
  "cnpj": "string",
  "historico": [
    { "id": 1, "data": "2026-01-15", "preco": 350.00, "registrado_em": "..." }
  ]
}
```
> Suporta query params: `?data_inicio=2026-01-01&data_fim=2026-01-31` para filtros por período.

---

## 6. Público (sem autenticação)

Páginas que consomem: `PublicSurveyPage` (`/pesquisa/:id`), `PublicStatsPage` (`/dados-publicos`).

| Método | Rota | Descrição | Auth | Prioridade |
|---|---|---|---|---|
| `GET` | `/publico/edicoes` | Lista edições abertas no momento | Público | P2 |
| `GET` | `/publico/edicoes/{id}` | Retorna formulário de uma edição | Público | P1 |
| `GET` | `/publico/resultados/{id}` | Retorna dados agregados para gráficos | Público | P2 |

**`GET /publico/edicoes` — resposta:**
```json
[
  {
    "id": 1,
    "pesquisa_nome": "Percepção do Turismo",
    "numero_edicao": 3,
    "data_abertura": "2026-01-01",
    "data_fechamento": null,
    "total_respostas": 42
  }
]
```

**`GET /publico/edicoes/{id}` — resposta:**
Idêntica a `GET /edicoes/{id}/campos`, mas sem exigir autenticação.  
Consumido por `PublicSurveyPage` para montar o formulário dinâmico antes do envio.

**`GET /publico/resultados/{id}` — resposta:**
```json
{
  "edicao_id": 1,
  "total_respostas": 100,
  "por_campo": [
    {
      "campo_id": 1,
      "texto_pergunta": "string",
      "tipo": "multipla_escolha_1",
      "distribuicao": [
        { "valor": "Sim", "contagem": 70 },
        { "valor": "Não", "contagem": 30 }
      ]
    }
  ]
}
```
> A agregação é feita pelo backend via `services/mineracao.py` (REGEX). O frontend renderiza os gráficos.

---

## 7. Dashboard admin — estatísticas agregadas

Página que consome: `DashboardPage`.

| Método | Rota | Descrição | Auth | Prioridade |
|---|---|---|---|---|
| `GET` | `/admin/stats` | Retorna KPIs e dados para os gráficos do painel admin | `servidor` | P2 |

**`GET /admin/stats` — resposta:**
```json
{
  "kpis": {
    "total_respostas": 842,
    "edicoes_abertas": 3,
    "hospedagens_cadastradas": 6,
    "media_diaria_atual": 320.00
  },
  "mensal": [
    { "mes": "Jan", "respostas": 120 }
  ],
  "origem_turistas": [
    { "regiao": "São Paulo", "percentual": 45.2 }
  ],
  "ocupacao_por_tipo": [
    { "tipo": "Hotel", "percentual": 72.0 }
  ]
}
```
> Agrega dados de múltiplas pesquisas. Consumido pelos gráficos do `DashboardPage` (hoje preenchidos com `mockData.ts`).

---

## Resumo por prioridade de implementação

### P1 — Bloqueia funcionalidades core
| Rota | Router sugerido |
|---|---|
| `GET /pesquisas` | `routers/pesquisas.py` |
| `POST /pesquisas` | `routers/pesquisas.py` |
| `GET /pesquisas/{id}` | `routers/pesquisas.py` |
| `GET /pesquisas/{id}/edicoes` | `routers/pesquisas.py` |
| `POST /pesquisas/{id}/edicoes` | `routers/edicoes.py` |
| `GET /edicoes/{id}/campos` | `routers/edicoes.py` |
| `POST /edicoes/{id}/respostas` | `routers/respostas.py` |
| `GET /hospedagens` | `routers/hospedagens.py` |
| `POST /hospedagens` | `routers/hospedagens.py` |
| `POST /hospedagens/{cnpj}/diaria` | `routers/hospedagens.py` |
| `GET /hospedagens/{cnpj}/diaria` | `routers/hospedagens.py` |
| `GET /publico/edicoes/{id}` | `routers/publico.py` |

### P2 — Completa as funcionalidades
| Rota | Router sugerido |
|---|---|
| `GET /usuarios/me` | `routers/usuarios.py` |
| `GET /edicoes/{id}` | `routers/edicoes.py` |
| `POST /edicoes/{id}/campos` | `routers/edicoes.py` |
| `GET /edicoes/{id}/respostas` | `routers/respostas.py` |
| `DELETE /edicoes/{id}/respostas/{rid}` | `routers/respostas.py` |
| `POST /pesquisas/{id}/campos` | `routers/pesquisas.py` |
| `GET /hospedagens/{cnpj}` | `routers/hospedagens.py` |
| `GET /publico/edicoes` | `routers/publico.py` |
| `GET /publico/resultados/{id}` | `routers/publico.py` |
| `GET /admin/stats` | `routers/publico.py` ou novo `routers/stats.py` |

### P3 — Nice to have
| Rota | Router sugerido |
|---|---|
| `GET /edicoes/{id}/relatorio` | `routers/edicoes.py` (via `services/relatorio.py`) |

---

## Observações

- **Envio de resposta pública vs. autenticada:** a rota `POST /edicoes/{id}/respostas` serve tanto para o formulário público (sem token) quanto para o pesquisador de campo (com token). O backend pode registrar opcionalmente o `usuario_id` se um token válido estiver presente, para rastreabilidade do REQ 9.
- **Paginação:** rotas que listam coleções grandes (`/respostas`, `/hospedagens`, `/diaria`) devem suportar `?pagina=` e `?por_pagina=` para o `ConsultarPage`.
- **Exportação CSV:** o `ConsultarPage` tem botão "Exportar CSV". Isso pode ser resolvido no frontend (gerando o CSV a partir do JSON) ou via rota `GET /edicoes/{id}/respostas/csv` no backend. Avaliar com o time.
- **PDF (REQ 12):** implementar por último, via `services/relatorio.py`. Usar `weasyprint` ou `reportlab`.
- **ENUM `tipo_campo`:** o banco usa `multipla_escolha_1`, `multipla_escolha_n`, `texto`, `data`. O frontend usa `texto`, `texto_longo`, `numero`, `multipla_escolha`, `data`, `escala`, `sim_nao`. Alinhar os tipos antes de implementar os endpoints de campos.
