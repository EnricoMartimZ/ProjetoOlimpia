"""
Rotas da coleta de campo (exclusivas do pesquisador de campo).

Fluxo: o pesquisador de campo faz login, lista as edições abertas de pesquisas
do tipo "campo", abre o formulário de uma delas e envia a resposta. A resposta
fica vinculada ao seu `usuario_id` (rastreabilidade de quem coletou) e à edição.

Todas as rotas exigem a role "pesquisador_campo" (`require_pesquisador`) —
servidores e usuários anônimos recebem 403/401.
"""

from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import require_pesquisador
from app.models.edicao import Edicao
from app.models.pesquisa import Pesquisa
from app.models.usuario import Usuario
from app.schemas.edicao import EdicaoOut, PublicEdicaoOut
from app.schemas.pesquisa import CampoOut
from app.schemas.resposta import RespostaCreate, RespostaOut
from app.services.edicao import (
    campos_combinados,
    edicao_aberta,
    edicao_de_campo,
    load_edicao_com_campos,
    status_edicao,
    total_respostas,
)
from app.services.resposta import registrar_resposta

router = APIRouter(prefix="/pesquisador", tags=["pesquisador"])


def _carregar_edicao_campo(db: Session, edicao_id: int) -> Edicao:
    """
    Carrega uma edição garantindo que ela pertence a uma pesquisa do tipo "campo".
    404 se a edição não existe OU se não é de campo (não vaza pesquisas públicas
    pelo fluxo do pesquisador).
    """
    edicao = load_edicao_com_campos(db, edicao_id)
    if not edicao or not edicao_de_campo(edicao):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Edição de campo não encontrada.")
    return edicao


@router.get(
    "/edicoes",
    response_model=List[EdicaoOut],
    summary="Edições de campo abertas para coleta",
    description=(
        "Lista as edições atualmente abertas de pesquisas do tipo 'campo', para o "
        "pesquisador escolher qual irá preencher. Exclusivo para pesquisadores de campo."
    ),
    responses={403: {"description": "Exclusivo para pesquisadores de campo."}},
)
def listar_edicoes_campo(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_pesquisador),
):
    edicoes = db.scalars(
        select(Edicao)
        .join(Pesquisa, Edicao.pesquisa_id == Pesquisa.id)
        .where(Pesquisa.tipo == "campo")
        .options(selectinload(Edicao.pesquisa))
        .order_by(Edicao.id)
    ).all()

    # Só as que estão aceitando respostas hoje (ativas).
    hoje = date.today()
    abertas = [e for e in edicoes if edicao_aberta(e, hoje)]

    return [
        EdicaoOut(
            id=e.id,
            pesquisa_id=e.pesquisa_id,
            pesquisa_nome=e.pesquisa.nome,
            numero_edicao=e.numero_edicao,
            data_abertura=e.data_abertura,
            data_fechamento=e.data_fechamento,
            criado_em=e.criado_em,
            total_respostas=total_respostas(db, e.id),
            status=status_edicao(e, hoje),
        )
        for e in abertas
    ]


@router.get(
    "/edicoes/{edicao_id}",
    response_model=PublicEdicaoOut,
    summary="Formulário de uma edição de campo",
    description=(
        "Retorna o formulário (campos fixos + extras) de uma edição de campo para o "
        "pesquisador preencher. 404 se a edição não for de campo."
    ),
    responses={
        403: {"description": "Exclusivo para pesquisadores de campo."},
        404: {"description": "Edição de campo não encontrada."},
    },
)
def formulario_edicao_campo(
    edicao_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_pesquisador),
):
    edicao = _carregar_edicao_campo(db, edicao_id)
    return PublicEdicaoOut(
        edicao_id=edicao.id,
        pesquisa_id=edicao.pesquisa_id,
        pesquisa_nome=edicao.pesquisa.nome,
        descricao=edicao.pesquisa.descricao,
        numero_edicao=edicao.numero_edicao,
        data_abertura=edicao.data_abertura,
        data_fechamento=edicao.data_fechamento,
        aberta=edicao_aberta(edicao),
        campos=[CampoOut.model_validate(c) for c in campos_combinados(edicao)],
    )


@router.post(
    "/edicoes/{edicao_id}/respostas",
    response_model=RespostaOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar coleta de campo",
    description=(
        "Grava uma resposta coletada presencialmente. A resposta é sempre vinculada "
        "ao pesquisador autenticado (`usuario_id`) e à edição. Exclusivo para "
        "pesquisadores de campo e apenas para pesquisas do tipo 'campo'."
    ),
    responses={
        403: {"description": "Exclusivo para pesquisadores de campo."},
        404: {"description": "Edição de campo não encontrada."},
        409: {"description": "Edição não está aceitando respostas."},
        422: {"description": "Campo inválido ou duplicado na resposta."},
    },
)
def registrar_coleta_campo(
    edicao_id: int,
    dados: RespostaCreate,
    db: Session = Depends(get_db),
    pesquisador: Usuario = Depends(require_pesquisador),
):
    edicao = _carregar_edicao_campo(db, edicao_id)
    resposta = registrar_resposta(db, edicao, dados, usuario_id=pesquisador.id)

    return RespostaOut(
        id=resposta.id,
        edicao_id=resposta.edicao_id,
        timestamp_envio=resposta.timestamp_envio,
        total_campos=len(dados.respostas),
    )
