# Modelo do Banco de Dados

Resumo do DER modelado no draw.io (`architecture_modeling/ModeloBancoDados.html`).

## Entidades

### Usuario
Usuário autenticado do sistema. Agrupa servidores da Secretaria e pesquisadores de campo.

| Atributo | Tipo | Detalhe |
|---|---|---|
| id | SERIAL | Chave primária |
| nome | VARCHAR(150) | — |
| email | VARCHAR(150) | Único |
| senha_hash | VARCHAR(255) | Hash bcrypt |
| role | VARCHAR(30) | `servidor` ou `pesquisador_campo` |
| criado_em | TIMESTAMPTZ | Default `NOW()` |

### Pesquisa
Template de um formulário. Define os campos base que se repetem em todas as edições.

| Atributo | Tipo | Detalhe |
|---|---|---|
| id | SERIAL | Chave primária |
| nome | VARCHAR(150) | Único |
| descricao | TEXT | — |
| tipo | VARCHAR(20) | `publica` (respondida pelo link aberto) ou `campo` (coletada por pesquisador de campo logado). Default `publica` |
| criado_em | TIMESTAMPTZ | Default `NOW()` |

> **`tipo`** define o fluxo de resposta: pesquisas `campo` só são respondidas pelas rotas
> `/pesquisador/*` (a resposta fica vinculada ao `usuario_id` do pesquisador) e **não** ficam
> acessíveis pelo link público. Ver `backend/docs/api.md`.

### Edição
Instância de uma Pesquisa em um período específico. Gera o link público do formulário.

| Atributo | Tipo | Detalhe |
|---|---|---|
| id | SERIAL | Chave primária |
| pesquisa_id | INTEGER | FK → pesquisa |
| numero_edicao | INTEGER | Único por pesquisa |
| data_abertura | DATE | — |
| data_fechamento | DATE | Nullable |
| criado_em | TIMESTAMPTZ | Default `NOW()` |

**Relacionamento:** uma Pesquisa possui N Edições (1:N).

### Campo
Pergunta de um formulário. Pertence a uma Pesquisa (campo fixo) ou a uma Edição (campo extra).

| Atributo | Tipo | Detalhe |
|---|---|---|
| id | SERIAL | Chave primária |
| hash_pergunta | VARCHAR(64) | Único — SHA-256 gerado pelo backend (`p{pesquisa_id}:texto` ou `e{edicao_id}:texto`) |
| texto_pergunta | TEXT | Enunciado da pergunta |
| tipo | tipo_campo | ENUM (ver abaixo) |
| opcoes | TEXT[] | Opções de `multipla_escolha` (vazio nos demais tipos) |
| obrigatorio | BOOLEAN | Se a resposta é exigida (default `FALSE`) |
| ordem | INTEGER | Posição no formulário (default `0`) |
| regex | TEXT | Expressão para minerar a resposta (opcional, default `''`) |
| pesquisa_id | INTEGER | FK → pesquisa (nullable) |
| edicao_id | INTEGER | FK → edicao (nullable) |
| criado_em | TIMESTAMPTZ | Default `NOW()` |

**ENUM `tipo_campo`** (alinhado com o `FieldType` do frontend):
`texto`, `texto_longo`, `numero`, `multipla_escolha`, `data`, `escala`, `sim_nao`

**Restrição:** um campo pertence OU a uma Pesquisa (fixo) OU a uma Edição (extra) — nunca aos dois, nunca a nenhum (constraint `ck_campo_origem`).

### Resposta
Registro de um envio de formulário por uma Edição.

| Atributo | Tipo | Detalhe |
|---|---|---|
| id | SERIAL | Chave primária |
| usuario_id | INTEGER | FK → usuario (nullable) — preenchido só quando um pesquisador logado registra; `NULL` se anônima. `ON DELETE SET NULL` |
| edicao_id | INTEGER | FK → edicao |
| timestamp_envio | TIMESTAMPTZ | Default `NOW()` |

**Relacionamento:** uma Edição recebe N Respostas (1:N).

### Coletou (relação Campo ↔ Resposta)
Tabela associativa que liga Campo a Resposta.

| Atributo | Tipo | Detalhe |
|---|---|---|
| id | SERIAL | Chave primária |
| campo_id | INTEGER | FK → campo |
| resposta_id | INTEGER | FK → resposta |
| atributo_texto | TEXT | Texto bruto coletado do formulário |

