from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class DiariaMedia(Base):
    """
    Registro contínuo de preço por hospedagem, inserido manualmente pelo
    servidor consultando o Booking. Guarda só o dado que varia por coleta:
    a data e o preço. Os dados fixos ficam em `hospedagem`.

    Um registro por hospedagem por data (uk_diaria_hospedagem_data).
    """

    __tablename__ = "diaria_media"

    id = Column(Integer, primary_key=True)
    hospedagem_cnpj = Column(
        String(18),
        ForeignKey("hospedagem.cnpj", ondelete="CASCADE"),
        nullable=False,
    )
    data = Column(Date, nullable=False)
    preco = Column(Numeric(10, 2), nullable=False)
    registrado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    hospedagem = relationship("Hospedagem", back_populates="diarias")

    __table_args__ = (
        UniqueConstraint("hospedagem_cnpj", "data", name="uk_diaria_hospedagem_data"),
        CheckConstraint("preco >= 0", name="ck_preco_positivo"),
    )
