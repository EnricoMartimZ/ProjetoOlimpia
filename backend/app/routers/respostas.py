"""
Rotas de Respostas.

- Envio (público): qualquer pessoa responde o formulário de uma edição aberta.
  Se um pesquisador de campo estiver logado, o `usuario_id` é gravado.
- Consulta/remoção (admin): o servidor visualiza as respostas tabuladas
  (colunas dinâmicas por campo) e pode remover registros.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import get_optional_user, require_servidor
from app.models.resposta import Resposta
from app.models.usuario import Usuario
from app.schemas.resposta import (
    CampoHeader,
    RespostaCreate,
    RespostaLinha,
    RespostaOut,
    RespostasTabela,
)
from app.services.edicao import campos_combinados, edicao_de_campo, load_edicao_com_campos
from app.services.resposta import registrar_resposta

router = APIRouter(tags=["respostas"])


def _carregar_respostas(db: Session, ids: list) -> list:
    """Carrega respostas (com suas coletas) preservando a ordem dos `ids` fornecidos."""
    if not ids:
        return []
    encontradas = db.scalars(
        select(Resposta)
        .where(Resposta.id.in_(ids))
        .options(selectinload(Resposta.coletas), selectinload(Resposta.usuario))
    ).all()
    por_id = {r.id: r for r in encontradas}
    return [por_id[i] for i in ids if i in por_id]


def _para_linha(resposta: Resposta) -> RespostaLinha:
    """Converte uma Resposta + suas coletas numa linha da tabela (valores por campo_id)."""
    return RespostaLinha(
        resposta_id=resposta.id,
        timestamp_envio=resposta.timestamp_envio,
        usuario_id=resposta.usuario_id,
        usuario_nome=resposta.usuario.nome if resposta.usuario else None,
        valores={str(c.campo_id): c.atributo_texto for c in resposta.coletas},
    )


@router.post(
    "/edicoes/{edicao_id}/respostas",
    response_model=RespostaOut,
    status_code=status.HTTP_201_CREATED,
    summary="Enviar resposta a uma edição",
    description=(
        "Registra um envio de formulário público. Não exige autenticação, mas se "
        "um Bearer token válido for enviado, o `usuario_id` é gravado na resposta. "
        "Pesquisas do tipo 'campo' não são respondidas por aqui — usam o fluxo "
        "autenticado em `/pesquisador/edicoes/{id}/respostas`."
    ),
    responses={
        403: {"description": "Edição de pesquisa de campo — use o fluxo do pesquisador."},
        404: {"description": "Edição não encontrada."},
        409: {"description": "Edição não está aceitando respostas."},
        422: {"description": "Campo inválido ou duplicado na resposta."},
    },
)
def enviar_resposta(
    edicao_id: int,
    dados: RespostaCreate,
    db: Session = Depends(get_db),
    usuario: Optional[Usuario] = Depends(get_optional_user),
):
    edicao = load_edicao_com_campos(db, edicao_id)
    if not edicao:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Edição não encontrada.")

    # Pesquisa de campo só aceita coleta pelo pesquisador autenticado (rota dedicada).
    if edicao_de_campo(edicao):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Esta é uma pesquisa de campo. Responda pelo fluxo do pesquisador "
            "de campo (`/pesquisador/edicoes/{id}/respostas`).",
        )

    resposta = registrar_resposta(
        db, edicao, dados, usuario_id=usuario.id if usuario else None
    )

    return RespostaOut(
        id=resposta.id,
        edicao_id=resposta.edicao_id,
        timestamp_envio=resposta.timestamp_envio,
        total_campos=len(dados.respostas),
    )


@router.get(
    "/edicoes/{edicao_id}/respostas",
    response_model=RespostasTabela,
    summary="Respostas tabuladas de uma edição (admin)",
    description=(
        "Retorna as respostas de uma edição em formato tabular, com as colunas "
        "(campos) dinâmicas. Suporta paginação e busca textual. Exclusivo para servidores."
    ),
    responses={
        403: {"description": "Apenas servidores podem consultar respostas."},
        404: {"description": "Edição não encontrada."},
    },
)
def listar_respostas(
    edicao_id: int,
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=500),
    busca: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    edicao = load_edicao_com_campos(db, edicao_id)
    if not edicao:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Edição não encontrada.")

    # Cabeçalho da tabela: uma coluna por campo (fixos da pesquisa + extras da edição)
    header = [
        CampoHeader(id=c.id, texto_pergunta=c.texto_pergunta, tipo=c.tipo.value)
        for c in campos_combinados(edicao)
    ]

    # 1) Seleciona os IDs das respostas (aplicando a busca), das mais recentes às mais antigas.
    ids_stmt = select(Resposta.id).where(Resposta.edicao_id == edicao_id)
    if busca:
        respostas_com_match = select(Coletou.resposta_id).where(
            Coletou.atributo_texto.ilike(f"%{busca}%")
        )
        ids_stmt = ids_stmt.where(Resposta.id.in_(respostas_com_match))
    ids_stmt = ids_stmt.order_by(Resposta.timestamp_envio.desc())

    todos_ids = list(db.scalars(ids_stmt).all())
    total = len(todos_ids)

    # 2) Recorta a página atual e carrega só essas respostas (com suas coletas).
    offset = (pagina - 1) * por_pagina
    ids_pagina = todos_ids[offset:offset + por_pagina]
    respostas = _carregar_respostas(db, ids_pagina)

    return RespostasTabela(
        total=total,
        pagina=pagina,
        por_pagina=por_pagina,
        campos_header=header,
        dados=[_para_linha(r) for r in respostas],
    )


@router.delete(
    "/edicoes/{edicao_id}/respostas/{resposta_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover uma resposta (admin)",
    description="Remove uma resposta e seus registros coletou em cascata. Exclusivo para servidores.",
    responses={
        403: {"description": "Apenas servidores podem remover respostas."},
        404: {"description": "Resposta não encontrada nesta edição."},
    },
)
def remover_resposta(
    edicao_id: int,
    resposta_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    resposta = db.get(Resposta, resposta_id)
    if not resposta or resposta.edicao_id != edicao_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resposta não encontrada nesta edição.")

    db.delete(resposta)
    db.commit()
