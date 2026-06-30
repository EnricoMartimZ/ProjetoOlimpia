# TASKS — Projeto Olímpia (MERX)

Sequência incremental de implementação. Cada task entrega uma funcionalidade completa e testável end-to-end. Valide cada uma antes de pedir a próxima.

> **Convenção de URL pública:** `/pesquisa/{edicaoId}` (ID inteiro da edição)  
> **Roles:** `servidor` cria tudo; `pesquisador_campo` só responde  
> **Schema já no banco:** apenas `usuario`. As demais tabelas estão em `schema/schema.sql`

---

## Task 0 — Banco e infraestrutura do backend ✅ (parcial — feito junto com a Task 1)

**Entrega:** backend sobe sem erros, models de pesquisa/campo/edição existem, banco migrado.

> **Nota:** as tabelas já existiam no Neon com o schema antigo. Em vez de rodar o
> `schema.sql` inteiro, foi criada a migração `schema/migrations/001_add_campo_columns.sql`
> que adiciona as colunas novas (`opcoes`, `obrigatorio`, `ordem` em `campo`; colunas de
> `hospedagem`; `preco_fds`/`preco_semana` em `diaria_media`) e os novos valores do ENUM
> `tipo_campo`. Essa migração já foi aplicada no banco.

### Banco
- [x] Migração `001_add_campo_columns.sql` aplicada no Neon (colunas + ENUM)
- [x] Confirmado que as 8 tabelas existem com o schema atualizado

### Backend — models SQLAlchemy (criados conforme necessários para a Task 1)
- [x] `models/pesquisa.py` — tabela `pesquisa` + `Campo` + ENUM `TipoCampoEnum`
- [x] `models/edicao.py` — tabela `edicao`, FK → pesquisa
- [ ] `models/resposta.py` — (Task 3)
- [ ] `models/coletou.py` — (Task 3)
- [ ] `models/hospedagem.py` — (Task 5)
- [ ] `models/diaria_media.py` — (Task 5)
- [x] `models/__init__.py` exportando os models existentes

### Backend — registrar models
- [x] Models importados via routers; `main.py` registra o router de pesquisas

### Como validar
```bash
cd backend && uvicorn app.main:app --reload
# Esperado: servidor sobe sem ImportError nem SQLAlchemyError
# Acessar http://localhost:8000/docs — página deve carregar
```

---

## Task 1 — Pesquisas: criar e listar (admin) ✅ IMPLEMENTADA

**Entrega:** admin cria uma pesquisa com campos no painel e ela persiste no banco.

### Backend
- [x] `schemas/pesquisa.py`
  - `CampoCreate`: `texto_pergunta`, `tipo` (FieldType), `opcoes`, `obrigatorio`, `ordem`
  - `PesquisaCreate`: `nome`, `descricao`, `campos: list[CampoCreate]`
  - `PesquisaUpdate`: todos os campos opcionais (para edição)
  - `CampoOut`: todos os campos + `id`, `hash_pergunta`
  - `PesquisaListOut`: resumo para a listagem (sem campos)
  - `PesquisaOut`: completo + `id`, `status` (derivado), `total_edicoes` (derivado), `campos`
- [x] `routers/pesquisas.py`
  - `GET /pesquisas` → lista pesquisas com `status` e `total_edicoes` derivados
  - `POST /pesquisas` → cria pesquisa + campos base; exige `role == servidor`; gera `hash_pergunta` via SHA-256 de `p{id}:{texto}`
  - `GET /pesquisas/{id}` → detalha pesquisa com seus campos
  - `PUT /pesquisas/{id}` → edita pesquisa (substitui campos); exige `role == servidor` **(extra)**
  - `DELETE /pesquisas/{id}` → exclui em cascata; exige `role == servidor` **(extra)**
- [x] Registrar router em `main.py`

**Regra de `status` (derivado no backend):**
- `ativa` — existe ≥ 1 edição com `data_abertura ≤ hoje` e (`data_fechamento IS NULL` ou `data_fechamento ≥ hoje`)
- `encerrada` — existe ≥ 1 edição mas todas têm `data_fechamento < hoje`
- `rascunho` — nenhuma edição

