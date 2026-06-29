from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel

from app.schemas.pesquisa import CampoCreate, CampoOut


class EdicaoCreate(BaseModel):
    """Dados para lançar uma nova edição de uma pesquisa."""

    data_abertura: date
    data_fechamento: Optional[date] = None
    # Campos extras exclusivos desta edição (além dos campos fixos da pesquisa)
    campos_extras: List[CampoCreate] = []


class EdicaoOut(BaseModel):
    """Representação de uma edição retornada pela API (área autenticada)."""

    id: int
    pesquisa_id: int
    pesquisa_nome: str
    numero_edicao: int
    data_abertura: date
    data_fechamento: Optional[date]
    criado_em: datetime
    total_respostas: int
    status: str  # "agendada" | "ativa" | "encerrada"


class EdicaoStatusUpdate(BaseModel):
    """Altera o status de uma edição ajustando as datas."""
    acao: Literal["ativar", "encerrar"]


class PublicEdicaoOut(BaseModel):
    """
    Formulário público de uma edição (sem autenticação).
    Inclui os campos fixos da pesquisa + os campos extras da edição.
    """

    edicao_id: int
    pesquisa_id: int
    pesquisa_nome: str
    descricao: Optional[str]
    numero_edicao: int
    data_abertura: date
    data_fechamento: Optional[date]
    aberta: bool  # se está aceitando respostas hoje
    campos: List[CampoOut]
