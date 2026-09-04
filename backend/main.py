from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File
)

from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
import shutil

from database import engine, Base, SessionLocal
import models
import schemas


# =========================================================
# CONFIGURAÇÃO DA API
# =========================================================

app = FastAPI(title="VALT-ON API")


# =========================================================
# CONFIGURAÇÃO DAS IMAGENS
# =========================================================

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://valt-on.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =========================================================
# CRIAR TABELAS
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# CONEXÃO COM O BANCO
# =========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================================================
# CRÉDITO SEMANAL CVT
# =========================================================

def conceder_credito_semanal(db: Session):
    agora = datetime.now()

    # Domingo = 6
    dias_desde_domingo = (
        agora.weekday() + 1
    ) % 7

    domingo = (
        agora -
        timedelta(
            days=dias_desde_domingo
        )
    )

    data_domingo = domingo.strftime(
        "%Y-%m-%d"
    )

    clientes = (
        db.query(models.Cliente)
        .all()
    )

    creditos = 0

    for cliente in clientes:

        # Evita receber duas vezes
        # no mesmo domingo
        if (
            cliente.ultimo_credito_cvt
            != data_domingo
        ):

            cliente.saldo_cvt += 1000.0

            cliente.ultimo_credito_cvt = (
                data_domingo
            )

            creditos += 1

    db.commit()

    print(
        f"Crédito semanal CVT processado: "
        f"{data_domingo} | "
        f"Clientes creditados: {creditos}"
    )


# =========================================================
# FUNÇÃO AUTOMÁTICA DO AGENDADOR
# =========================================================

def executar_credito_automatico():

    db = SessionLocal()

    try:
        conceder_credito_semanal(db)

    except Exception as erro:

        db.rollback()

        print(
            f"Erro no crédito semanal CVT: {erro}"
        )

    finally:
        db.close()


# =========================================================
# AGENDADOR DO CRÉDITO CVT
# =========================================================

scheduler = BackgroundScheduler()

scheduler.add_job(
    executar_credito_automatico,
    "cron",
    day_of_week="sun",
    hour=0,
    minute=0,
    second=0
)

scheduler.start()


# =========================================================
# PÁGINA INICIAL
# =========================================================

@app.get("/")
def inicio():

    return {
        "mensagem": "Backend do VALT-ON funcionando!"
    }


# =========================================================
# TESTE
# =========================================================

@app.get("/teste")
def teste():

    return {
        "status": "ok",
        "projeto": "VALT-ON"
    }


# =========================================================
# PRODUTOS
# =========================================================

@app.get(
    "/produtos",
    response_model=list[schemas.ProdutoResponse]
)
def listar_produtos(
    db: Session = Depends(get_db)
):

    produtos = (
        db.query(models.Produto)
        .all()
    )

    return produtos


# =========================================================
# BUSCAR PRODUTO
# =========================================================

@app.get(
    "/produtos/{produto_id}",
    response_model=schemas.ProdutoResponse
)
def buscar_produto(
    produto_id: int,
    db: Session = Depends(get_db)
):

    produto = (
        db.query(models.Produto)
        .filter(
            models.Produto.id == produto_id
        )
        .first()
    )

    if produto is None:

        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado"
        )

    return produto


# =========================================================
# CADASTRAR PRODUTO
# =========================================================

@app.post(
    "/produtos",
    response_model=schemas.ProdutoResponse
)
def cadastrar_produto(
    produto: schemas.ProdutoCreate,
    db: Session = Depends(get_db)
):

    novo_produto = models.Produto(
        nome=produto.nome,
        descricao=produto.descricao,
        preco=produto.preco,
        categoria=produto.categoria,
        estoque=produto.estoque,
        prazo_entrega_dias=produto.prazo_entrega_dias,
        imagem=produto.imagem
    )

    db.add(novo_produto)

    db.commit()

    db.refresh(novo_produto)

    return novo_produto


# =========================================================
# ALTERAR PRODUTO
# =========================================================

