# Requisitos do Sistema

Baseado em `architecture_modeling/ModeloRequisitos_do_sistema.xlsx`.

Prioridade: 1 = Alta, 2 = Média, 3 = Baixa

Finalizado: ✅ concluído · 🚧 em andamento · ❌ não iniciado

## Requisitos

| ID | História | Stakeholder | Prioridade | Finalizado |
|---|---|---|---|---|
| 1 | Como usuário do Sistema de Gestão de Pesquisa para o Turismo de Olímpia, quero que o sistema seja uma aplicação web, dispensando instalação e garantindo acesso por qualquer dispositivo com navegador. | Usuário do sistema | 1 | ✅ |
| 2 | Como servidor da Secretaria de Turismo, quero fazer login no sistema. | Servidor da Secretaria de Turismo | 1 | ✅ |
| 3 | Como pesquisador de campo, quero me autenticar no sistema para registrar as respostas coletadas presencialmente com turistas na pesquisa de Demanda Turística. | Pesquisador de campo | 2 | ✅ |
| 4 | Como servidor da Secretaria de Turismo, quero conseguir gerenciar o cadastro dos usuários do sistema, podendo adicionar e remover administradores e pesquisadores de campo. | Servidor da Secretaria de Turismo | 2 | ✅ |
| 5 | Como servidor da Secretaria de Turismo, quero criar uma nova pesquisa definindo seu nome e campos a partir de uma estrutura de tipos de campo disponíveis no sistema. | Servidor da Secretaria de Turismo | 1 | ✅ |
| 6 | Como servidor da Secretaria de Turismo, quero lançar uma nova edição de uma pesquisa existente, podendo modificar os campos do formulário quando necessário, além de ativar, encerrar e excluir edições. | Servidor da Secretaria de Turismo | 1 | ✅ |
| 7 | Como servidor da Secretaria de Turismo, quero alimentar a pesquisa de Diária Média inserindo os dados coletados do Booking diretamente no sistema, podendo cadastrar novas hospedagens para essa pesquisa. | Servidor da Secretaria de Turismo | 1 | ✅ |
| 8 | Como cidadão olimpense, quero responder à pesquisa de Percepção do Turismo por meio de um formulário online acessível e fácil de usar. | Cidadão olimpense | 2 | ✅ |
| 9 | Como dono de meio de hospedagem, quero responder à pesquisa de Taxa de Ocupação e Fluxo de Turistas por meio de um formulário online. | Dono de hospedagem | 2 | ✅ |
| 10 | Como pesquisador de campo, quero registrar no sistema as respostas coletadas presencialmente com turistas na pesquisa de Demanda Turística. | Pesquisador de campo | 2 | ✅ |
| 11 | Como servidor da Secretaria de Turismo, quero visualizar as respostas tabuladas de cada edição de cada pesquisa. | Servidor da Secretaria de Turismo | 2 | ✅ |
| 12 | Como interessado no turismo de Olímpia, quero visualizar os resultados das pesquisas em uma página pública do sistema. | Interessados no turismo olimpense | 3 | 🚧 |
| 13 | Como servidor da Secretaria de Turismo, quero gerar relatórios em PDF de cada edição de cada pesquisa. | Servidor da Secretaria de Turismo | 3 | ❌ |

---

## Fluxos por tipo de pesquisa

### Percepção do Turismo (REQ 8)
- Respondida pelo cidadão olimpense
- Acesso via link público gerado pela edição
- Sem necessidade de login

### Taxa de Ocupação e Fluxo de Turistas (REQ 9)
- Respondida pelo dono de hospedagem
- Acesso via link público gerado pela edição
- Sem necessidade de login

### Demanda Turística (REQ 3 e 10)
- Respondida pelo turista, mas mediada pelo pesquisador de campo
- Pesquisador faz login e preenche em nome do turista
- Exige autenticação para rastreabilidade

### Diária Média (REQ 7)
- Preenchida pelo servidor da Secretaria
- Servidor consulta o Booking e insere manualmente no sistema
- Interface dedicada, exige login
- Permite cadastro de novas hospedagens

---

## Observações

- **REQ 6 (ciclo de vida das edições):** além de lançar, o servidor pode **ativar**, **encerrar** e **excluir** edições. Ao ativar (ou lançar) uma edição que fica ativa, as demais edições ativas da mesma pesquisa são **encerradas automaticamente** — garantindo no máximo uma edição ativa por pesquisa. Rotas: `POST /edicoes/{id}/status` (`{acao: ativar|encerrar}`) e `DELETE /edicoes/{id}`, ambas `servidor`.
- **REQ 12 (resultados públicos / estatísticas):** 🚧 em andamento. As páginas de estatísticas e gráficos (`PublicStatsPage`, `SurveyStatsView`, painel do `DashboardPage`) estão no frontend React; o backend **não** gera gráficos nem expõe endpoint de estatística — os números são calculados no front a partir das respostas (`GET /edicoes/{id}/respostas`) e de dados estáticos de relatórios. O backend dá suporte indireto via gestão do ciclo de vida das edições (qual edição está ativa).
- **REQ 13 (PDF):** baixa prioridade, implementar por último.
- **Autenticação:** REQ 2 e 3 compartilham a mesma entidade `Usuario` com roles diferentes (`servidor` e `pesquisador_campo`).
- **Gerenciamento de usuários (REQ 4):** o acesso ao sistema é aberto ao público; mas apenas o servidor administrador pode criar contas de administradores e pesquisadores de campo.
