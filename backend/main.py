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
import os
import secrets
import urllib.request
import urllib.error
import json
import bcrypt
from dotenv import load_dotenv
from database import engine, Base, SessionLocal
import models
import schemas

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

from supabase import create_client

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


# =========================================================
# CONFIGURAÇÃO DA API
# =========================================================
app = FastAPI(title="VALT-ON API")

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# =========================================================
# CONFIGURAÇÃO DAS CASAS
# =========================================================

CASAS_CONFIG = {
    "pequena": {
        "nome": "Casa Pequena",
        "valor": 0.0,
        "capacidade": 30
    },
    "media": {
        "nome": "Casa Média",
        "valor": 3000.0,
        "capacidade": 100
    },
    "grande": {
        "nome": "Casa Grande",
        "valor": 5000.0,
        "capacidade": 200
    },
    "mansao": {
        "nome": "Mansão",
        "valor": 10000.0,
        "capacidade": 500
    }
}


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
    allow_headers=["*"],
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
# ATUALIZAR STATUS DOS PEDIDOS AUTOMATICAMENTE
# =========================================================

# =========================================================
# ENVIO DE E-MAIL
# =========================================================


def enviar_email(destinatario: str, assunto: str, mensagem: str):

    try:

        api_key = os.getenv("BREVO_API_KEY")

        dados = {
            "sender": {
                "name": "Valt-on",
                "email": os.getenv("SMTP_USER")
            },
            "to": [
                {
                    "email": destinatario
                }
            ],
            "subject": assunto,
            "textContent": mensagem
        }

        dados_json = json.dumps(dados).encode("utf-8")

        requisicao = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=dados_json,
            headers={
                "accept": "application/json",
                "api-key": api_key,
                "content-type": "application/json"
            },
            method="POST"
        )

        with urllib.request.urlopen(requisicao) as resposta:

            resultado = resposta.read().decode("utf-8")

            print(
                f"E-mail enviado com sucesso para {destinatario}"
            )

            print(
                f"Resposta Brevo: {resultado}"
            )

            return True

    except Exception as erro:

        print(
            f"Erro ao enviar e-mail para {destinatario}: {erro}"
        )

        return False

# =========================================================
# REENVIO TEMPORARIO DE CONFIRMACAO DE E-MAIL
# =========================================================


@app.post("/reenviar-confirmacao-email/{cliente_id}")
def reenviar_confirmacao_email(
    cliente_id: int,
    db: Session = Depends(get_db)
):
    if cliente_id != 10:
        raise HTTPException(
            status_code=403,
            detail="Endpoint temporário disponível somente para o cliente 10."
        )

    cliente = (
        db.query(models.Cliente)
        .filter(models.Cliente.id == cliente_id)
        .first()
    )

    if cliente is None:
        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado."
        )

    agora = datetime.now()

    token_confirmacao = secrets.token_urlsafe(32)

    token_expira_em = (
        agora + timedelta(hours=24)
    ).isoformat()

    cliente.email_confirmado = 0
    cliente.token_confirmacao_email = token_confirmacao
    cliente.token_confirmacao_expira_em = token_expira_em

    db.commit()

    link_confirmacao = (
        "https://valt-on.onrender.com/confirmar-email?token="
        + token_confirmacao
    )

    mensagem_confirmacao = (
        f"Olá, {cliente.nome}!\n\n"
        "Estamos reenviando a confirmação do seu e-mail "
        "da conta VALT-ON.\n\n"
        "Para confirmar seu endereço de e-mail, "
        "acesse o link abaixo:\n\n"
        f"{link_confirmacao}\n\n"
        "Este link é válido por 24 horas.\n\n"
        "VALT-ON"
    )

    enviado = enviar_email(
        cliente.email,
        "Confirme seu e-mail - VALT-ON",
        mensagem_confirmacao
    )

    if not enviado:
        raise HTTPException(
            status_code=500,
            detail="Não foi possível enviar o e-mail de confirmação."
        )

    return {
        "mensagem": "Novo e-mail de confirmação enviado.",
        "cliente_id": cliente.id,
        "email": cliente.email,
        "email_confirmado": cliente.email_confirmado
    }


