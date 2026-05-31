"""
Rotas de Edições (instâncias de uma Pesquisa num período).

Cada edição gera um link público (`/pesquisa/{edicaoId}`) e pode ter campos
extras próprios, além dos campos fixos herdados da pesquisa.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import require_servidor
from app.models.edicao import Edicao
from app.models.pesquisa import Campo, Pesquisa
from app.models.usuario import Usuario
from app.schemas.edicao import EdicaoCreate, EdicaoOut
from app.schemas.pesquisa import CampoOut
from app.services.edicao import (
    campos_combinados,
    gerar_hash_campo_edicao,
    load_edicao_com_campos,
    status_edicao,
    total_respostas,
)

router = APIRouter(tags=["edicoes"])


def _edicao_out(db: Session, edicao: Edicao) -> EdicaoOut:
    """Monta o schema de saída de uma edição com campos derivados."""
    return EdicaoOut(
        id=edicao.id,
        pesquisa_id=edicao.pesquisa_id,
        pesquisa_nome=edicao.pesquisa.nome,
        numero_edicao=edicao.numero_edicao,
        data_abertura=edicao.data_abertura,
        data_fechamento=edicao.data_fechamento,
        criado_em=edicao.criado_em,
        total_respostas=total_respostas(db, edicao.id),
        status=status_edicao(edicao),
    )


@router.get(
    "/pesquisas/{pesquisa_id}/edicoes",
    response_model=List[EdicaoOut],
    summary="Listar edições de uma pesquisa",
    responses={404: {"description": "Pesquisa não encontrada."}},
)
def listar_edicoes(pesquisa_id: int, db: Session = Depends(get_db)):
    pesquisa = db.scalars(
        select(Pesquisa)
        .where(Pesquisa.id == pesquisa_id)
        .options(selectinload(Pesquisa.edicoes))
    ).first()
    if not pesquisa:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pesquisa não encontrada.")

    edicoes = sorted(pesquisa.edicoes, key=lambda e: e.numero_edicao)
    return [_edicao_out(db, e) for e in edicoes]


@router.post(
    "/pesquisas/{pesquisa_id}/edicoes",
    response_model=EdicaoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Lançar nova edição",
    description=(
        "Cria uma nova edição da pesquisa, auto-incrementando o número da edição. "
        "Pode incluir campos extras exclusivos da edição. Exclusivo para servidores."
    ),
    responses={
        403: {"description": "Apenas servidores podem lançar edições."},
        404: {"description": "Pesquisa não encontrada."},
    },
)
def lancar_edicao(
    pesquisa_id: int,
    dados: EdicaoCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    if dados.data_fechamento and dados.data_fechamento < dados.data_abertura:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "data_fechamento não pode ser anterior a data_abertura.",
        )

    pesquisa = db.get(Pesquisa, pesquisa_id)
    if not pesquisa:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pesquisa não encontrada.")

    # Auto-incrementa o número da edição (max atual + 1)
    proximo_numero = (db.scalar(
        select(func.max(Edicao.numero_edicao)).where(Edicao.pesquisa_id == pesquisa_id)
    ) or 0) + 1

    edicao = Edicao(
        pesquisa_id=pesquisa_id,
        numero_edicao=proximo_numero,
        data_abertura=dados.data_abertura,
        data_fechamento=dados.data_fechamento,
    )
    db.add(edicao)
    db.flush()  # Gera o ID para usar no hash dos campos extras

    for i, campo_data in enumerate(dados.campos_extras):
        ordem = campo_data.ordem if campo_data.ordem else i
        db.add(Campo(
            hash_pergunta=gerar_hash_campo_edicao(edicao.id, campo_data.texto_pergunta),
            texto_pergunta=campo_data.texto_pergunta,
            tipo=campo_data.tipo,
            opcoes=campo_data.opcoes,
            obrigatorio=campo_data.obrigatorio,
            ordem=ordem,
            edicao_id=edicao.id,
        ))

    db.commit()
    db.refresh(edicao)
    # Recarrega com a pesquisa para o nome
    edicao = db.scalars(
        select(Edicao).where(Edicao.id == edicao.id).options(selectinload(Edicao.pesquisa))
    ).first()
    return _edicao_out(db, edicao)


@router.get(
    "/edicoes/{edicao_id}/campos",
    response_model=List[CampoOut],
    summary="Campos de uma edição",
    description="Campos fixos da pesquisa + campos extras da edição, ordenados.",
    responses={404: {"description": "Edição não encontrada."}},
)
def campos_da_edicao(edicao_id: int, db: Session = Depends(get_db)):
    edicao = load_edicao_com_campos(db, edicao_id)
    if not edicao:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Edição não encontrada.")
    return [CampoOut.model_validate(c) for c in campos_combinados(edicao)]
