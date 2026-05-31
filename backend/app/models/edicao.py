from sqlalchemy import Column, DateTime, Integer, Date, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.database import Base


class Edicao(Base):
    """Instância de uma Pesquisa em um período específico. Gera o link público."""

    __tablename__ = "edicao"

    id = Column(Integer, primary_key=True)
    pesquisa_id = Column(Integer, ForeignKey("pesquisa.id", ondelete="CASCADE"), nullable=False)
    numero_edicao = Column(Integer, nullable=False)
    data_abertura = Column(Date, nullable=False)
    data_fechamento = Column(Date, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    pesquisa = relationship("Pesquisa", back_populates="edicoes")
    campos = relationship(
        "Campo",
        foreign_keys="Campo.edicao_id",
        back_populates="edicao",
        cascade="all, delete-orphan",
        order_by="Campo.ordem",
    )

    __table_args__ = (
        UniqueConstraint("pesquisa_id", "numero_edicao", name="uk_edicao_pesquisa"),
    )