def atualizar_status_pedidos_automaticamente(db):

    agora = datetime.now()

    pedidos = (
        db.query(models.Pedido)
        .filter(
            models.Pedido.status.in_([
                "Pago",
                "Preparando",
                "Enviado",
                "A caminho"
            ])
        )
        .all()
    )

    for pedido in pedidos:

        if not pedido.data_pedido:
            continue

        try:

            data_pedido = datetime.strptime(
                pedido.data_pedido,
                "%Y-%m-%d %H:%M:%S"
            )

        except ValueError:

            continue

        # Prazo 0 dias = 2 horas
        if pedido.prazo_entrega == 0:
            tempo_total = 2 * 60 * 60
        else:
            tempo_total = (
                pedido.prazo_entrega
                * 24
                * 60
                * 60
            )

        # Tempo decorrido desde a compra
        tempo_decorrido = (
            agora - data_pedido
        ).total_seconds()

        percentual = (
            tempo_decorrido /
            tempo_total
        ) * 100

        # -------------------------------------------------
        # DEFINIR NOVO STATUS
        # -------------------------------------------------

        if percentual >= 80:

            novo_status = "Entregue"

        elif percentual >= 60:

            novo_status = "A caminho"

        elif percentual >= 40:

            novo_status = "Enviado"

        elif percentual >= 20:

            novo_status = "Preparando"

        else:

            novo_status = "Pago"

        # -------------------------------------------------
        # NÃO FAZER NADA SE O STATUS JÁ ESTIVER CORRETO
        # -------------------------------------------------

        if pedido.status == novo_status:
            continue

        status_anterior = pedido.status

        pedido.status = novo_status

        print(
            f"Pedido #{pedido.id}: "
            f"{status_anterior} -> {novo_status}"
        )

        # -------------------------------------------------
        # BUSCAR CLIENTE
        # -------------------------------------------------

        cliente = (
            db.query(models.Cliente)
            .filter(
                models.Cliente.id ==
                pedido.cliente_id
            )
            .first()
        )

        # -------------------------------------------------
        # ENVIAR E-MAIL
        # SOMENTE QUANDO O STATUS MUDAR
        # -------------------------------------------------

        if cliente and cliente.email:

            enviar_email(
                cliente.email,
                f"Atualização do pedido #{pedido.id} - VALT-ON",
                (
                    f"Olá, {cliente.nome}!\n\n"
                    f"Seu pedido #{pedido.id} "
                    "teve uma atualização.\n\n"
                    f"Status anterior: "
                    f"{status_anterior}\n"
                    f"Novo status: "
                    f"{novo_status}\n"
                    f"Total do pedido: "
                    f"{pedido.total:.2f} CVT\n\n"
                    "Acompanhe seu pedido pela "
                    "sua conta na VALT-ON.\n\n"
                    "VALT-ON"
                )
            )

    db.commit()


# =========================================================
# FUNÇÃO AUTOMÁTICA DO CRÉDITO
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
# FUNÇÃO AUTOMÁTICA DOS PEDIDOS
# =========================================================

def executar_status_pedidos_automatico():

    db = SessionLocal()

    try:

        atualizar_status_pedidos_automaticamente(
            db
        )

    except Exception as erro:

        db.rollback()

        print(
            "Erro na atualização automática "
            f"dos pedidos: {erro}"
        )

    finally:

        db.close()


# =========================================================
# AGENDADOR
# =========================================================

scheduler = BackgroundScheduler()


# ---------------------------------------------------------
# CRÉDITO SEMANAL
# DOMINGO ÀS 00:00
# ---------------------------------------------------------

scheduler.add_job(
    executar_credito_automatico,
    "cron",
    day_of_week="sun",
    hour=0,
    minute=0,
    second=0
)


# ---------------------------------------------------------
# ATUALIZAÇÃO DOS PEDIDOS
# A CADA 1 MINUTO
# ---------------------------------------------------------

