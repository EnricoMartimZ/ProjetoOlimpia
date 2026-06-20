# Casos de Uso — Projeto Olímpia

Esta pasta documenta os **casos de uso** do Sistema de Gestão de Pesquisas para o
Turismo de Olímpia e os **cenários de teste** derivados de cada um.

## Estrutura de cada pasta

```
UCxx_nome/
├── caso_de_uso.md       # Identificação, condições, fluxos e regras de negócio
└── cenarios_de_teste.md # Cenários derivados dos fluxos (base para testes automatizados)
```

## Índice

| Caso de uso | Requisito(s) | Ator principal | Rotas envolvidas |
|---|---|---|---|
| [UC01 — Autenticar no sistema](UC01_autenticar/caso_de_uso.md) | REQ 2, 3 | Servidor / Pesquisador de campo | `POST /auth/login` |
| [UC02 — Cadastrar usuário](UC02_cadastrar_usuario/caso_de_uso.md) | REQ 4 | Servidor da Secretaria | `POST /usuarios` |
| [UC03 — Criar pesquisa](UC03_criar_pesquisa/caso_de_uso.md) | REQ 5 | Servidor da Secretaria | `POST/GET/PUT/DELETE /pesquisas` |
| [UC04 — Lançar edição de pesquisa](UC04_lancar_edicao/caso_de_uso.md) | REQ 6 | Servidor da Secretaria | `POST /pesquisas/{id}/edicoes` |
| [UC05 — Responder pesquisa pública](UC05_responder_publico/caso_de_uso.md) | REQ 8, 9 | Cidadão / Dono de hospedagem | `GET /publico/edicoes/{id}` · `POST /edicoes/{id}/respostas` |
| [UC06 — Coletar resposta de campo](UC06_coleta_campo/caso_de_uso.md) | REQ 3, 10 | Pesquisador de campo | `GET/POST /pesquisador/edicoes/...` |
| [UC07 — Visualizar respostas tabuladas](UC07_consultar_respostas/caso_de_uso.md) | REQ 11 | Servidor da Secretaria | `GET/DELETE /edicoes/{id}/respostas` |
| [UC08 — Gerenciar hospedagens](UC08_gerenciar_hospedagens/caso_de_uso.md) | REQ 7 | Servidor da Secretaria | CRUD `/hospedagens` |
| [UC09 — Registrar diária média](UC09_registrar_diaria/caso_de_uso.md) | REQ 7 | Servidor da Secretaria | `/diarias` · `/diarias/pendentes` |

> **Não cobertos** (Os que ainda não foram implementados — ver `/requisitos.md`): REQ 12 (página
> pública de resultados) e REQ 13 (relatórios em PDF).