### Frontend — `AdicionarPesquisaPage.tsx`
- [x] `getPesquisas()`, `getPesquisa()`, `createPesquisa()`, `updatePesquisa()`, `deletePesquisa()` em `services/api.ts`
- [x] Helper `request()` central em `api.ts` injeta `Authorization: Bearer` automaticamente
- [x] Na montagem, busca pesquisas do backend (`useEffect` + `fetchPesquisas`)
- [x] `handleSave` chama `createPesquisa()`/`updatePesquisa()`; `handleDelete` chama `deletePesquisa()`
- [x] Loading state, error state com botão "Tentar novamente", erro inline ao salvar
- [ ] **Pendente:** "Lançar edição" ainda usa AppStore (será integrado na Task 2)

### Validação realizada (via curl)
- [x] `POST /usuarios` cria servidor → `POST /auth/login` retorna JWT
- [x] `POST /pesquisas` com 3 campos (texto, multipla_escolha, escala) → 201 + campos com hash
- [x] `GET /pesquisas` → lista com status `rascunho`
- [x] `GET /pesquisas/{id}` → detalhe com campos ordenados
- [x] `PUT /pesquisas/{id}` → substitui nome e campos
- [x] `DELETE /pesquisas/{id}` → 204, some da lista
- [x] `POST` sem token → 401; com role pesquisador → 403; nome duplicado → 409

### Validação manual no navegador (a fazer pelo time)
1. Admin faz login → vai para "Adicionar Pesquisa"
2. Cria pesquisa "Teste Task 1" com 2 campos (um texto, um multipla_escolha)
3. Pesquisa aparece na lista à esquerda
4. Confirmar no Neon que a row existe em `pesquisa` e em `campo`

> **Usuários de teste criados no banco:** `admin@teste.com` (servidor) e
> `pesq@teste.com` (pesquisador_campo), ambos com senha `senha123`.

---

## Task 2 — Edições: lançar e gerar link público ✅ IMPLEMENTADA

**Entrega:** admin lança edição e recebe link `/pesquisa/{edicaoId}` funcional (carrega formulário).

### Backend
- [x] `schemas/edicao.py`
  - `EdicaoCreate`: `data_abertura`, `data_fechamento` (opcional), `campos_extras`
  - `EdicaoOut`: + `pesquisa_nome`, `numero_edicao`, `total_respostas`, `status` (agendada/ativa/encerrada)
  - `PublicEdicaoOut`: formulário público (pesquisa_nome, descricao, `aberta`, campos)
- [x] `services/edicao.py` — helpers compartilhados (status, campos combinados, hash, contagem de respostas)
- [x] `routers/edicoes.py`
  - `GET /pesquisas/{id}/edicoes` → lista edições da pesquisa
  - `POST /pesquisas/{id}/edicoes` → cria edição; auto-incrementa `numero_edicao`; exige `role == servidor`
  - `GET /edicoes/{id}/campos` → campos fixos da pesquisa + extras da edição, ordenados
- [x] `routers/publico.py`
  - `GET /publico/edicoes/{id}` → sem autenticação; formulário completo + flag `aberta`
- [x] `schemas/pesquisa.py` → adicionado `edicao_atual_id` (para o link na listagem)
- [x] Registrar routers em `main.py`

### Frontend — `AdicionarPesquisaPage.tsx`
- [x] `getEdicoes()`, `launchEdicao()` em `services/api.ts`
- [x] `handleConfirmLaunch` chama `launchEdicao()` (removido AppStore/`addEdition`)
- [x] Link gerado usa o `id` real da edição: `/pesquisa/${edicao.id}`
- [x] **Extra pedido pelo usuário:** botão "Copiar link público" na coluna de pesquisas
  (com feedback "copiado!"; mostra "Sem edição" quando a pesquisa é rascunho)

### Frontend — `PublicSurveyPage.tsx`
- [x] `getPublicEdicao(id)` em `services/api.ts`
- [x] `useParams` agora trata o `id` como número de edição
- [x] Carrega o form do backend (removido AppStore/slug)
- [x] Spinner ao carregar; 404 amigável; tela "encerrada" quando `aberta == false`
- [x] Suporta todos os tipos de campo (incl. `numero`, que faltava)

