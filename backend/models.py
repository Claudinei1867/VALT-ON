from sqlalchemy import (  # type: ignore[import-not-found]
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
)

from database import Base

# =========================================================
# PRODUTOS
# =========================================================


class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    descricao = Column(String)
    preco = Column(Float, nullable=False)
    categoria = Column(String)
    estoque = Column(Integer, default=0)
    prazo_entrega_dias = Column(
        "prazo_entrega",
        Integer,
        nullable=False,
        default=3
    )
    imagem = Column(String, nullable=True)


# =========================================================
# CLIENTES
# =========================================================

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    senha = Column(String, nullable=False)
    saldo_cvt = Column(Float, nullable=False, default=1000.0)
    ultimo_credito_cvt = Column(String, nullable=True)

    email_confirmado = Column(
        Integer,
        nullable=False,
        default=0
    )

    token_confirmacao_email = Column(
        String,
        nullable=True,
        unique=True,
        index=True
    )

    token_confirmacao_expira_em = Column(
        String,
        nullable=True
    )

    token_recuperacao_senha = Column(
        String,
        nullable=True,
        unique=True,
        index=True
    )

    token_recuperacao_expira_em = Column(
        String,
        nullable=True
    )


# =========================================================
# PEDIDOS
# =========================================================

class Pedido(Base):

    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)

    cliente_id = Column(
        Integer,
        ForeignKey("clientes.id"),
        nullable=True
    )

    status = Column(
        String,
        default="Pendente"
    )

    total = Column(
        Float,
        default=0
    )

    prazo_entrega = Column(
        Integer,
        nullable=False
    )
    data_pedido = Column(
        String,
        nullable=True
    )

    data_entrega_prevista = Column(
        String,
        nullable=True
    )

    espaco_id = Column(
        Integer,
        ForeignKey("espacos_clientes.id"),
        nullable=True
    )

# =========================================================
# ITENS DO PEDIDO
# =========================================================


class ItemPedido(Base):
    __tablename__ = "itens_pedido"

    id = Column(Integer, primary_key=True, index=True)

    pedido_id = Column(
        Integer,
        ForeignKey("pedidos.id"),
        nullable=False
    )

    produto_id = Column(
        Integer,
        ForeignKey("produtos.id"),
        nullable=False
    )

    quantidade = Column(
        Integer,
        nullable=False
    )

    preco_unitario = Column(
        Float,
        nullable=False
    )


# =========================================================
# ESPAÇOS DO CLIENTE
# =========================================================

class EspacoCliente(Base):
    __tablename__ = "espacos_clientes"

    id = Column(Integer, primary_key=True, index=True)

    cliente_id = Column(
        Integer,
        ForeignKey("clientes.id"),
        nullable=False
    )

    tipo = Column(
        String,
        nullable=False
    )

    nome = Column(
        String,
        nullable=False
    )

    valor = Column(
        Float,
        default=0.0
    )

    adquirido = Column(
        String,
        default="Não"
    )

# =========================================================
# ITENS DOS ESPAÇOS DO CLIENTE
# =========================================================


class ItemEspacoCliente(Base):
    __tablename__ = "itens_espacos_clientes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    espaco_id = Column(
        Integer,
        ForeignKey("espacos_clientes.id"),
        nullable=False
    )

    produto_id = Column(
        Integer,
        ForeignKey("produtos.id"),
        nullable=False
    )

    data_entrada = Column(
        String,
        nullable=True
    )

    status = Column(
        String,
        nullable=False,
        default="ATIVO"
    )

    preco_venda = Column(
        Float,
        nullable=True
    )


# =========================================================
# VENDAS DE PRODUTOS USADOS
# =========================================================


class VendaUsado(Base):
    __tablename__ = "vendas_usados"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    item_espaco_id = Column(
        Integer,
        ForeignKey("itens_espacos_clientes.id"),
        nullable=False
    )

    vendedor_id = Column(
        Integer,
        ForeignKey("clientes.id"),
        nullable=False
    )

    comprador_id = Column(
        Integer,
        ForeignKey("clientes.id"),
        nullable=True
    )

    espaco_comprador_id = Column(
        Integer,
        ForeignKey("espacos_clientes.id"),
        nullable=True
    )

    produto_id = Column(
        Integer,
        ForeignKey("produtos.id"),
        nullable=False
    )

    preco_venda = Column(
        Float,
        nullable=False
    )

    valor_vendedor = Column(
        Float,
        nullable=True
    )

    valor_valt_on = Column(
        Float,
        nullable=True
    )

    status = Column(
        String,
        nullable=False,
        default="DISPONIVEL"
    )

    data_venda = Column(
        String,
        nullable=True
    )

    data_entrega_prevista = Column(
        String,
        nullable=True
    )


# =========================================================
# =========================================================
# OFERTAS DE PRODUTOS USADOS
# =========================================================


class OfertaUsado(Base):
    __tablename__ = "ofertas_usados"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    venda_id = Column(
        Integer,
        ForeignKey("vendas_usados.id"),
        nullable=False
    )

    comprador_id = Column(
        Integer,
        ForeignKey("clientes.id"),
        nullable=False
    )

    valor_oferta = Column(
        Float,
        nullable=False
    )

    status = Column(
        String,
        nullable=False,
        default="PENDENTE"
    )

    data_oferta = Column(
        String,
        nullable=False
    )

# ADMINISTRADORES
# =========================================================


class Administrador(Base):
    __tablename__ = "administradores"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(
        String,
        nullable=False,
        unique=True,
        index=True
    )

    senha_hash = Column(
        String,
        nullable=False
    )

    nome = Column(
        String,
        nullable=False
    )

    ativo = Column(
        Integer,
        nullable=False,
        default=1
    )

    # =========================================================
# SUGESTOES DOS CLIENTES
# =========================================================

class Sugestao(Base):
    __tablename__ = "sugestoes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    cliente_id = Column(
        Integer,
        ForeignKey("clientes.id"),
        nullable=True
    )

    nome = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        nullable=False
    )

    tipo = Column(
        String,
        nullable=False
    )

    mensagem = Column(
        String,
        nullable=False
    )

    status = Column(
        String,
        nullable=False,
        default="Pendente"
    )

    resposta_admin = Column(
        String,
        nullable=True
    )

    data_criacao = Column(
        String,
        nullable=False
    )
