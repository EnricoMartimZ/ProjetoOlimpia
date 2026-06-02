from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import bcrypt

from app.database import get_db
from app.dependencies import require_servidor
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioOut, UsuarioRoleUpdate


def _salvar_ou_422(db: Session) -> None:
    """Commit e converte CheckViolation (constraint de role) em 422 legível."""
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if "role_check" in str(exc.orig):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Combinação de perfis não permitida pelo banco. "
                    "Aplique a migration 004_remove_usuario_role_check.sql e tente novamente."
                ),
            )
        raise

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.post(
    "",
    response_model=UsuarioOut,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"description": "E-mail já cadastrado."}},
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
        role=",".join(dados.roles),
    )
    db.add(novo)
    _salvar_ou_422(db)
    db.refresh(novo)
    return novo


@router.get("", response_model=list[UsuarioOut])
def listar_usuarios(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    return db.query(Usuario).order_by(Usuario.criado_em).all()


@router.delete(
    "/{usuario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        403: {"description": "Não é possível remover a própria conta."},
        404: {"description": "Usuário não encontrado."},
    },
)
def remover_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_servidor),
):
    if current_user.id == usuario_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não pode remover sua própria conta.",
        )
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    db.delete(usuario)
    db.commit()


@router.put(
    "/{usuario_id}/roles",
    response_model=UsuarioOut,
    responses={404: {"description": "Usuário não encontrado."}},
)
def atualizar_roles(
    usuario_id: int,
    dados: UsuarioRoleUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_servidor),
):
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    usuario.role = ",".join(dados.roles)
    _salvar_ou_422(db)
    db.refresh(usuario)
    return usuario
