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
| criado_em | TIMESTAMPTZ | Default `NOW()` |

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
| hash_pergunta | VARCHAR(64) | Único |
| texto_pergunta | TEXT | — |
| tipo | tipo_campo | ENUM |
| regex | TEXT | Expressão para minerar a resposta |
| pesquisa_id | INTEGER | FK → pesquisa (nullable) |
| edicao_id | INTEGER | FK → edicao (nullable) |
| criado_em | TIMESTAMPTZ | Default `NOW()` |

**ENUM `tipo_campo`:** `multipla_escolha_1`, `multipla_escolha_n`, `texto`, `data`

**Restrição:** um campo pertence OU a uma Pesquisa (fixo) OU a uma Edição (extra) — nunca aos dois, nunca a nenhum.

### Resposta
Registro de um envio de formulário por uma Edição.

| Atributo | Tipo | Detalhe |
|---|---|---|
| id | SERIAL | Chave primária |
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
| criado_em | TIMESTAMPTZ | Default `NOW()` |

### Diária Média
Registro contínuo de preço por hospedagem, inserido manualmente pelo servidor consultando o Booking.

| Atributo | Tipo | Detalhe |
|---|---|---|
| id | SERIAL | Chave primária |
| hospedagem_cnpj | VARCHAR(18) | FK → hospedagem |
| data | DATE | — |
| preco | NUMERIC(10,2) | Não negativo |
| registrado_em | TIMESTAMPTZ | Default `NOW()` |

**Relacionamento:** uma Hospedagem contém N registros de Diária Média (1:N).

---

## Resumo dos relacionamentos

```
Usuario     (autenticação — sem relação direta com as demais tabelas)

Pesquisa    1 ──── N    Edição
Pesquisa    1 ──── N    Campo        (campos fixos)
Edição      1 ──── N    Campo        (campos extras)
Edição      1 ──── N    Resposta
Campo       N ──── N    Resposta     (via tabela Coletou)
Hospedagem  1 ──── N    Diária Média
```

## As 4 pesquisas do sistema

| Pesquisa | Quem responde | Acesso |
|---|---|---|
| Percepção do Turismo | Cidadão olimpense | Link público, sem login |
| Taxa de Ocupação e Fluxo de Turistas | Dono de hospedagem | Link público, sem login |
| Demanda Turística | Turista (via pesquisador de campo) | Pesquisador faz login |
| Diária Média | Servidor da Secretaria | Login + interface dedicada |
