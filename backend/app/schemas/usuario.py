from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, computed_field, field_validator

RoleType = Literal["servidor", "pesquisador_campo"]


class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    roles: list[RoleType]

    @field_validator("roles")
    @classmethod
    def roles_nao_vazio(cls, v: list) -> list:
        if not v:
            raise ValueError("O usuário deve ter pelo menos uma role.")
        return list(dict.fromkeys(v))  # deduplica mantendo ordem


class UsuarioRoleUpdate(BaseModel):
    roles: list[RoleType]

    @field_validator("roles")
    @classmethod
    def roles_nao_vazio(cls, v: list) -> list:
        if not v:
            raise ValueError("O usuário deve ter pelo menos uma role.")
        return list(dict.fromkeys(v))


class UsuarioOut(BaseModel):
    id: int
    nome: str
    email: EmailStr
    role: str  # string armazenada, ex: "servidor" ou "servidor,pesquisador_campo"
    criado_em: datetime
    model_config = {"from_attributes": True}

    @computed_field
    @property
    def roles(self) -> list[str]:
        return self.role.split(",")
