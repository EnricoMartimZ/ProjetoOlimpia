A partir dos requisitos definidos em `/requisitos.md` e todo contexto que você tem sobre o projeto, preciso que você escreva casos de usos para cada funcionalidade. Note que por simplicidade, cada caso de uso pode ser mapeado em uma funcionaliade (caso de uso = funcionalidade). O importante é que cada caso de uso seja escrito de forma clara, seguindo uma estrutura:

1. Identificação

Nome do caso de uso
Ator(es) envolvido(s)

2. Condições

Pré-condições (o que deve ser verdade antes de executar)
Pós-condições (o que deve ser verdade depois)

3. Fluxos ← a parte mais importante

Fluxo principal (o caminho feliz, passo a passo)
Fluxos alternativos (variações válidas do caminho principal)
Fluxos de exceção (erros e condições anômalas)

4. Regras de negócio (quando existirem)


Crie uma pasta dentro de /tests chamada de use_cases e dentro dela um arquivo para cada caso de uso, seguindo a estrutura acima.

Após isso deve gerar cenários de testes para cada caso, considerando os fluxos principais, alternativos e de exceção. Os cenários devem ser escritos de forma clara e detalhada, para que possam ser facilmente implementados como testes automatizados posteriormente. Crie os cenários de testes dentro das respectivas pastas de cada caso de uso.


Pense no que ja foi implementado para descrever os testes, use a documentação da arquitetura do backend para entender oque julgar nescessário. Ela está em /backend/docs/arquitetura-backend.md e /backend/docs/api.md
