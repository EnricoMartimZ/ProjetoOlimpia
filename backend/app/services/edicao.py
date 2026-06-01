"""Lógica compartilhada de edições — usada pelos routers de edições e público."""

import hashlib
from datetime import date
from typing import List, Optional

from sqlalchemy import select, text
from sqlalchemy.orm import Session, selectinload

from app.models.edicao import Edicao
from app.models.pesquisa import Campo, Pesquisa


def status_edicao(edicao: Edicao, hoje: Optional[date] = None) -> str:
    """
    Deriva o status de uma edição a partir do período.
    - agendada: ainda não abriu (data_abertura > hoje)
    - encerrada: já fechou (data_fechamento < hoje)
    - ativa: dentro do período (aceitando respostas)
    """
    hoje = hoje or date.today()
    if edicao.data_abertura > hoje:
        return "agendada"
    if edicao.data_fechamento is not None and edicao.data_fechamento < hoje:
        return "encerrada"
    return "ativa"


def edicao_aberta(edicao: Edicao, hoje: Optional[date] = None) -> bool:
    """True se a edição está aceitando respostas hoje."""
    return status_edicao(edicao, hoje) == "ativa"


def edicao_de_campo(edicao: Edicao) -> bool:
    """True se a edição pertence a uma pesquisa do tipo "campo" (coleta presencial)."""
    return edicao.pesquisa.tipo == "campo"


def gerar_hash_campo_edicao(edicao_id: int, texto: str) -> str:
    """SHA-256 de 'e{edicao_id}:{texto}' — unicidade dos campos extras por edição."""
    return hashlib.sha256(f"e{edicao_id}:{texto}".encode()).hexdigest()


def total_respostas(db: Session, edicao_id: int) -> int:
    """Conta respostas de uma edição via SQL direto (model Resposta vem na Task 3)."""
    return db.execute(
        text("SELECT COUNT(*) FROM resposta WHERE edicao_id = :eid"),
        {"eid": edicao_id},
    ).scalar() or 0


def load_edicao_com_campos(db: Session, edicao_id: int) -> Optional[Edicao]:
    """Carrega a edição com seus campos extras e a pesquisa (com campos fixos)."""
    return db.scalars(
        select(Edicao)
        .where(Edicao.id == edicao_id)
        .options(
            selectinload(Edicao.campos),
            selectinload(Edicao.pesquisa).selectinload(Pesquisa.campos),
        )
    ).first()


def campos_combinados(edicao: Edicao) -> List[Campo]:
    """
    Campos fixos da pesquisa + campos extras da edição.
    Fixos primeiro (ordenados por ordem), depois os extras (ordenados por ordem).
    """
    fixos = sorted(edicao.pesquisa.campos, key=lambda c: c.ordem)
    extras = sorted(edicao.campos, key=lambda c: c.ordem)
    return fixos + extras
