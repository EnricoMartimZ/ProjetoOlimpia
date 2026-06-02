"""
Rotas de Diária Média (registro contínuo de preço por hospedagem).

O servidor consulta o Booking e insere o preço de uma hospedagem numa data.
Um registro por hospedagem por data. Exclusivo do servidor da Secretaria.
"""

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import require_servidor
from app.models.diaria_media import DiariaMedia
from app.models.hospedagem import Hospedagem
from app.models.usuario import Usuario
from app.schemas.diaria_media import (
    DiariaMediaCreate,
    DiariaMediaOut,
    HospedagemPendente,
)

router = APIRouter(prefix="/diarias", tags=["diaria-media"])


def _to_out(registro: DiariaMedia) -> DiariaMediaOut:
    """Monta a saída com o nome da hospedagem (join) para exibir na tabela."""
    return DiariaMediaOut(
        id=registro.id,
        hospedagem_cnpj=registro.hospedagem_cnpj,
        nome_fantasia=registro.hospedagem.nome_fantasia if registro.hospedagem else "",
        data=registro.data,
        preco=float(registro.preco),
        registrado_em=registro.registrado_em,
    )


@router.get(
    "/pendentes",
    response_model=List[HospedagemPendente],
    summary="Hospedagens pendentes de preenchimento",
    description=(
        "Lista as hospedagens que ainda **não** têm diária registrada na data "
        "de referência (default: hoje). Exclusivo para servidores."
    ),
    responses={403: {"description": "Apenas servidores acessam a Diária Média."}},
)
def listar_pendentes(
    data: Optional[date] = Query(None, description="Data de referência (default: hoje)."),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    ref = data or date.today()
    com_registro = select(DiariaMedia.hospedagem_cnpj).where(DiariaMedia.data == ref)
    pendentes = db.scalars(
        select(Hospedagem)
        .where(Hospedagem.cnpj.not_in(com_registro))
        .order_by(Hospedagem.nome_fantasia)
    ).all()
    return pendentes


@router.get(
    "",
    response_model=List[DiariaMediaOut],
    summary="Listar registros de diária média",
    description=(
        "Lista os registros de diária média já inseridos, das datas mais recentes "
        "às mais antigas. Filtros opcionais por hospedagem e por data. "
        "Exclusivo para servidores."
    ),
    responses={403: {"description": "Apenas servidores acessam a Diária Média."}},
)
def listar_diarias(
    hospedagem_cnpj: Optional[str] = Query(None, description="Filtra por hospedagem."),
    data: Optional[date] = Query(None, description="Filtra por data exata."),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    stmt = (
        select(DiariaMedia)
        .options(selectinload(DiariaMedia.hospedagem))
        .order_by(DiariaMedia.data.desc(), DiariaMedia.id.desc())
    )
    if hospedagem_cnpj:
        stmt = stmt.where(DiariaMedia.hospedagem_cnpj == hospedagem_cnpj)
    if data:
        stmt = stmt.where(DiariaMedia.data == data)

    registros = db.scalars(stmt).all()
    return [_to_out(r) for r in registros]


@router.post(
    "",
    response_model=DiariaMediaOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar diária média",
    description=(
        "Registra o preço de uma hospedagem numa data. Só pode haver um registro "
        "por hospedagem por data. Exclusivo para servidores."
    ),
    responses={
        403: {"description": "Apenas servidores podem registrar diárias."},
        404: {"description": "Hospedagem não encontrada."},
        409: {"description": "Já existe um registro para essa hospedagem nessa data."},
    },
)
def criar_diaria(
    dados: DiariaMediaCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    if not db.get(Hospedagem, dados.hospedagem_cnpj):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Hospedagem não encontrada.")

    existe = db.scalars(
        select(DiariaMedia).where(
            DiariaMedia.hospedagem_cnpj == dados.hospedagem_cnpj,
            DiariaMedia.data == dados.data,
        )
    ).first()
    if existe:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Já existe um registro de diária para essa hospedagem nessa data.",
        )

    registro = DiariaMedia(
        hospedagem_cnpj=dados.hospedagem_cnpj,
        data=dados.data,
        preco=dados.preco,
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return _to_out(registro)


@router.delete(
    "/{diaria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover um registro de diária média",
    description="Remove um registro específico de diária média. Exclusivo para servidores.",
    responses={
        403: {"description": "Apenas servidores podem remover registros."},
        404: {"description": "Registro não encontrado."},
    },
)
def remover_diaria(
    diaria_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    registro = db.get(DiariaMedia, diaria_id)
    if not registro:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Registro não encontrado.")

    db.delete(registro)
    db.commit()
