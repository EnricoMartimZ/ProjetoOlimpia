"""
Dependências compartilhadas pelos routers.

Níveis de acesso:
- `get_current_user`     → exige um token válido (401 se ausente/inválido)
- `require_servidor`     → exige token válido E role "servidor" (403 caso contrário)
- `require_pesquisador`  → exige token válido E role "pesquisador_campo" (403 caso contrário)
- `get_optional_user`    → aceita token, mas não exige (nunca levanta erro)
"""

from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.database import get_db
from app.models.usuario import Usuario
from app.services.auth import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    """Decodifica o JWT e retorna o usuário autenticado. Levanta 401 se inválido."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id: str = payload.get("sub")
        if usuario_id is None:
            raise ValueError
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario = db.get(Usuario, int(usuario_id))
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return usuario


def require_servidor(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    """
    Garante que o usuário autenticado tem role "servidor".
    Use em rotas exclusivas da Secretaria (criar pesquisa, lançar edição,
    consultar/remover respostas). Levanta 403 para qualquer outra role.
    """
    if usuario.role != "servidor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta ação é exclusiva para servidores da Secretaria.",
        )
    return usuario


def require_pesquisador(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    """
    Garante que o usuário autenticado tem role "pesquisador_campo".
    Use nas rotas de coleta de campo (listar/abrir/responder pesquisas do tipo
    "campo"). Levanta 403 para qualquer outra role (inclusive servidor).
    """
    if usuario.role != "pesquisador_campo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta ação é exclusiva para pesquisadores de campo.",
        )
    return usuario


def get_optional_user(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[Usuario]:
    """
    Versão opcional de get_current_user: usada em rotas públicas que aceitam
    autenticação. Retorna o usuário se houver um Bearer token válido no header,
    ou None caso contrário — nunca levanta 401.
    """
    auth = request.headers.get("Authorization", "")
    if not auth.lower().startswith("bearer "):
        return None
    token = auth[7:].strip()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id = payload.get("sub")
        if usuario_id is None:
            return None
        return db.get(Usuario, int(usuario_id))
    except (JWTError, ValueError):
        return None
