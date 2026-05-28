from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr


class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    role: Literal["servidor", "pesquisador_campo"]


class UsuarioOut(BaseModel):
    id: int
    nome: str
    email: EmailStr
    role: str
    criado_em: datetime
    model_config = {"from_attributes": True}
