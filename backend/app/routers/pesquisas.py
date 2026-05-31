"""
Rotas de Pesquisas (templates de formulário).

Uma Pesquisa agrupa campos base reutilizados em todas as suas Edições.
O `status` (rascunho/ativa/encerrada) e o `edicao_atual_id` (link público a
compartilhar) são derivados das edições — não ficam gravados na tabela.
"""

import hashlib
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import require_servidor
from app.models.edicao import Edicao
from app.models.pesquisa import Campo, Pesquisa
from app.models.usuario import Usuario
from app.schemas.pesquisa import (
    CampoOut,
    PesquisaCreate,
    PesquisaListOut,
    PesquisaOut,
    PesquisaUpdate,
)

router = APIRouter(prefix="/pesquisas", tags=["pesquisas"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _calcular_status(edicoes: List[Edicao]) -> str:
    """
    Deriva o status de uma pesquisa a partir das suas edições.
    - rascunho: nenhuma edição criada
    - ativa: pelo menos uma edição com período aberto hoje
    - encerrada: tem edições, mas todas com data_fechamento no passado
    """
    if not edicoes:
        return "rascunho"
    hoje = date.today()
    for e in edicoes:
        if e.data_abertura <= hoje and (e.data_fechamento is None or e.data_fechamento >= hoje):
            return "ativa"
    return "encerrada"


def _edicao_atual_id(edicoes: List[Edicao]) -> Optional[int]:
    """
    ID da edição cujo link público deve ser compartilhado:
    a edição ativa hoje, ou — se nenhuma estiver ativa — a mais recente.
    None se a pesquisa não tem edições.
    """
    if not edicoes:
        return None
    hoje = date.today()
    for e in edicoes:
        if e.data_abertura <= hoje and (e.data_fechamento is None or e.data_fechamento >= hoje):
            return e.id
    return max(edicoes, key=lambda e: e.numero_edicao).id


def _gerar_hash(pesquisa_id: int, texto: str) -> str:
    """
    SHA-256 de 'p{pesquisa_id}:{texto}' para unicidade por pesquisa.
    Inclui o ID para que a mesma pergunta em pesquisas diferentes gere hashes distintos.
    """
    return hashlib.sha256(f"p{pesquisa_id}:{texto}".encode()).hexdigest()


def _load_pesquisa(db: Session, pesquisa_id: int) -> Optional[Pesquisa]:
    """Busca pesquisa com campos e edições carregados (eager load)."""
    return db.scalars(
        select(Pesquisa)
        .where(Pesquisa.id == pesquisa_id)
        .options(
            selectinload(Pesquisa.campos),
            selectinload(Pesquisa.edicoes),
        )
    ).first()


def _build_out(p: Pesquisa) -> PesquisaOut:
    """Constrói o schema de saída computando os campos derivados."""
    campos_ordenados = sorted(p.campos, key=lambda c: c.ordem)
    return PesquisaOut(
        id=p.id,
        nome=p.nome,
        descricao=p.descricao,
        criado_em=p.criado_em,
        status=_calcular_status(p.edicoes),
        total_edicoes=len(p.edicoes),
        edicao_atual_id=_edicao_atual_id(p.edicoes),
        campos=[CampoOut.model_validate(c) for c in campos_ordenados],
    )


def _criar_campos(db: Session, pesquisa_id: int, campos_data: list) -> None:
    """Cria os registros de Campo no banco para uma pesquisa."""
    for i, campo_data in enumerate(campos_data):
        ordem = campo_data.ordem if campo_data.ordem else i
        db.add(Campo(
            hash_pergunta=_gerar_hash(pesquisa_id, campo_data.texto_pergunta),
            texto_pergunta=campo_data.texto_pergunta,
            tipo=campo_data.tipo,
            opcoes=campo_data.opcoes,
            obrigatorio=campo_data.obrigatorio,
            ordem=ordem,
            pesquisa_id=pesquisa_id,
        ))


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=list[PesquisaListOut],
    summary="Listar pesquisas",
    description="Retorna todas as pesquisas com status derivado (rascunho/ativa/encerrada).",
)
def listar_pesquisas(db: Session = Depends(get_db)):
    pesquisas = db.scalars(
        select(Pesquisa)
        .options(selectinload(Pesquisa.edicoes))
        .order_by(Pesquisa.id)
    ).all()

    return [
        PesquisaListOut(
            id=p.id,
            nome=p.nome,
            descricao=p.descricao,
            status=_calcular_status(p.edicoes),
            total_edicoes=len(p.edicoes),
            edicao_atual_id=_edicao_atual_id(p.edicoes),
        )
        for p in pesquisas
    ]


@router.post(
    "",
    response_model=PesquisaOut,
    status_code=status.HTTP_201_CREATED,
    summary="Criar pesquisa",
    description="Cria uma nova pesquisa com seus campos base. Exclusivo para servidores.",
    responses={
        403: {"description": "Apenas servidores podem criar pesquisas."},
        409: {"description": "Já existe uma pesquisa com esse nome."},
    },
)
def criar_pesquisa(
    dados: PesquisaCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    if db.scalars(select(Pesquisa).where(Pesquisa.nome == dados.nome)).first():
        raise HTTPException(status.HTTP_409_CONFLICT, f'Já existe uma pesquisa com o nome "{dados.nome}".')

    pesquisa = Pesquisa(nome=dados.nome, descricao=dados.descricao or None)
    db.add(pesquisa)
    db.flush()  # Gera o ID para usar no hash dos campos

    _criar_campos(db, pesquisa.id, dados.campos)
    db.commit()

    return _build_out(_load_pesquisa(db, pesquisa.id))


@router.get(
    "/{pesquisa_id}",
    response_model=PesquisaOut,
    summary="Detalhar pesquisa",
    description="Retorna uma pesquisa com todos os seus campos base.",
    responses={404: {"description": "Pesquisa não encontrada."}},
)
def detalhar_pesquisa(pesquisa_id: int, db: Session = Depends(get_db)):
    p = _load_pesquisa(db, pesquisa_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pesquisa não encontrada.")
    return _build_out(p)


@router.put(
    "/{pesquisa_id}",
    response_model=PesquisaOut,
    summary="Atualizar pesquisa",
    description=(
        "Atualiza nome, descrição e campos base de uma pesquisa. "
        "Os campos existentes são substituídos pelos enviados. "
        "Exclusivo para servidores."
    ),
    responses={
        403: {"description": "Apenas servidores podem editar pesquisas."},
        404: {"description": "Pesquisa não encontrada."},
        409: {"description": "Já existe outra pesquisa com esse nome."},
    },
)
def atualizar_pesquisa(
    pesquisa_id: int,
    dados: PesquisaUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    p = _load_pesquisa(db, pesquisa_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pesquisa não encontrada.")

    if dados.nome is not None:
        conflito = db.scalars(
            select(Pesquisa).where(Pesquisa.nome == dados.nome, Pesquisa.id != pesquisa_id)
        ).first()
        if conflito:
            raise HTTPException(status.HTTP_409_CONFLICT, f'Já existe uma pesquisa com o nome "{dados.nome}".')
        p.nome = dados.nome

    if dados.descricao is not None:
        p.descricao = dados.descricao or None

    if dados.campos is not None:
        # Substitui todos os campos base. Flush garante que os hashes antigos são liberados
        # antes de criar os novos (evita violação do UNIQUE em hash_pergunta).
        db.query(Campo).filter(Campo.pesquisa_id == pesquisa_id).delete()
        db.flush()
        _criar_campos(db, pesquisa_id, dados.campos)

    db.commit()
    return _build_out(_load_pesquisa(db, pesquisa_id))


@router.delete(
    "/{pesquisa_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir pesquisa",
    description=(
        "Remove a pesquisa e todos os seus dados em cascata "
        "(campos, edições, respostas). Exclusivo para servidores."
    ),
    responses={
        403: {"description": "Apenas servidores podem excluir pesquisas."},
        404: {"description": "Pesquisa não encontrada."},
    },
)
def excluir_pesquisa(
    pesquisa_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    p = db.get(Pesquisa, pesquisa_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pesquisa não encontrada.")

    db.delete(p)
    db.commit()
