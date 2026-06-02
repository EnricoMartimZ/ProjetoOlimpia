import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator

# Máscara de CNPJ: 00.000.000/0001-00 (só formato — não valida dígitos verificadores).
CNPJ_REGEX = re.compile(r"^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$")


class HospedagemBase(BaseModel):
    """Campos comuns de entrada de uma hospedagem."""

    nome_fantasia: str
    local: str
    categoria: str = "Hotel"
    estrelas: int = 0
    quartos: int = 0
    url_booking: Optional[str] = None
    foto_url: Optional[str] = None

    @field_validator("nome_fantasia", "local")
    @classmethod
    def nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Campo obrigatório não pode ser vazio.")
        return v.strip()

    @field_validator("categoria")
    @classmethod
    def categoria_default(cls, v: str) -> str:
        return v.strip() or "Hotel"

    @field_validator("estrelas")
    @classmethod
    def estrelas_validas(cls, v: int) -> int:
        if not 0 <= v <= 5:
            raise ValueError("estrelas deve estar entre 0 e 5.")
        return v

    @field_validator("quartos")
    @classmethod
    def quartos_positivo(cls, v: int) -> int:
        if v < 0:
            raise ValueError("quartos não pode ser negativo.")
        return v


class HospedagemCreate(HospedagemBase):
    """Dados para cadastrar uma hospedagem (cnpj é a chave primária)."""

    cnpj: str

    @field_validator("cnpj")
    @classmethod
    def cnpj_formato(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("cnpj não pode ser vazio.")
        if not CNPJ_REGEX.match(v):
            raise ValueError("cnpj deve estar no formato 00.000.000/0001-00.")
        return v


class HospedagemUpdate(BaseModel):
    """Dados para editar uma hospedagem. Todos os campos são opcionais (o cnpj não muda)."""

    nome_fantasia: Optional[str] = None
    local: Optional[str] = None
    categoria: Optional[str] = None
    estrelas: Optional[int] = None
    quartos: Optional[int] = None
    url_booking: Optional[str] = None
    foto_url: Optional[str] = None

    @field_validator("nome_fantasia", "local")
    @classmethod
    def nao_vazio(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Campo não pode ser vazio.")
        return v.strip() if v is not None else v

    @field_validator("estrelas")
    @classmethod
    def estrelas_validas(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not 0 <= v <= 5:
            raise ValueError("estrelas deve estar entre 0 e 5.")
        return v

    @field_validator("quartos")
    @classmethod
    def quartos_positivo(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("quartos não pode ser negativo.")
        return v


class HospedagemOut(BaseModel):
    """Representação de uma hospedagem retornada pela API."""

    cnpj: str
    nome_fantasia: str
    local: str
    categoria: str
    estrelas: int
    quartos: int
    url_booking: Optional[str]
    foto_url: Optional[str]
    criado_em: datetime

    model_config = {"from_attributes": True}
