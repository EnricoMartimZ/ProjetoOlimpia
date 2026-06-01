from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, field_validator


class ColetouItem(BaseModel):
    """Uma resposta a um campo específico do formulário."""

    campo_id: int
    atributo_texto: str


class RespostaCreate(BaseModel):
    """Envio de um formulário: a lista de respostas por campo."""

    respostas: List[ColetouItem]

    @field_validator("respostas")
    @classmethod
    def nao_vazia(cls, v: List[ColetouItem]) -> List[ColetouItem]:
        if not v:
            raise ValueError("É necessário enviar ao menos uma resposta.")
        return v


class RespostaOut(BaseModel):
    """Confirmação de um envio registrado."""

    id: int
    edicao_id: int
    timestamp_envio: datetime
    total_campos: int


# --- Tabulação para o admin (ConsultarPage) ---

class CampoHeader(BaseModel):
    """Cabeçalho de coluna da tabela de respostas."""

    id: int
    texto_pergunta: str
    tipo: str


class RespostaLinha(BaseModel):
    """Uma linha da tabela: uma resposta com seus valores por campo."""

    resposta_id: int
    timestamp_envio: datetime
    usuario_id: Optional[int]
    # Nome do pesquisador que coletou (None se resposta pública anônima).
    usuario_nome: Optional[str]
    # valores[str(campo_id)] = atributo_texto (chaves são string por ser JSON)
    valores: Dict[str, str]


class RespostasTabela(BaseModel):
    """Respostas de uma edição, tabuladas e paginadas."""

    total: int
    pagina: int
    por_pagina: int
    campos_header: List[CampoHeader]
    dados: List[RespostaLinha]