scheduler.add_job(
    executar_status_pedidos_automatico,
    "interval",
    minutes=1
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

    try:

        conteudo = await file.read()

        supabase.storage.from_("produtos").upload(
            nome_arquivo,
            conteudo,
            {
                "content-type": file.content_type or "application/octet-stream",
                "upsert": "true"
            }
        )

        url_publica = (
            f"{SUPABASE_URL}/storage/v1/object/public/"
            f"produtos/{nome_arquivo}"
        )

        return {
            "mensagem": "Imagem enviada com sucesso!",
            "arquivo": nome_arquivo,
            "url": url_publica
        }

    except Exception as erro:

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao enviar imagem: {str(erro)}"
        )

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

    agora = datetime.now()
    dias_desde_domingo = (agora.weekday() + 1) % 7
    domingo = agora - timedelta(days=dias_desde_domingo)
    data_domingo = domingo.strftime("%Y-%m-%d")

    token_confirmacao = secrets.token_urlsafe(32)
    token_expira_em = (
        agora + timedelta(hours=24)
    ).isoformat()

    novo_cliente = models.Cliente(
        nome=cliente.nome,
        email=cliente.email,
        senha=cliente.senha,
        ultimo_credito_cvt=data_domingo,
        token_confirmacao_email=token_confirmacao,
        token_confirmacao_expira_em=token_expira_em
    )

    db.add(novo_cliente)

    db.commit()

    db.refresh(novo_cliente)

    # -----------------------------------------------------
    # CRIAR CASA PEQUENA AUTOMATICAMENTE
    # -----------------------------------------------------

    espaco_pequena = models.EspacoCliente(
        cliente_id=novo_cliente.id,
        tipo="pequena",
        nome="Casa Pequena",
        valor=0.0,
        adquirido="Sim"
    )

    db.add(espaco_pequena)
    db.commit()

    # -----------------------------------------------------
    # ENVIAR E-MAIL DE CONFIRMAÇÃO
    # -----------------------------------------------------

    link_confirmacao = (
        "https://valt-on.onrender.com/confirmar-email?token="
        + token_confirmacao
    )

    mensagem_confirmacao = (
        f"Olá, {novo_cliente.nome}!\n\n"
        "Sua conta no VALT-ON foi criada com sucesso.\n\n"
        "Para confirmar seu endereço de e-mail, "
        "acesse o link abaixo:\n\n"
        f"{link_confirmacao}\n\n"
        "Este link é válido por 24 horas.\n\n"
        "Se você não criou esta conta, ignore este e-mail.\n\n"
        "VALT-ON"
    )

    enviar_email(
        novo_cliente.email,
        "Confirme seu e-mail - VALT-ON",
        mensagem_confirmacao
    )

    return novo_cliente

# =========================================================
# RECUPERAÇÃO DE SENHA
# =========================================================

@app.post('/solicitar-recuperacao-senha')
def solicitar_recuperacao_senha(
    dados: schemas.RecuperacaoSenhaSolicitacao,
    db: Session = Depends(get_db)
):

    cliente = (
        db.query(models.Cliente)
        .filter(models.Cliente.email == dados.email)
        .first()
    )

    # Por segurança, não informamos se o e-mail existe ou não.
    mensagem_padrao = {
        'mensagem': 'Se o e-mail estiver cadastrado, enviaremos um link para recuperação da senha.'
    }

    if cliente is None:
        return mensagem_padrao

    token_recuperacao = secrets.token_urlsafe(32)
    token_expira_em = (
        datetime.now() + timedelta(hours=1)
    ).isoformat()

    cliente.token_recuperacao_senha = token_recuperacao
    cliente.token_recuperacao_expira_em = token_expira_em

    db.commit()

    link_recuperacao = (
        'https://valt-on.onrender.com/recuperar-senha?token='
        + token_recuperacao
    )

    mensagem_recuperacao = (
        f'Olá, {cliente.nome}!\\n\\n'
        'Recebemos uma solicitação para redefinir sua senha no VALT-ON.\\n\\n'
        'Para criar uma nova senha, acesse o link abaixo:\\n\\n'
        f'{link_recuperacao}\\n\\n'
        'Este link é válido por 1 hora.\\n\\n'
        'Se você não solicitou a recuperação da senha, ignore este e-mail.\\n\\n'
        'VALT-ON'
    )

    enviado = enviar_email(
        cliente.email,
        'Recuperação de senha - VALT-ON',
        mensagem_recuperacao
    )

    if not enviado:
        raise HTTPException(
            status_code=500,
            detail='Não foi possível enviar o e-mail de recuperação.'
        )

    return mensagem_padrao


