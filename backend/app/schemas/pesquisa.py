from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, field_validator

from app.models.pesquisa import TipoCampoEnum


class CampoCreate(BaseModel):
    """Dados para criar um campo de formulário."""

    texto_pergunta: str
    tipo: TipoCampoEnum
    opcoes: List[str] = []
    obrigatorio: bool = False
    ordem: int = 0

    @field_validator("texto_pergunta")
    @classmethod
    def texto_nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("texto_pergunta não pode ser vazio.")
        return v.strip()


class PesquisaCreate(BaseModel):
    """Dados para criar uma pesquisa com seus campos base."""

    nome: str
    descricao: str = ""
    campos: List[CampoCreate] = []

    @field_validator("nome")
    @classmethod
    def nome_nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("nome não pode ser vazio.")
        return v.strip()


class PesquisaUpdate(BaseModel):
    """Dados para atualizar uma pesquisa. Todos os campos são opcionais."""

    nome: Optional[str] = None
    descricao: Optional[str] = None
    campos: Optional[List[CampoCreate]] = None


class CampoOut(BaseModel):
    """Representação de um campo retornada pela API."""

    id: int
    hash_pergunta: str
    texto_pergunta: str
    tipo: TipoCampoEnum
    opcoes: List[str]
    obrigatorio: bool
    ordem: int

    model_config = {"from_attributes": True}


class PesquisaListOut(BaseModel):
    """Representação resumida de pesquisa usada na listagem."""

    id: int
    nome: str
    descricao: Optional[str]
    status: str
    total_edicoes: int
    # ID da edição cujo link público deve ser compartilhado (ativa, ou a mais recente). None se rascunho.
    edicao_atual_id: Optional[int]


class PesquisaOut(BaseModel):
    """Representação completa de pesquisa com seus campos."""

    id: int
    nome: str
    descricao: Optional[str]
    criado_em: datetime
    status: str
    total_edicoes: int
    edicao_atual_id: Optional[int]
    campos: List[CampoOut]
