from sqlalchemy import Column, Integer, Float, String, ForeignKey
from database import Base


class FigurinhaExclusiva(Base):
    __tablename__ = "figurinhas_exclusivas"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    produto_id = Column(
        Integer,
        ForeignKey("produtos.id"),
        nullable=False,
        unique=True
    )

    item_espaco_id = Column(
        Integer,
        ForeignKey("itens_espacos_clientes.id"),
        nullable=False,
        unique=True
    )

    valor_original = Column(
        Float,
        nullable=False
    )

    status = Column(
        String,
        nullable=False,
        default="ATIVA"
    )