@app.put(
    "/produtos/{produto_id}",
    response_model=schemas.ProdutoResponse
)
def alterar_produto(
    produto_id: int,
    dados: schemas.ProdutoCreate,
    db: Session = Depends(get_db)
):

    produto = (
        db.query(models.Produto)
        .filter(
            models.Produto.id == produto_id
        )
        .first()
    )

    if produto is None:

        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado"
        )

    produto.nome = dados.nome
    produto.descricao = dados.descricao
    produto.preco = dados.preco
    produto.categoria = dados.categoria
    produto.estoque = dados.estoque
    produto.prazo_entrega_dias = (
        dados.prazo_entrega_dias
    )
    produto.imagem = dados.imagem

    db.commit()

    db.refresh(produto)

    return produto


# =========================================================
# EXCLUIR PRODUTO
# =========================================================

@app.delete("/produtos/{produto_id}")
def excluir_produto(
    produto_id: int,
    db: Session = Depends(get_db)
):

    produto = (
        db.query(models.Produto)
        .filter(
            models.Produto.id == produto_id
        )
        .first()
    )

    if produto is None:

        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado"
        )

    db.delete(produto)

    db.commit()

    return {
        "mensagem": "Produto excluído com sucesso"
    }


# =========================================================
# UPLOAD DE IMAGEM
# =========================================================

@app.post("/upload-imagem")
async def upload_imagem(
    file: UploadFile = File(...)
):

    extensoes_permitidas = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif"
    }

    extensao = Path(
        file.filename or ""
    ).suffix.lower()

    if extensao not in extensoes_permitidas:

        raise HTTPException(
            status_code=400,
            detail="Formato de imagem não permitido."
        )

    nome_arquivo = Path(
        file.filename or "imagem"
    ).name

    caminho = UPLOAD_DIR / nome_arquivo

    with caminho.open("wb") as arquivo:

        shutil.copyfileobj(
            file.file,
            arquivo
        )

    return {
        "mensagem": "Imagem enviada com sucesso!",
        "arquivo": nome_arquivo,
        "url": f"/uploads/{nome_arquivo}"
    }


# =========================================================
# CLIENTES
# =========================================================

@app.post(
    "/clientes",
    response_model=schemas.ClienteResponse
)
def cadastrar_cliente(
    cliente: schemas.ClienteCreate,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # VERIFICAR E-MAIL
    # -----------------------------------------------------

    cliente_existente = (
        db.query(models.Cliente)
        .filter(
            models.Cliente.email == cliente.email
        )
        .first()
    )

    if cliente_existente:

        raise HTTPException(
            status_code=400,
            detail="E-mail já cadastrado."
        )

    # -----------------------------------------------------
    # CRIAR CLIENTE
    # -----------------------------------------------------

    # O saldo inicial é definido automaticamente
    # pelo models.py através de default=1000.0

    novo_cliente = models.Cliente(
        nome=cliente.nome,
        email=cliente.email,
        senha=cliente.senha
    )

    db.add(novo_cliente)

    db.commit()

    db.refresh(novo_cliente)

    # -----------------------------------------------------
    # CRIAR ESPAÇO SIMPLES AUTOMATICAMENTE
    # -----------------------------------------------------

    espaco_simples = models.EspacoCliente(
        cliente_id=novo_cliente.id,
        tipo="simples",
        nome="Espaço Simples",
        valor=0.0,
        adquirido="Sim"
    )

    db.add(espaco_simples)

    db.commit()

    return novo_cliente


# =========================================================
# LOGIN
# =========================================================

@app.post("/login")
def login(
    dados: schemas.ClienteLogin,
    db: Session = Depends(get_db)
):

    cliente = (
        db.query(models.Cliente)
        .filter(
            models.Cliente.email == dados.email
        )
        .first()
    )

    if cliente is None:

        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha inválidos."
        )

    if cliente.senha != dados.senha:

        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha inválidos."
        )

    # =====================================================
    # VERIFICAR CRÉDITO SEMANAL
    # =====================================================

    conceder_credito_semanal(db)

    # Atualizar os dados do cliente após
    # possível crédito

    db.refresh(cliente)

    return {
        "mensagem": "Login realizado com sucesso!",
        "cliente": {
            "id": cliente.id,
            "nome": cliente.nome,
            "email": cliente.email,
            "saldo_cvt": cliente.saldo_cvt
        }
    }


