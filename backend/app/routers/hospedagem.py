"""
Rotas de Hospedagem (hotéis/pousadas/resorts da pesquisa de Diária Média).

CRUD exclusivo do servidor da Secretaria — a interface dedicada de Diária Média
exige login. Os dados aqui são os *fixos* da hospedagem; os preços por data ficam
em `/diarias`.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_servidor
from app.models.hospedagem import Hospedagem
from app.models.usuario import Usuario
from app.schemas.hospedagem import HospedagemCreate, HospedagemOut, HospedagemUpdate

router = APIRouter(prefix="/hospedagens", tags=["hospedagens"])


@router.get(
    "",
    response_model=List[HospedagemOut],
    summary="Listar hospedagens",
    description="Lista todas as hospedagens cadastradas. Exclusivo para servidores.",
    responses={403: {"description": "Apenas servidores acessam a Diária Média."}},
)
def listar_hospedagens(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    return db.scalars(select(Hospedagem).order_by(Hospedagem.nome_fantasia)).all()


@router.post(
    "",
    response_model=HospedagemOut,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar hospedagem",
    description="Cadastra uma nova hospedagem. Exclusivo para servidores.",
    responses={
        403: {"description": "Apenas servidores podem cadastrar hospedagens."},
        409: {"description": "Já existe uma hospedagem com esse CNPJ."},
    },
)
def criar_hospedagem(
    dados: HospedagemCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    if db.get(Hospedagem, dados.cnpj):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Já existe uma hospedagem com o CNPJ {dados.cnpj}.",
        )

    hospedagem = Hospedagem(**dados.model_dump())
    db.add(hospedagem)
    db.commit()
    db.refresh(hospedagem)
    return hospedagem


@router.get(
    "/{cnpj:path}",
    response_model=HospedagemOut,
    summary="Detalhar hospedagem",
    responses={
        403: {"description": "Apenas servidores acessam a Diária Média."},
        404: {"description": "Hospedagem não encontrada."},
    },
)
def detalhar_hospedagem(
    cnpj: str,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    hospedagem = db.get(Hospedagem, cnpj)
    if not hospedagem:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Hospedagem não encontrada.")
    return hospedagem


@router.put(
    "/{cnpj:path}",
    response_model=HospedagemOut,
    summary="Atualizar hospedagem",
    description="Atualiza os dados de uma hospedagem (o CNPJ não muda). Exclusivo para servidores.",
    responses={
        403: {"description": "Apenas servidores podem editar hospedagens."},
        404: {"description": "Hospedagem não encontrada."},
    },
)
def atualizar_hospedagem(
    cnpj: str,
    dados: HospedagemUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    hospedagem = db.get(Hospedagem, cnpj)
    if not hospedagem:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Hospedagem não encontrada.")

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(hospedagem, campo, valor)

    db.commit()
    db.refresh(hospedagem)
    return hospedagem


@router.delete(
    "/{cnpj:path}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover hospedagem",
    description=(
        "Remove uma hospedagem e, em cascata, todos os seus registros de "
        "diária média. Exclusivo para servidores."
    ),
    responses={
        403: {"description": "Apenas servidores podem remover hospedagens."},
        404: {"description": "Hospedagem não encontrada."},
    },
)
def remover_hospedagem(
    cnpj: str,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    hospedagem = db.get(Hospedagem, cnpj)
    if not hospedagem:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Hospedagem não encontrada.")

    db.delete(hospedagem)
    db.commit()