### Validação realizada (via curl)
- [x] `POST /pesquisas/6/edicoes` → 201, edição id=1, numero_edicao=1, status `ativa`
- [x] `GET /pesquisas/6/edicoes` → lista a edição
- [x] `GET /pesquisas` → pesquisa 6 agora com `status: ativa`, `edicao_atual_id: 1`
- [x] `GET /publico/edicoes/1` (sem token) → formulário com 3 campos, `aberta: true`
- [x] `GET /edicoes/1/campos` → 3 campos combinados
- [x] 404 edição inexistente · 403 pesquisador tentando lançar

### Validação manual no navegador (a fazer pelo time)
1. Admin lança edição da "Pesquisa teste 31/05" → recebe link `/pesquisa/1`
2. Botão "Copiar link público" aparece na coluna da pesquisa
3. Abrir o link em aba anônima → formulário carrega com os campos corretos
4. Confirmar no Neon que a row existe em `edicao`

> **Nota:** o **envio** de respostas (persistir no banco) é a **Task 3**. Hoje o formulário
> abre, navega e mostra a tela de agradecimento, mas ainda não grava em `resposta`/`coletou`.

---

## Task 3 — Formulário público: enviar resposta ✅ IMPLEMENTADA

**Entrega:** cidadão preenche formulário público e resposta persiste no banco.

### Banco
- [x] Migração `002_add_resposta_usuario.sql` aplicada — `resposta.usuario_id` (FK → usuario, nullable)

### Backend
- [x] `models/resposta.py` — `Resposta` e `Coletou` (criados e exportados em `models/__init__.py`)
- [x] `dependencies.py` → `get_optional_user` (retorna usuário se houver token válido, sem 401)
- [x] `schemas/resposta.py` — `ColetouItem`, `RespostaCreate` (valida não-vazio), `RespostaOut`
- [x] `routers/respostas.py`
  - `POST /edicoes/{id}/respostas` → auth opcional; cria `resposta` + `coletou`; grava `usuario_id` se logado
  - Valida: edição existe (404), está aberta (409), campo_ids pertencem à edição (422), sem duplicados (422)
- [x] Registrar router em `main.py`

### Frontend — `PublicSurveyPage.tsx`
- [x] `submitResposta(edicaoId, respostas)` em `services/api.ts`
- [x] "Enviar respostas" chama `submitResposta()` e só mostra sucesso após o 201
- [x] Loading ("Enviando...") + mensagem de erro inline

### Validação realizada (via curl)
- [x] POST anônimo → resposta id=1, `usuario_id=None`, 3 registros coletou
- [x] POST com token de pesquisador → resposta id=2, `usuario_id=7`
- [x] Conferido no banco: rows em `resposta` e `coletou` corretas
- [x] 404 edição inexistente · 409 edição encerrada · 422 campo inválido/duplicado/vazio
- [x] `total_respostas` na listagem de edições subiu para 2

### Validação manual no navegador (a fazer pelo time)
1. Abrir `/pesquisa/1` → preencher as perguntas → clicar "Enviar"
2. Página de agradecimento aparece (após gravar de verdade)
3. Confirmar no Neon: nova row em `resposta`, rows em `coletou`

> **Dados de exemplo:** já existem 2 respostas de teste na edição 1 (uma anônima, uma do
> pesquisador `pesq@teste.com`). Úteis para validar a Task 4 (Consultar). Podem ser apagadas lá.

---

## Task 4 — Consultar respostas (admin) ✅ IMPLEMENTADA

**Entrega:** admin visualiza respostas tabuladas da edição no ConsultarPage, pode deletar e adicionar manualmente.

### Backend
- [x] `GET /edicoes/{id}/respostas` — respostas paginadas com `coletou` expandido; exige `role == servidor`
  - Query params: `pagina`, `por_pagina` (default 20, max 500), `busca` (ILIKE em atributo_texto)
  - Resposta: `{ total, pagina, por_pagina, campos_header: [{id, texto_pergunta, tipo}], dados: [{resposta_id, timestamp_envio, usuario_id, valores: {campo_id: atributo_texto}}] }`
- [x] `DELETE /edicoes/{id}/respostas/{rid}` — exige `role == servidor`; valida que a resposta pertence à edição
- [x] `GET /pesquisas/{id}/edicoes` (Task 2) reutilizado para o dropdown