# =========================================================
# FINALIZAR COMPRA
# =========================================================

@app.post("/finalizar-compra")
def finalizar_compra(
    compra: schemas.CompraCreate,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # VERIFICAR CARRINHO
    # -----------------------------------------------------

    if not compra.itens:

        raise HTTPException(
            status_code=400,
            detail="Carrinho vazio."
        )

    # -----------------------------------------------------
    # VERIFICAR CLIENTE
    # -----------------------------------------------------

    cliente = (
        db.query(models.Cliente)
        .filter(
            models.Cliente.id == compra.cliente_id
        )
        .first()
    )

    if cliente is None:

        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado."
        )

    # -----------------------------------------------------
    # CALCULAR TOTAL
    # -----------------------------------------------------

    total = 0

    produtos_compra = []

    # -----------------------------------------------------
    # VERIFICAR PRODUTOS E ESTOQUE
    # -----------------------------------------------------

    prazo_entrega = 0
    for item in compra.itens:

        produto_id = item.produto_id
        quantidade = item.quantidade

        if quantidade <= 0:

            raise HTTPException(
                status_code=400,
                detail="Quantidade inválida."
            )

        produto = (
            db.query(models.Produto)
            .filter(
                models.Produto.id == produto_id
            )
            .first()
        )

        if produto is None:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"Produto {produto_id} "
                    "não encontrado."
                )
            )

        # -------------------------------------------------
        # VERIFICAR ESTOQUE
        # -------------------------------------------------

        if quantidade > produto.estoque:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Estoque insuficiente para "
                    f"{produto.nome}. "
                    f"Disponível: "
                    f"{produto.estoque}"
                )
            )

        prazo_entrega = max(
                prazo_entrega,
                produto.prazo_entrega_dias
        )

        produtos_compra.append(
            (
                produto,
                quantidade
            )
        )

        total += (
            produto.preco *
            quantidade
        )

    # -----------------------------------------------------
    # VERIFICAR SALDO CVT
    # -----------------------------------------------------

    if cliente.saldo_cvt < total:

        raise HTTPException(
            status_code=400,
            detail=(
                "Saldo CVT insuficiente. "
                f"Saldo disponível: "
                f"{cliente.saldo_cvt:.2f} CVT. "
                f"Total da compra: "
                f"{total:.2f} CVT."
            )
        )

    # -----------------------------------------------------
    # DESCONTAR SALDO CVT
    # -----------------------------------------------------

    cliente.saldo_cvt -= total

    # -----------------------------------------------------
    # CRIAR PEDIDO
    # -----------------------------------------------------

    pedido = models.Pedido(
        cliente_id=compra.cliente_id,
        status="Pago",
        total=total,
        prazo_entrega=prazo_entrega
    )

    db.add(pedido)

    db.flush()

    # -----------------------------------------------------
    # CRIAR ITENS DO PEDIDO
    # -----------------------------------------------------

    for produto, quantidade in produtos_compra:

        item_pedido = models.ItemPedido(
            pedido_id=pedido.id,
            produto_id=produto.id,
            quantidade=quantidade,
            preco_unitario=produto.preco
        )

        db.add(item_pedido)

        # -------------------------------------------------
        # BAIXAR ESTOQUE
        # -------------------------------------------------

        produto.estoque -= quantidade

    # -----------------------------------------------------
    # SALVAR
    # -----------------------------------------------------

    db.commit()

    db.refresh(pedido)

    # -----------------------------------------------------
    # RESPOSTA
    # -----------------------------------------------------

    return {
        "mensagem": "Compra realizada com sucesso!",
        "pedido_id": pedido.id,
        "cliente_id": pedido.cliente_id,
        "total": total,
        "status": pedido.status,
        "saldo_cvt": cliente.saldo_cvt
    }


# =========================================================
# PEDIDOS DO CLIENTE
# =========================================================

