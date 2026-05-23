# Requisitos do Sistema

Baseado em `architecture_modeling/ModeloRequisitos_do_sistema.xlsx`.

Prioridade: 1 = Baixa, 2 = Média, 3 = Alta

## Requisitos

| ID | História | Stakeholder | Prioridade |
|---|---|---|---|
| 1 | O sistema deve ser uma aplicação web (sem instalação), acessível por qualquer dispositivo com navegador | Todos os usuários | 1 |
| 2 | Como servidor da Secretaria, quero fazer login no sistema | Servidor | 1 |
| 3 | Como pesquisador de campo, quero me autenticar para registrar respostas da pesquisa de Demanda Turística | Pesquisador de campo | 2 |
| 4 | Como servidor, quero criar uma nova pesquisa definindo nome e campos a partir dos tipos disponíveis | Servidor | 1 |
| 5 | Como servidor, quero lançar uma nova edição de uma pesquisa, podendo modificar campos quando necessário | Servidor | 1 |
| 6 | Como servidor, quero alimentar a pesquisa de Diária Média inserindo dados do Booking no sistema | Servidor | 1 |
| 7 | Como cidadão olimpense, quero responder à pesquisa de Percepção do Turismo por link público | Cidadão olimpense | 2 |
| 8 | Como dono de hospedagem, quero responder à pesquisa de Taxa de Ocupação e Fluxo de Turistas por link público | Dono de hospedagem | 2 |
| 9 | Como pesquisador de campo, quero registrar as respostas coletadas presencialmente com turistas | Pesquisador de campo | 2 |
| 10 | Como servidor, quero visualizar as respostas tabuladas de cada edição, com opção de inserir ou remover registros | Servidor | 2 |
| 11 | Como interessado no turismo de Olímpia, quero visualizar os resultados das pesquisas em página pública | Público geral | 3 |
| 12 | Como servidor, quero gerar relatórios em PDF de cada edição de cada pesquisa | Servidor | 3 |

---

## Fluxos por tipo de pesquisa

### Percepção do Turismo (REQ 7)
- Respondida pelo cidadão olimpense
- Acesso via link público gerado pela edição
- Sem necessidade de login
- Pode ter campos extras por edição (ex: perguntas sobre carnaval em fevereiro)

### Taxa de Ocupação e Fluxo de Turistas (REQ 8)
- Respondida pelo dono de hospedagem
- Acesso via link público gerado pela edição
- Sem necessidade de login

### Demanda Turística (REQ 3 e 9)
- Respondida pelo turista, mas mediada pelo pesquisador de campo
- Pesquisador faz login e preenche em nome do turista
- Exige autenticação para rastreabilidade

### Diária Média (REQ 6)
- Preenchida pelo servidor da Secretaria
- Servidor consulta o Booking e insere manualmente no sistema
- Interface dedicada, exige login
- Registro contínuo por data (não tem edições)

---

## Observações

- **REQ 11 (resultados públicos):** o backend fornece os dados via API; a visualização/gráficos ficam no frontend React. Não há geração de gráficos no backend.
- **REQ 12 (PDF):** baixa prioridade, implementar por último.
- **Autenticação:** REQ 2 e 3 compartilham a mesma entidade `Administrador` com roles diferentes por enquanto.
