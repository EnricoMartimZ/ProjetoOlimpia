from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class DiariaMediaCreate(BaseModel):
    """Dados para registrar uma diária média de uma hospedagem numa data."""

    hospedagem_cnpj: str
    data: date
    preco: float

    @field_validator("hospedagem_cnpj")
    @classmethod
    def cnpj_nao_vazio(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("hospedagem_cnpj não pode ser vazio.")
        return v

    @field_validator("preco")
    @classmethod
    def preco_positivo(cls, v: float) -> float:
        if v < 0:
            raise ValueError("preco não pode ser negativo.")
        return v


class DiariaMediaOut(BaseModel):
    """Representação de um registro de diária média retornado pela API."""

    id: int
    hospedagem_cnpj: str
    nome_fantasia: str  # nome da hospedagem (join) para exibir na tabela
    data: date
    preco: float
    registrado_em: datetime

    model_config = {"from_attributes": True}


class HospedagemPendente(BaseModel):
    """Hospedagem que ainda não teve a diária registrada na data de referência."""

    cnpj: str
    nome_fantasia: str
    categoria: str
    estrelas: int
    foto_url: Optional[str]
    url_booking: Optional[str]

    model_config = {"from_attributes": True}