# =========================================================
# CONFIRMAÇÃO DE E-MAIL
# =========================================================

@app.get("/confirmar-email")
def confirmar_email(
    token: str,
    db: Session = Depends(get_db)
):
    cliente = (
        db.query(models.Cliente)
        .filter(
            models.Cliente.token_confirmacao_email == token
        )
        .first()
    )

    if cliente is None:
        raise HTTPException(
            status_code=400,
            detail="Token de confirmação inválido."
        )

    if cliente.email_confirmado == 1:
        return {
            "mensagem": "E-mail já confirmado."
        }

    if (
        cliente.token_confirmacao_expira_em
        is None
    ):
        raise HTTPException(
            status_code=400,
            detail="Token de confirmação inválido."
        )

    try:
        expiracao = datetime.fromisoformat(
            cliente.token_confirmacao_expira_em
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Token de confirmação inválido."
        )

    if datetime.now() > expiracao:
        raise HTTPException(
            status_code=400,
            detail="Token de confirmação expirado."
        )

    cliente.email_confirmado = 1
    cliente.token_confirmacao_email = None
    cliente.token_confirmacao_expira_em = None

    db.commit()

    return {
        "mensagem": "E-mail confirmado com sucesso!"
    }


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

    if cliente.email_confirmado != 1:
        raise HTTPException(
            status_code=403,
            detail="Confirme seu e-mail antes de fazer login."
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
# LOGIN DO ADMINISTRADOR
# =========================================================


@app.post("/login-admin")
def login_admin(
    dados: schemas.ClienteLogin,
    db: Session = Depends(get_db)
):

    # ADMINISTRADOR PRINCIPAL
    if (
        dados.email == ADMIN_EMAIL
        and dados.senha == ADMIN_PASSWORD
    ):
        return {
            "mensagem": "Login de administrador realizado com sucesso!",
            "admin": True,
            "email": dados.email
        }

    # DEMAIS ADMINISTRADORES
    administrador = (
        db.query(models.Administrador)
        .filter(
            models.Administrador.email == dados.email,
            models.Administrador.ativo == 1
        )
        .first()
    )

    if administrador is None:
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha de administrador inválidos."
        )

    senha_correta = bcrypt.checkpw(
        dados.senha.encode("utf-8"),
        administrador.senha_hash.encode("utf-8")
    )

    if not senha_correta:
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha de administrador inválidos."
        )

    return {
        "mensagem": "Login de administrador realizado com sucesso!",
        "admin": True,
        "email": administrador.email,
        "nome": administrador.nome,
        "admin_id": administrador.id
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
    # VERIFICAR ESPAÇO DO CLIENTE
    # -----------------------------------------------------

    if compra.espaco_id is None:
        raise HTTPException(
            status_code=400,
            detail="É necessário selecionar um espaço para realizar a compra."
        )

    espaco = (
        db.query(models.EspacoCliente)
        .filter(
            models.EspacoCliente.id == compra.espaco_id,
            models.EspacoCliente.cliente_id == compra.cliente_id
        )
        .first()
    )

    if espaco is None:
        raise HTTPException(
            status_code=400,
            detail="Espaço inválido ou não pertence ao cliente."
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

    data_pedido = datetime.now()
    data_entrega_prevista = (
        data_pedido + timedelta(days=prazo_entrega)
    )

    pedido = models.Pedido(
        cliente_id=compra.cliente_id,
        espaco_id=compra.espaco_id,
        status="Pago",
        total=total,
        prazo_entrega=prazo_entrega,
        data_pedido=data_pedido.strftime("%Y-%m-%d %H:%M:%S"),
        data_entrega_prevista=data_entrega_prevista.strftime(
            "%Y-%m-%d %H:%M:%S"
        )
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
                    "imagem": (
                        produto.imagem
                        if produto
                        else None
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
                "prazo_entrega": pedido.prazo_entrega,
                "data_pedido": pedido.data_pedido,
                "data_entrega_prevista": pedido.data_entrega_prevista,
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

    status_anterior = pedido.status

    pedido.status = novo_status

    db.commit()

    db.refresh(pedido)

    # -----------------------------------------------------
    # ENVIAR E-MAIL AO CLIENTE
    # SOMENTE SE O STATUS REALMENTE MUDOU
    # -----------------------------------------------------

    if status_anterior != novo_status:

        cliente = (
            db.query(models.Cliente)
            .filter(
                models.Cliente.id == pedido.cliente_id
            )
            .first()
        )

        if cliente and cliente.email:

            enviar_email(
                cliente.email,
                f"Atualização do pedido #{pedido.id} - VALT-ON",
                (
                    f"Olá, {cliente.nome}!\n\n"
                    f"Seu pedido #{pedido.id} teve uma atualização.\n\n"
                    f"Status anterior: {status_anterior}\n"
                    f"Novo status: {novo_status}\n"
                    f"Total do pedido: {pedido.total:.2f} CVT\n\n"
                    "Acompanhe seu pedido pela sua conta na VALT-ON.\n\n"
                    "VALT-ON"
                )
            )
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
# LISTAR TODOS OS PEDIDOS
# ADMINISTRADOR
# =========================================================

@app.get("/pedidos")
def listar_todos_pedidos(
    db: Session = Depends(get_db)
):

    pedidos = (
        db.query(models.Pedido)
        .order_by(
            models.Pedido.id.desc()
        )
        .all()
    )

    resultado = []

    for pedido in pedidos:

        cliente = (
            db.query(models.Cliente)
            .filter(
                models.Cliente.id == pedido.cliente_id
            )
            .first()
        )

        resultado.append(
            {
                "pedido_id": pedido.id,
                "cliente_id": pedido.cliente_id,
                "cliente_nome": (
                    cliente.nome if cliente else "Cliente não encontrado"
                ),
                "cliente_email": cliente.email if cliente else "",
                "status": pedido.status,
                "total": pedido.total,
                "prazo_entrega": pedido.prazo_entrega
            }
        )

    return resultado


# =========================================================
# ESPAÇOS DO CLIENTE
# =========================================================

@app.post(
    "/clientes/{cliente_id}/espacos/comprar"
)
def comprar_casa(
    cliente_id: int,
    casa: schemas.CasaCompra,
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
    # VERIFICAR CLIENTE INFORMADO
    # -----------------------------------------------------

    if casa.cliente_id != cliente_id:
        raise HTTPException(
            status_code=400,
            detail="Cliente informado não corresponde ao cliente da rota."
        )

    # -----------------------------------------------------
    # VERIFICAR TIPO DA CASA
    # -----------------------------------------------------

    config = CASAS_CONFIG.get(casa.tipo)

    if config is None:
        raise HTTPException(
            status_code=400,
            detail="Tipo de casa inválido."
        )

    # -----------------------------------------------------
    # VERIFICAR SALDO
    # -----------------------------------------------------

    valor = config["valor"]

    if cliente.saldo_cvt < valor:
        raise HTTPException(
            status_code=400,
            detail=(
                "Saldo CVT insuficiente. "
                f"Saldo disponível: {cliente.saldo_cvt:.2f} CVT. "
                f"Valor da casa: {valor:.2f} CVT."
            )
        )

    # -----------------------------------------------------
    # DESCONTAR VALOR
    # -----------------------------------------------------

    cliente.saldo_cvt -= valor

    # -----------------------------------------------------
    # CRIAR CASA
    # -----------------------------------------------------

    espaco = models.EspacoCliente(
        cliente_id=cliente_id,
        tipo=casa.tipo,
        nome=config["nome"],
        valor=valor,
        adquirido="Sim"
    )

    db.add(espaco)
    db.commit()
    db.refresh(espaco)

    return {
        "mensagem": "Casa adquirida com sucesso!",
        "id": espaco.id,
        "cliente_id": espaco.cliente_id,
        "tipo": espaco.tipo,
        "nome": espaco.nome,
        "valor": espaco.valor,
        "capacidade": config["capacidade"],
        "adquirido": espaco.adquirido,
        "saldo_cvt": cliente.saldo_cvt
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

# =========================================================
# DIAGNOSTICO TEMPORARIO
# =========================================================

@app.get("/diagnostico-versao")
def diagnostico_versao():
    return {
        "arquivo": __file__,
        "confirmar_email": any(
            rota.path == "/confirmar-email"
            for rota in app.routes
        )
    }

