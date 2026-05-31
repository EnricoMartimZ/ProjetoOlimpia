from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.database import Base


class Resposta(Base):
    """Registro de um envio de formulário por uma Edição."""

    __tablename__ = "resposta"

    id = Column(Integer, primary_key=True)
    edicao_id = Column(Integer, ForeignKey("edicao.id", ondelete="CASCADE"), nullable=False)
    # Preenchido quando um pesquisador de campo logado registra a resposta; NULL se anônima.
    usuario_id = Column(Integer, ForeignKey("usuario.id", ondelete="SET NULL"), nullable=True)
    timestamp_envio = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    coletas = relationship(
        "Coletou",
        back_populates="resposta",
        cascade="all, delete-orphan",
    )


class Coletou(Base):
    """Relação N:N entre Campo e Resposta — guarda o texto bruto coletado do formulário."""

    __tablename__ = "coletou"

    id = Column(Integer, primary_key=True)
    campo_id = Column(Integer, ForeignKey("campo.id", ondelete="CASCADE"), nullable=False)
    resposta_id = Column(Integer, ForeignKey("resposta.id", ondelete="CASCADE"), nullable=False)
    atributo_texto = Column(Text, nullable=False)

    resposta = relationship("Resposta", back_populates="coletas")

    __table_args__ = (
        UniqueConstraint("campo_id", "resposta_id", name="uk_coletou_campo_resposta"),
    )
