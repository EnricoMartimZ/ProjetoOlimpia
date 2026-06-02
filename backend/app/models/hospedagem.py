from sqlalchemy import Column, DateTime, Integer, SmallInteger, String, Text, func
from sqlalchemy.orm import relationship

from app.database import Base


class Hospedagem(Base):
    """
    Hotel, pousada ou resort cadastrado para a pesquisa de Diária Média.
    Guarda os dados *fixos* da hospedagem (não mudam a cada coleta de preço).
    O link do Booking (`url_booking`) é fixo por hospedagem.
    """

    __tablename__ = "hospedagem"

    cnpj = Column(String(18), primary_key=True)
    nome_fantasia = Column(String(150), nullable=False)
    local = Column(String(200), nullable=False)
    categoria = Column(String(50), nullable=False, server_default="Hotel", default="Hotel")
    estrelas = Column(SmallInteger, nullable=False, server_default="0", default=0)
    quartos = Column(Integer, nullable=False, server_default="0", default=0)
    url_booking = Column(Text, nullable=True)
    foto_url = Column(Text, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    diarias = relationship(
        "DiariaMedia",
        back_populates="hospedagem",
        cascade="all, delete-orphan",
        order_by="DiariaMedia.data.desc()",
    )