### Frontend — `ConsultarPage.tsx` (reescrita completa)
- [x] `getRespostas()`, `deleteResposta()` em `services/api.ts`
- [x] Tabela montada **dinamicamente** a partir de `campos_header` (sem colunas hardcoded)
- [x] Paginação via API · Busca via API com debounce (400ms)
- [x] Dropdowns "Pesquisa"/"Edição" via `GET /pesquisas` e `GET /pesquisas/{id}/edicoes`
- [x] Exportar CSV — busca todas as respostas (ignora paginação) e gera o arquivo no front
- [x] **Novo registro** dinâmico: modal monta inputs por tipo de campo (usa `getPublicEdicao`
  para ter as opções) e grava via `submitResposta` (reusa endpoint da Task 3) — atende ao requisito 10 ("inserir")
- [x] Removido AppStore/mockData

### Validação realizada (via curl, fluxo completo)
- [x] `GET /pesquisas` → dropdown · `GET /pesquisas/6/edicoes` → dropdown
- [x] `GET /edicoes/1/respostas` → colunas dinâmicas + linhas com valores por campo_id
- [x] `busca=Maria` → filtra corretamente · paginação OK
- [x] `DELETE` resposta → some (cascade em coletou confirmado) · 404 inexistente
- [x] Novo registro via POST (admin logado) → total subiu para 3
- [x] 401 sem token · 403 pesquisador

### Validação manual no navegador (a fazer pelo time)
1. Admin → "Consultar" → seleciona pesquisa/edição → vê as respostas
2. Busca por um termo → filtra · Deleta uma → some
3. "Novo registro" → preenche o form dinâmico → aparece na tabela
4. "Exportar CSV" → arquivo com colunas e valores corretos

> **Dados de exemplo:** edição 1 tem ~3 respostas de teste. Use-as para validar e limpe à vontade.

---

## Task 5 — Diária Média (admin)

**Entrega:** admin visualiza hospedagens cadastradas, preenche diária; dados persistem no banco.

### Backend
- [ ] `schemas/hospedagem.py`
  - `HospedagemCreate`: `cnpj`, `nome_fantasia`, `local`, `categoria`, `estrelas`, `quartos`, `foto_url`
  - `HospedagemOut`: todos os campos + `status` (`pendente` se não há diária nos últimos 30 dias; `preenchido` caso contrário) + `ultima_atualizacao` (max de `registrado_em`)
- [ ] `schemas/diaria_media.py`
  - `DiariaCreate`: `data`, `preco_fds`, `preco_semana`, `fonte_booking`, `observacoes`
  - `DiariaOut`: todos os campos + `id`
- [ ] `routers/hospedagens.py`
  - `GET /hospedagens` → lista com `status` e `ultima_atualizacao` derivados; exige `role == servidor`
  - `POST /hospedagens` → cria hospedagem; exige `role == servidor`
  - `GET /hospedagens/{cnpj}` → detalha hospedagem
  - `POST /hospedagens/{cnpj}/diaria` → insere diária; exige `role == servidor`
  - `GET /hospedagens/{cnpj}/diaria` → histórico ordenado por data desc; suporta `?data_inicio` e `?data_fim`
- [ ] Registrar router em `main.py`

### Frontend — `DiariaMediaPage.tsx`
- [ ] Adicionar funções em `services/api.ts`: `getHospedagens()`, `createDiaria(cnpj, dados)`
- [ ] Substituir `useState(hotels)` (mockData) por chamada à API
- [ ] Modal de preenchimento salva via `createDiaria()` em vez de `setHotelList()`
- [ ] Atualizar card do hotel para `status: preenchido` a partir da resposta da API

### Como validar
1. Admin vai em "Diária Média" → vê lista de hospedagens do banco
2. Clica "Preencher dados" em um hotel → preenche valores → salva
3. Card muda para "Preenchido"
4. Confirmar no Neon: row em `diaria_media`

---

## Task 6 — Pesquisador de campo (ResponderPage)

**Entrega:** pesquisador de campo faz login, seleciona a edição ativa da pesquisa de Demanda Turística, preenche e salva a resposta associada ao seu usuário.

### Backend
- [ ] `POST /edicoes/{id}/respostas` já existe (Task 3)
  - Garantir que quando o token é enviado, `usuario_id` é salvo em `resposta`
- [ ] `GET /edicoes/ativos` ou `GET /pesquisas/{id}/edicoes?status=ativa` — retorna edições abertas para o pesquisador escolher
  - Filtro de ativa: `data_abertura ≤ hoje` e (`data_fechamento IS NULL` ou `data_fechamento ≥ hoje`)

