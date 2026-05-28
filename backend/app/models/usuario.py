from sqlalchemy import Column, DateTime, Integer, String, func
from app.database import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    senha_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "servidor" | "pesquisador_campo"
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
