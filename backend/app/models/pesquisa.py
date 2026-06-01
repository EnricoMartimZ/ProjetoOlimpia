import enum

from sqlalchemy import Boolean, Column, DateTime, Enum as SAEnum, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship

from app.database import Base


class TipoCampoEnum(str, enum.Enum):
    """Tipos de campo disponíveis. Alinhado com FieldType do frontend (types/index.ts)."""

    texto = "texto"
    texto_longo = "texto_longo"
    numero = "numero"
    multipla_escolha = "multipla_escolha"
    data = "data"
    escala = "escala"
    sim_nao = "sim_nao"


# Em produção (PostgreSQL) `opcoes` é um TEXT[]. Nos testes (SQLite, que não tem
# tipo array nativo) o mesmo dado é serializado como JSON. O `with_variant` mantém
# o model único e o código Python continua lidando com listas em ambos os casos.
OPCOES_TYPE = ARRAY(String).with_variant(JSON, "sqlite")


class TipoPesquisaEnum(str, enum.Enum):
    """
    Natureza da pesquisa:
    - publica: respondida por qualquer pessoa pelo link público (cidadão/hóspede).
    - campo: coletada presencialmente por um pesquisador de campo autenticado.
    """

    publica = "publica"
    campo = "campo"


class Pesquisa(Base):
    """Template de formulário. Define os campos fixos reutilizados em todas as edições."""

    __tablename__ = "pesquisa"

    id = Column(Integer, primary_key=True)
    nome = Column(String(150), unique=True, nullable=False)
    descricao = Column(Text)
    # "publica" (link público) ou "campo" (coleta presencial por pesquisador).
    # String simples (como usuario.role) para mudar o mínimo no banco — sem novo ENUM.
    tipo = Column(String(20), nullable=False, server_default="publica", default="publica")
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    campos = relationship(
        "Campo",
        foreign_keys="Campo.pesquisa_id",
        back_populates="pesquisa",
        cascade="all, delete-orphan",
        order_by="Campo.ordem",
    )
    edicoes = relationship(
        "Edicao",
        back_populates="pesquisa",
        cascade="all, delete-orphan",
        order_by="Edicao.numero_edicao",
    )


class Campo(Base):
    """
    Pergunta de um formulário.
    Pertence OU a uma Pesquisa (campo fixo) OU a uma Edição (campo extra).
    A constraint ck_campo_origem no banco garante que nunca tem os dois ou nenhum.
    """

    __tablename__ = "campo"

    id = Column(Integer, primary_key=True)
    # SHA-256 de f"p{pesquisa_id}:{texto_pergunta}" para unicidade por pesquisa
    hash_pergunta = Column(String(64), unique=True, nullable=False)
    texto_pergunta = Column(Text, nullable=False)
    tipo = Column(
        SAEnum(TipoCampoEnum, name="tipo_campo", create_type=False),
        nullable=False,
    )
    opcoes = Column(OPCOES_TYPE, nullable=False, server_default="{}", default=list)
    obrigatorio = Column(Boolean, nullable=False, server_default="false", default=False)
    ordem = Column(Integer, nullable=False, server_default="0", default=0)
    regex = Column(Text, server_default="", default="")
    pesquisa_id = Column(Integer, ForeignKey("pesquisa.id", ondelete="CASCADE"), nullable=True)
    edicao_id = Column(Integer, ForeignKey("edicao.id", ondelete="CASCADE"), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    pesquisa = relationship("Pesquisa", foreign_keys=[pesquisa_id], back_populates="campos")
    edicao = relationship("Edicao", foreign_keys=[edicao_id], back_populates="campos")
