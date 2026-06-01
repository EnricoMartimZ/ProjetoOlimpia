"""
Lógica compartilhada de gravação de respostas.

Usada tanto pelo formulário público (`routers/respostas.py`) quanto pela coleta
de campo do pesquisador (`routers/pesquisador.py`). Centraliza as validações
(edição aberta, campos pertencentes à edição, sem duplicados) e a criação dos
registros `resposta` + `coletou`.
"""

from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.edicao import Edicao
from app.models.resposta import Coletou, Resposta
from app.schemas.resposta import RespostaCreate
from app.services.edicao import campos_combinados, edicao_aberta


def registrar_resposta(
    db: Session,
    edicao: Edicao,
    dados: RespostaCreate,
    usuario_id: Optional[int],
) -> Resposta:
    """
    Valida e grava uma resposta para uma edição já carregada (com campos).

    - `usuario_id`: id do pesquisador que coletou (None para resposta pública anônima).
    - Levanta 409 se a edição não está aberta.
    - Levanta 422 se algum campo não pertence à edição ou se há campos duplicados.

    Faz commit e retorna a `Resposta` recém-criada (com `id` e `timestamp_envio`).
    """
    if not edicao_aberta(edicao):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Esta edição não está aceitando respostas no momento.",
        )

    # Todo campo_id enviado precisa pertencer à edição (campos fixos + extras).
    ids_validos = {c.id for c in campos_combinados(edicao)}
    enviados = [item.campo_id for item in dados.respostas]

    desconhecidos = [cid for cid in enviados if cid not in ids_validos]
    if desconhecidos:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Campos não pertencem a esta edição: {desconhecidos}.",
        )

    if len(enviados) != len(set(enviados)):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Há campos duplicados na resposta.",
        )

    resposta = Resposta(edicao_id=edicao.id, usuario_id=usuario_id)
    db.add(resposta)
    db.flush()  # Gera o ID da resposta para os registros coletou

    for item in dados.respostas:
        db.add(Coletou(
            campo_id=item.campo_id,
            resposta_id=resposta.id,
            atributo_texto=item.atributo_texto,
        ))

    db.commit()
    db.refresh(resposta)
    return resposta
