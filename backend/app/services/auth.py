from datetime import datetime, timedelta, timezone
import os

from jose import jwt
import bcrypt

from app.models.usuario import Usuario

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 8


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return bcrypt.checkpw(senha.encode(), senha_hash.encode())


def gerar_token(usuario: Usuario) -> str:
    payload = {
        "sub": str(usuario.id),
        "nome": usuario.nome,
        "role": usuario.role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
