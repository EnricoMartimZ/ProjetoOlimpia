from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import bcrypt

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioOut

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.post(
    "",
    response_model=UsuarioOut,
    status_code=status.HTTP_201_CREATED,
    responses={
        409: {"description": "E-mail já cadastrado."},
    },
)
def criar_usuario(dados: UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.email == dados.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail já cadastrado.",
        )

    novo = Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=bcrypt.hashpw(dados.senha.encode(), bcrypt.gensalt()).decode(),
        role=dados.role,
    )

    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo
