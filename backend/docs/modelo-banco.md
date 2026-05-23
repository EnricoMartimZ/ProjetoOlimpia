# Modelo do Banco de Dados

Resumo do DER modelado no draw.io (`architecture_modeling/ModeloBancoDados.html`).

## Entidades

### Administrador
Usuário autenticado do sistema. Agrupa servidores da Secretaria e pesquisadores de campo.

| Atributo | Detalhe |
|---|---|
| Nome | Chave primária |
| email | — |
| senha | Hash |

### Pesquisa
Template de um formulário. Define os campos base que se repetem em todas as edições.

| Atributo | Detalhe |
|---|---|
| Nome | Chave primária |
| Descrição | — |

### Edição
Instância de uma Pesquisa em um período específico. Gera o link público do formulário.

| Atributo | Detalhe |
|---|---|
| Número Edição | Identificador |
| Data de Abertura | — |
| Data de Fechamento | — |

**Relacionamento:** uma Pesquisa possui N Edições (1:N).

### Campo
Pergunta de um formulário. Pertence a uma Pesquisa (campo fixo) ou a uma Edição (campo extra).

| Atributo | Detalhe |
|---|---|
| Hash pergunta | Chave primária |
| Texto da Pergunta | — |
| Tipo | Define o subtipo do campo |
| REGEX | Expressão usada para minerar a resposta do texto coletado |

**Subtipos de Campo:**
- `MultiplaEscolha1` — apenas 1 opção selecionável
- `MultiplaEscolhaN` — múltiplas opções selecionáveis
- `Texto` — resposta livre
- `Data` — data no formato definido pelo REGEX

**Coleta Extra:** campos específicos de uma Edição (não da Pesquisa base). Ex: perguntas sobre o carnaval apenas na edição de fevereiro.

### Resposta
Registro de um envio de formulário por uma Edição.

| Atributo | Detalhe |
|---|---|
| Número Resposta | Identificador |
| Timestamp | Data/hora do envio |

**Relacionamento:** uma Edição recebe N Respostas (1:N).

### Coletou (relação Campo ↔ Resposta)
Tabela associativa que liga Campo a Resposta.

| Atributo | Detalhe |
|---|---|
| Atributo Texto | Texto bruto coletado do formulário |

A informação útil é extraída do `Atributo Texto` via REGEX do Campo correspondente.
O ciclo de dependência entre Campo → Pesquisa → Edição → Resposta → Coletou → Campo é resolvido no backend.

### Hospedagem
Hotel, pousada ou resort cadastrado para a pesquisa de Diária Média.

| Atributo | Detalhe |
|---|---|
| CNPJ | Chave primária |
| Nome Fantasia | — |
| Local | — |

### Diária Média
Registro contínuo de preço por hospedagem, inserido manualmente pelo servidor consultando o Booking.

| Atributo | Detalhe |
|---|---|
| DATA | Data do registro |
| Preço | Valor da diária |

**Relacionamento:** uma Hospedagem contém N registros de Diária Média (1:N).

---

## Resumo dos relacionamentos

```
Pesquisa    1 ──── N    Edição
Pesquisa    1 ──── N    Campo (campos fixos)
Edição      1 ──── N    Campo (campos extras — Coleta Extra)
Edição      1 ──── N    Resposta
Campo       N ──── N    Resposta  (via tabela Coletou)
Hospedagem  1 ──── N    Diária Média
```

## As 4 pesquisas do sistema

| Pesquisa | Quem responde | Acesso |
|---|---|---|
| Percepção do Turismo | Cidadão olimpense | Link público, sem login |
| Taxa de Ocupação e Fluxo de Turistas | Dono de hospedagem | Link público, sem login |
| Demanda Turística | Turista (via pesquisador de campo) | Pesquisador faz login |
| Diária Média | Servidor da Secretaria | Login + interface dedicada |