### Frontend — `ResponderPage.tsx`
- [ ] Adicionar `getEdicoesAtivas(pesquisaId)` em `services/api.ts`
- [ ] Remover importação hardcoded de `researches` do mockData; buscar edições disponíveis via API
- [ ] Remover pesquisador hardcoded `"Ana Paula Silva"` — usar `user.nome` do `AuthContext`
- [ ] Ao submeter, chamar `submitResposta(edicaoId, respostas)` com o token no header
- [ ] Mapeamento: iterar sobre os `campos` retornados pela API para montar os `ColetouItem`

### Como validar
1. Pesquisador de campo faz login
2. ResponderPage mostra a edição ativa da Demanda Turística
3. Preenche o formulário e salva
4. Confirmar no Neon: `resposta.usuario_id` está preenchido

---

## Task 7 — Dashboard e Dados Públicos com dados reais

**Entrega:** DashboardPage (admin), PublicStatsPage e ResearcherDashboard sem dados mockados.

### Backend
- [ ] `GET /admin/stats` — exige `role == servidor`; retorna:
  ```json
  {
    "total_respostas": 842,
    "edicoes_abertas": 3,
    "hospedagens_cadastradas": 6,
    "media_diaria_fds": 350.00,
    "media_diaria_semana": 280.00,
    "mensal": [{ "mes": "Jan", "respostas": 120 }],
    "por_pesquisa": [{ "pesquisa_nome": "Demanda Turística", "edicao": "2ª Ed.", "respostas": 312 }]
  }
  ```
- [ ] `GET /publico/edicoes` — sem autenticação; retorna edições abertas com `pesquisa_nome`, `total_respostas`
- [ ] `GET /publico/resultados/{edicaoId}` — sem autenticação; retorna distribuição por campo:
  ```json
  {
    "edicao_id": 1,
    "pesquisa_nome": "...",
    "total_respostas": 42,
    "por_campo": [
      { "campo_id": 1, "texto_pergunta": "...", "tipo": "multipla_escolha",
        "distribuicao": [{ "valor": "Lazer", "contagem": 30 }] }
    ]
  }
  ```
- [ ] `GET /pesquisador/stats` (opcional) — exige `role == pesquisador_campo`; total de respostas do usuário logado por período

### Frontend — `DashboardPage.tsx`
- [ ] Substituir `kpiData`, `monthlyData`, `originData`, `occupancyByType` do mockData por `GET /admin/stats`
- [ ] Loading state enquanto busca

### Frontend — `PublicStatsPage.tsx`
- [ ] Substituir `kpiData`, `monthlyData`, `originData`, `occupancyByType` do mockData por `GET /publico/resultados/{id}` da edição mais recente
- [ ] Substituir `useAppStore().researches` por `GET /publico/edicoes` para listar pesquisas ativas
- [ ] Links "Responder" devem apontar para `/pesquisa/{edicaoId}`

### Frontend — `ResearcherDashboard.tsx`
- [ ] Substituir stats hardcoded (328, 47, etc.) por `GET /pesquisador/stats`
- [ ] Substituir `useAppStore().researches` por `GET /publico/edicoes`

### Como validar
1. Admin acessa dashboard → vê KPIs e gráficos com dados reais do banco
2. Página pública `/dados-publicos` → mostra dados reais, lista pesquisas ativas com link correto
3. Pesquisador acessa seu dashboard → vê total real de respostas coletadas

---

## Resumo das tarefas

| Task | Feature | Páginas integradas | Prioridade |
|------|---------|-------------------|-----------|
| 0 | Banco + models | — | P0 |
| 1 | Pesquisas CRUD | AdicionarPesquisaPage (criar/listar) | P1 |
| 2 | Edições + link público | AdicionarPesquisaPage (lançar), PublicSurveyPage (carregar) | P1 |
| 3 | Resposta pública | PublicSurveyPage (enviar) | P1 |
| 4 | Consultar dados | ConsultarPage | P1 |
| 5 | Diária Média | DiariaMediaPage | P1 |
| 6 | Pesquisador de campo | ResponderPage | P2 |
| 7 | Dashboards reais | DashboardPage, PublicStatsPage, ResearcherDashboard | P2 |