A informação útil é extraída do `atributo_texto` via REGEX do Campo correspondente.
O ciclo de dependência entre Campo → Pesquisa → Edição → Resposta → Coletou → Campo é resolvido no backend.

### Hospedagem
Hotel, pousada ou resort cadastrado para a pesquisa de Diária Média.

| Atributo | Tipo | Detalhe |
|---|---|---|
| cnpj | VARCHAR(18) | Chave primária |
| nome_fantasia | VARCHAR(150) | — |
| local | VARCHAR(200) | — |
| categoria | VARCHAR(50) | Hotel, Pousada, Resort, Airbnb… (default `Hotel`) |
| estrelas | SMALLINT | Classificação 0–5 (default `0`) |
| quartos | INTEGER | Nº de quartos/unidades (default `0`) |
| url_booking | TEXT | Link **fixo** da hospedagem no Booking, para consulta posterior (nullable) |
| foto_url | TEXT | Imagem exibida no card (nullable) |
| criado_em | TIMESTAMPTZ | Default `NOW()` |

### Diária Média
Registro contínuo de preço por hospedagem, inserido manualmente pelo servidor consultando o Booking.
Guarda só o que varia por coleta (data + preço); os dados fixos ficam em `hospedagem`.

| Atributo | Tipo | Detalhe |
|---|---|---|
| id | SERIAL | Chave primária |
| hospedagem_cnpj | VARCHAR(18) | FK → hospedagem (`ON DELETE CASCADE`) |
| data | DATE | Data de referência do preço |
| preco | NUMERIC(10,2) | Diária consultada no Booking (não negativo) |
| registrado_em | TIMESTAMPTZ | Default `NOW()` |

**Restrição:** um registro por hospedagem por data (`uk_diaria_hospedagem_data`); `preco >= 0` (`ck_preco_positivo`).
**Relacionamento:** uma Hospedagem contém N registros de Diária Média (1:N).

---

## Resumo dos relacionamentos

```
Usuario     1 ──── N    Resposta     (pesquisador que coletou; NULL se anônima)

Pesquisa    1 ──── N    Edição
Pesquisa    1 ──── N    Campo        (campos fixos)
Edição      1 ──── N    Campo        (campos extras)
Edição      1 ──── N    Resposta
Campo       N ──── N    Resposta     (via tabela Coletou)
Hospedagem  1 ──── N    Diária Média
```

## As 4 pesquisas do sistema

| Pesquisa | Quem responde | Acesso | `tipo` |
|---|---|---|---|
| Percepção do Turismo | Cidadão olimpense | Link público, sem login | `publica` |
| Taxa de Ocupação e Fluxo de Turistas | Dono de hospedagem | Link público, sem login | `publica` |
| Demanda Turística | Turista (via pesquisador de campo) | Pesquisador faz login | `campo` |
| Diária Média | Servidor da Secretaria | Login + interface dedicada | — (não usa pesquisa/edição) |

---

## Migrações aplicadas

O banco no Neon **já existia com um schema antigo** quando a integração começou.
Por isso, em vez de rodar o `schema/schema.sql` inteiro (que dropa tabelas), as mudanças
foram aplicadas de forma incremental e idempotente. Os scripts ficam em `schema/migrations/`:

| Migração | O que faz |
|---|---|
| `001_add_campo_columns.sql` | Adiciona `opcoes`/`obrigatorio`/`ordem` a `campo`; colunas de `hospedagem`; `preco_fds`/`preco_semana` a `diaria_media`; novos valores do ENUM `tipo_campo` |
| `002_add_resposta_usuario.sql` | Adiciona `resposta.usuario_id` (FK → usuario, `ON DELETE SET NULL`) |
| `003_add_pesquisa_tipo.sql` | Adiciona `pesquisa.tipo` (`VARCHAR(20)`, default `publica`) — distingue pesquisa pública da de campo |
| `004_restructure_diaria_media.sql` | Adiciona `hospedagem.url_booking`; colapsa `diaria_media` para um único `preco` (remove `preco_fds`/`preco_semana`/`fonte_booking`/`observacoes`) — REQ 6 |

> `schema/schema.sql` reflete o estado final desejado (para recriar o banco do zero).
> As migrações refletem o caminho incremental aplicado no banco que já estava em uso.
> **Regra do time:** migrações passam pelo tech lead (P1) — ver `CLAUDE.md`.