@app.get(
    "/clientes/{cliente_id}/pedidos"
)
def listar_pedidos_cliente(
    cliente_id: int,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # VERIFICAR CLIENTE
    # -----------------------------------------------------

    cliente = (
        db.query(models.Cliente)
        .filter(
            models.Cliente.id == cliente_id
        )
        .first()
    )

    if cliente is None:

        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado."
        )

    # -----------------------------------------------------
    # BUSCAR PEDIDOS
    # -----------------------------------------------------

    pedidos = (
        db.query(models.Pedido)
        .filter(
            models.Pedido.cliente_id == cliente_id
        )
        .order_by(
            models.Pedido.id.desc()
        )
        .all()
    )

    resultado = []

    # -----------------------------------------------------
    # MONTAR RESPOSTA
    # -----------------------------------------------------

    for pedido in pedidos:

        itens = (
            db.query(models.ItemPedido)
            .filter(
                models.ItemPedido.pedido_id == pedido.id
            )
            .all()
        )

        itens_resultado = []

        for item in itens:

            produto = (
                db.query(models.Produto)
                .filter(
                    models.Produto.id == item.produto_id
                )
                .first()
            )

            itens_resultado.append(
                {
                    "produto_id": item.produto_id,
                    "nome": (
                        produto.nome
                        if produto
                        else "Produto não encontrado"
                    ),
                    "quantidade": item.quantidade,
                    "preco_unitario": item.preco_unitario
                }
            )

        resultado.append(
            {
                "pedido_id": pedido.id,
                "status": pedido.status,
                "total": pedido.total,
                "itens": itens_resultado
            }
        )

    return resultado
# =========================================================
# ALTERAR STATUS DO PEDIDO
# ADMINISTRADOR
# =========================================================


@app.put(
    "/pedidos/{pedido_id}/status"
)
def alterar_status_pedido(
    pedido_id: int,
    dados: dict,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # BUSCAR PEDIDO
    # -----------------------------------------------------

    pedido = (
        db.query(models.Pedido)
        .filter(
            models.Pedido.id == pedido_id
        )
        .first()
    )

    if pedido is None:

        raise HTTPException(
            status_code=404,
            detail="Pedido não encontrado."
        )

    # -----------------------------------------------------
    # PEGAR NOVO STATUS
    # -----------------------------------------------------

    novo_status = dados.get("status")

    if not novo_status:

        raise HTTPException(
            status_code=400,
            detail="O status do pedido é obrigatório."
        )

    # -----------------------------------------------------
    # STATUS PERMITIDOS
    # -----------------------------------------------------

    status_permitidos = [
        "Pago",
        "Preparando",
        "Enviado",
        "A caminho",
        "Entregue",
        "Cancelado"
    ]

    if novo_status not in status_permitidos:

        raise HTTPException(
            status_code=400,
            detail="Status inválido."
        )

    # -----------------------------------------------------
    # ALTERAR STATUS
    # -----------------------------------------------------

    pedido.status = novo_status

    db.commit()

    db.refresh(pedido)

    # -----------------------------------------------------
    # RESPOSTA
    # -----------------------------------------------------

    return {
        "mensagem":
            "Status do pedido atualizado com sucesso!",
        "pedido_id":
            pedido.id,
        "status":
            pedido.status
    }


# =========================================================
# ESPAÇOS DO CLIENTE
# =========================================================

@app.get(
    "/clientes/{cliente_id}/espacos"
)
def listar_espacos_cliente(
    cliente_id: int,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # VERIFICAR CLIENTE
    # -----------------------------------------------------

    cliente = (
        db.query(models.Cliente)
        .filter(
            models.Cliente.id == cliente_id
        )
        .first()
    )

    if cliente is None:

        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado."
        )

    # -----------------------------------------------------
    # BUSCAR ESPAÇOS DO CLIENTE
    # -----------------------------------------------------

    espacos = (
        db.query(models.EspacoCliente)
        .filter(
            models.EspacoCliente.cliente_id == cliente_id
        )
        .order_by(
            models.EspacoCliente.id
        )
        .all()
    )

    # -----------------------------------------------------
    # MONTAR RESPOSTA
    # -----------------------------------------------------

    resultado = []

    for espaco in espacos:

        resultado.append(
            {
                "id": espaco.id,
                "cliente_id": espaco.cliente_id,
                "tipo": espaco.tipo,
                "nome": espaco.nome,
                "valor": espaco.valor,
                "adquirido": espaco.adquirido
            }

        )
    return resultado
