from pydantic import BaseModel  # type: ignore[import-not-found]


# =========================================================
# PRODUTOS
# =========================================================

class ProdutoBase(BaseModel):
    nome: str
    descricao: str = ""
    preco: float
    categoria: str
    estoque: int = 0
    prazo_entrega_dias: int = 3
    imagem: str | None = None


class ProdutoCreate(ProdutoBase):
    pass


class ProdutoResponse(ProdutoBase):
    id: int

    class Config:
        from_attributes = True


# =========================================================
# CLIENTES
# =========================================================

class ClienteCreate(BaseModel):
    nome: str
    email: str
    senha: str
    indicador_id: int | None = None


class ClienteLogin(BaseModel):
    email: str
    senha: str


class RecuperacaoSenhaSolicitacao(BaseModel):
    email: str


class RecuperacaoSenhaRedefinir(BaseModel):
    token: str
    nova_senha: str


class ClienteResponse(BaseModel):
    id: int
    nome: str
    email: str
    email_confirmado: int

    class Config:
        from_attributes = True


# =========================================================
# PEDIDOS
# =========================================================

class ItemCompra(BaseModel):
    produto_id: int
    quantidade: int


class CompraCreate(BaseModel):
    cliente_id: int | None = None
    espaco_id: int | None = None
    itens: list[ItemCompra]


# =========================================================
# CASAS / ESPAÇOS
# =========================================================

class CasaCompra(BaseModel):
    cliente_id: int
    tipo: str


# =========================================================
# RESPOSTA DO PEDIDO
# =========================================================

class PedidoResponse(BaseModel):
    id: int
    cliente_id: int | None = None
    status: str
    total: float

    class Config:
        from_attributes = True

# =========================================================
# VENDAS DE PRODUTOS USADOS
# =========================================================

class VendaUsadoCriar(BaseModel):
    cliente_id: int
    item_id: int
    preco_venda: float

class CompraUsadoCriar(BaseModel):
    cliente_id: int
    venda_id: int
    espaco_id: int

    # =========================================================
# OFERTAS DE PRODUTOS USADOS
# =========================================================

class OfertaUsadoCriar(BaseModel):
    comprador_id: int
    venda_id: int
    valor_oferta: float
    espaco_id: int


class OfertaUsadoAceitarCriar(BaseModel):
    oferta_id: int
    comprador_id: int
    espaco_id: int
# =========================================================
# SUGESTÕES DOS CLIENTES
# =========================================================

class SugestaoCriar(BaseModel):
    cliente_id: int | None = None
    nome: str
    email: str
    tipo: str
    mensagem: str
# =========================================================
# PAGAMENTO DE CVT
# =========================================================

class CompraCVT(BaseModel):
    cliente_id: int
    quantidade_cvt: int
