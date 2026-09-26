from fastapi import FastAPI, Depends, HTTPException, UploadFile, File

from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
import shutil
from ftplib import FTP
import os
import secrets
import urllib.request
import urllib.error
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import html
import bcrypt
from dotenv import load_dotenv
from database import engine, Base, SessionLocal
import models
import schemas

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# =========================================================
# CONFIGURAÃ‡ÃƒO DA API
# =========================================================
app = FastAPI(title="VALT-ON API")

from routers import pagamentos_cvt
app.include_router(pagamentos_cvt.router)

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# =========================================================
# CONFIGURAÃ‡ÃƒO DAS CASAS
# =========================================================

CASAS_CONFIG = {
    "pequena": {"nome": "Casa Pequena", "valor": 0.0, "capacidade": 30},
    "media": {"nome": "Casa MÃ©dia", "valor": 3000.0, "capacidade": 80},
    "grande": {"nome": "Casa Grande", "valor": 5000.0, "capacidade": 150},
    "mansao": {"nome": "MansÃ£o Pro", "valor": 10000.0, "capacidade": 500},
}

# =========================================================
# CONFIGURAÃ‡ÃƒO DAS IMAGENS
# =========================================================

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://valt-on.vercel.app",
        "https://darkslategrey-gerbil-151298.hostingersite.com",
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
# CONEXÃƒO COM O BANCO
# =========================================================


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================================================
# CRÃ‰DITO SEMANAL CVT
# =========================================================


def conceder_credito_semanal(db: Session):

    agora = datetime.now()

    # Domingo = 6
    dias_desde_domingo = (agora.weekday() + 1) % 7

    domingo = agora - timedelta(days=dias_desde_domingo)

    data_domingo = domingo.strftime("%Y-%m-%d")

    clientes = db.query(models.Cliente).all()

    creditos = 0

    for cliente in clientes:

        # Evita receber duas vezes
        # no mesmo domingo
        if cliente.ultimo_credito_cvt != data_domingo:

            cliente.saldo_cvt += 500.0

            cliente.ultimo_credito_cvt = data_domingo

            creditos += 1

    print(
        f"CrÃ©dito semanal CVT processado: "
        f"{data_domingo} | "
        f"Clientes creditados: {creditos}"
    )

    db.commit()


# =========================================================
# ATUALIZAR STATUS DOS PEDIDOS AUTOMATICAMENTE
# =========================================================

# =========================================================
# ENVIO DE E-MAIL
# =========================================================


def enviar_email(
    destinatario: str, assunto: str, mensagem: str, html_mensagem: str = None
):

    try:

        servidor = os.getenv("SMTP_HOST")
        porta = int(os.getenv("SMTP_PORT", "465"))
        usuario = os.getenv("SMTP_USER")
        senha = os.getenv("SMTP_PASSWORD")

        corpo_html = (
            html_mensagem
            if html_mensagem is not None
            else mensagem.replace("\n", "<br>")
        )

        msg = MIMEMultipart("alternative")
        msg["From"] = f"Valt-on <{usuario}>"
        msg["To"] = destinatario
        msg["Subject"] = assunto

        msg.attach(MIMEText(mensagem, "plain", "utf-8"))
        msg.attach(MIMEText(corpo_html, "html", "utf-8"))

        with smtplib.SMTP_SSL(servidor, porta) as conexao:
            conexao.login(usuario, senha)
            conexao.sendmail(usuario, destinatario, msg.as_string())

        print(f"E-mail enviado com sucesso para {destinatario} via Hostinger")

        return True

    except Exception as erro:

        print(f"Erro ao enviar e-mail para {destinatario}: {erro}")

        return False


# =========================================================
# REENVIO TEMPORARIO DE CONFIRMACAO DE E-MAIL
# =========================================================


@app.post("/reenviar-confirmacao-email/{cliente_id}")
def reenviar_confirmacao_email(cliente_id: int, db: Session = Depends(get_db)):
    if cliente_id != 10:
        raise HTTPException(
            status_code=403,
            detail="Endpoint temporÃ¡rio disponÃ­vel somente para o cliente 10.",
        )

    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()

    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente nÃ£o encontrado.")

    agora = datetime.now()

    token_confirmacao = secrets.token_urlsafe(32)

    token_expira_em = (agora + timedelta(hours=24)).isoformat()

    cliente.email_confirmado = 0
    cliente.token_confirmacao_email = token_confirmacao
    cliente.token_confirmacao_expira_em = token_expira_em

    db.commit()

    link_confirmacao = (
        "https://valt-on.onrender.com/confirmar-email?token=" + token_confirmacao
    )

    mensagem_confirmacao = (
        f"OlÃ¡, {cliente.nome}!\n\n"
        "Estamos reenviando a confirmaÃ§Ã£o do seu e-mail "
        "da conta VALT-ON.\n\n"
        "Para confirmar seu endereÃ§o de e-mail, "
        "acesse o link abaixo:\n\n"
        f"{link_confirmacao}\n\n"
        "Este link Ã© vÃ¡lido por 24 horas.\n\n"
        "VALT-ON"
    )

    url_segura = html.escape(link_confirmacao, quote=True)
    html_confirmacao = (
        f"<p>Olá, {html.escape(cliente.nome)}!</p>"
        "<p>Confirme seu e-mail VALT-ON:</p>"
        f'<p><a href="{url_segura}" style="display:inline-block;padding:12px 20px;background:#f3d77e;color:#27313b;font-weight:bold;text-decoration:none;border-radius:6px">Confirmar meu e-mail</a></p>'
        f'<p>Ou copie este endereço: <a href="{url_segura}">{url_segura}</a></p>'
        "<p>O link é válido por 24 horas.</p>"
    )
    enviado = enviar_email(
        cliente.email, "Confirme seu e-mail - VALT-ON", mensagem_confirmacao, html_confirmacao
    )

    if not enviado:
        raise HTTPException(
            status_code=500, detail="NÃ£o foi possÃ­vel enviar o e-mail de confirmaÃ§Ã£o."
        )

    return {
        "mensagem": "Novo e-mail de confirmaÃ§Ã£o enviado.",
        "cliente_id": cliente.id,
        "email": cliente.email,
        "email_confirmado": cliente.email_confirmado,
    }


def atualizar_status_pedidos_automaticamente(db):

    agora = datetime.now()

    pedidos = (
        db.query(models.Pedido)
        .filter(
            models.Pedido.status.in_(["Pago", "Preparando", "Enviado", "A caminho"])
        )
        .all()
    )

    for pedido in pedidos:

        if not pedido.data_pedido:
            continue

        try:

            data_pedido = datetime.strptime(pedido.data_pedido, "%Y-%m-%d %H:%M:%S")

        except ValueError:

            continue

        # Prazo 0 dias = 2 horas
        if pedido.prazo_entrega == 0:
            tempo_total = 2 * 60 * 60
        else:
            tempo_total = pedido.prazo_entrega * 24 * 60 * 60

        # Tempo decorrido desde a compra
        tempo_decorrido = (agora - data_pedido).total_seconds()

        percentual = (tempo_decorrido / tempo_total) * 100

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
        # NÃƒO FAZER NADA SE O STATUS JÃ ESTIVER CORRETO
        # -------------------------------------------------

        if pedido.status == novo_status:
            continue

        status_anterior = pedido.status

        pedido.status = novo_status

        print(f"Pedido #{pedido.id}: " f"{status_anterior} -> {novo_status}")

        # -------------------------------------------------
        # CRIAR FIGURINHAS DOS PRODUTOS ENTREGUES
        # -------------------------------------------------

        if novo_status == "Entregue" and pedido.espaco_id:

            itens = (
                db.query(models.ItemPedido)
                .filter(models.ItemPedido.pedido_id == pedido.id)
                .all()
            )

            for item in itens:

                for _ in range(item.quantidade):

                    figurinha = models.ItemEspacoCliente(
                        espaco_id=pedido.espaco_id,
                        produto_id=item.produto_id,
                        data_entrada=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    )

                    db.add(figurinha)

        # -------------------------------------------------
        # SALVAR ALTERAÃ‡ÃƒO DO PEDIDO
        # -------------------------------------------------

        db.commit()

        # -------------------------------------------------
        # BUSCAR CLIENTE
        # -------------------------------------------------

        cliente = (
            db.query(models.Cliente)
            .filter(models.Cliente.id == pedido.cliente_id)
            .first()
        )

        # -------------------------------------------------
        # ENVIAR E-MAIL
        # SOMENTE QUANDO O STATUS MUDAR
        # -------------------------------------------------

        if novo_status == "Entregue" and cliente and cliente.email:

            enviar_email(
                cliente.email,
                f"AtualizaÃ§Ã£o do pedido #{pedido.id} - VALT-ON",
                (
                    f"OlÃ¡, {cliente.nome}!\n\n"
                    f"Seu pedido #{pedido.id} "
                    "teve uma atualizaÃ§Ã£o.\n\n"
                    f"Status anterior: "
                    f"{status_anterior}\n"
                    f"Novo status: "
                    f"{novo_status}\n"
                    f"Total do pedido: "
                    f"{pedido.total:.2f} CVT\n\n"
                    "Acompanhe seu pedido pela "
                    "sua conta na VALT-ON.\n\n"
                    "VALT-ON"
                ),
            )


# =========================================================
# FUNÃ‡ÃƒO AUTOMÃTICA DO CRÃ‰DITO
# =========================================================


def executar_credito_automatico():

    db = SessionLocal()

    try:

        conceder_credito_semanal(db)

    except Exception as erro:

        db.rollback()

        print(f"Erro no crÃ©dito semanal CVT: {erro}")

    finally:

        db.close()


# =========================================================
# FUNÃ‡ÃƒO AUTOMÃTICA DOS PEDIDOS
# =========================================================


def executar_status_pedidos_automatico():

    db = SessionLocal()

    try:

        atualizar_status_pedidos_automaticamente(db)
        atualizar_vendas_usados_automaticamente(db)

    except Exception as erro:

        db.rollback()

        print("Erro na atualizaÃ§Ã£o automÃ¡tica " f"dos pedidos: {erro}")

    finally:

        db.close()


# =========================================================
# AGENDADOR
# =========================================================

scheduler = BackgroundScheduler()


# ---------------------------------------------------------
# CRÃ‰DITO SEMANAL
# DOMINGO Ã€S 00:00
# ---------------------------------------------------------

scheduler.add_job(
    executar_credito_automatico, "cron", day_of_week="sun", hour=0, minute=0, second=0
)


# ---------------------------------------------------------
# ATUALIZAÃ‡ÃƒO DOS PEDIDOS
# A CADA 1 MINUTO
# ---------------------------------------------------------

scheduler.add_job(executar_status_pedidos_automatico, "interval", minutes=1)


scheduler.start()


# =========================================================
# PÃGINA INICIAL
# =========================================================


@app.get("/")
def inicio():

    return {"mensagem": "Backend do VALT-ON funcionando!"}


# =========================================================
# TESTE
# =========================================================


@app.get("/teste")
def teste():

    return {"status": "ok", "projeto": "VALT-ON"}


# =========================================================
# PRODUTOS
# =========================================================


@app.get("/produtos", response_model=list[schemas.ProdutoResponse])
def listar_produtos(db: Session = Depends(get_db)):

    produtos = db.query(models.Produto).all()

    return produtos


# =========================================================
# BUSCAR PRODUTO
# =========================================================


@app.get("/produtos/{produto_id}", response_model=schemas.ProdutoResponse)
def buscar_produto(produto_id: int, db: Session = Depends(get_db)):

    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()

    if produto is None:

        raise HTTPException(status_code=404, detail="Produto nÃ£o encontrado")

    return produto


# =========================================================
# CADASTRAR PRODUTO
# =========================================================


@app.post("/produtos", response_model=schemas.ProdutoResponse)
def cadastrar_produto(produto: schemas.ProdutoCreate, db: Session = Depends(get_db)):

    novo_produto = models.Produto(
        nome=produto.nome,
        descricao=produto.descricao,
        preco=produto.preco,
        categoria=produto.categoria,
        estoque=produto.estoque,
        prazo_entrega_dias=produto.prazo_entrega_dias,
        imagem=produto.imagem,
    )

    db.add(novo_produto)

    db.commit()

    db.refresh(novo_produto)

    return novo_produto


# =========================================================
# ALTERAR PRODUTO
# =========================================================


@app.put("/produtos/{produto_id}", response_model=schemas.ProdutoResponse)
def alterar_produto(
    produto_id: int, dados: schemas.ProdutoCreate, db: Session = Depends(get_db)
):

    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()

    if produto is None:

        raise HTTPException(status_code=404, detail="Produto nÃ£o encontrado")

    produto.nome = dados.nome
    produto.descricao = dados.descricao
    produto.preco = dados.preco
    produto.categoria = dados.categoria
    produto.estoque = dados.estoque
    produto.prazo_entrega_dias = dados.prazo_entrega_dias
    produto.imagem = dados.imagem

    db.commit()

    db.refresh(produto)

    return produto


# =========================================================
# EXCLUIR PRODUTO
# =========================================================


@app.delete("/produtos/{produto_id}")
def excluir_produto(produto_id: int, db: Session = Depends(get_db)):

    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()

    if produto is None:

        raise HTTPException(status_code=404, detail="Produto nÃ£o encontrado")

    db.delete(produto)

    db.commit()

    return {"mensagem": "Produto excluÃ­do com sucesso"}


# =========================================================
# UPLOAD DE IMAGEM
# =========================================================


@app.post("/upload-imagem")
async def upload_imagem(file: UploadFile = File(...)):

    extensoes_permitidas = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

    extensao = Path(file.filename or "").suffix.lower()

    if extensao not in extensoes_permitidas:

        raise HTTPException(status_code=400, detail="Formato de imagem nÃ£o permitido.")

    nome_arquivo = Path(file.filename or "imagem").name

    try:

        conteudo = await file.read()

        ftp = FTP()
        ftp.connect(os.getenv("HOSTINGER_FTP_HOST"), 21, timeout=15)
        ftp.login(
            os.getenv("HOSTINGER_FTP_USER"),
            os.getenv("HOSTINGER_FTP_PASSWORD"),
        )
        ftp.cwd(os.getenv("HOSTINGER_FTP_PATH"))

        from io import BytesIO
        ftp.storbinary(f"STOR {nome_arquivo}", BytesIO(conteudo))
        ftp.quit()

        url_publica = (
            f"https://darkslategrey-gerbil-151298.hostingersite.com/"
            f"produtos/{nome_arquivo}"
        )

        return {
            "mensagem": "Imagem enviada com sucesso!",
            "arquivo": nome_arquivo,
            "url": url_publica,
        }

    except Exception as erro:

        raise HTTPException(
            status_code=500, detail=f"Erro ao enviar imagem: {str(erro)}"
        )


# =========================================================
# CLIENTES
# =========================================================


@app.post("/clientes", response_model=schemas.ClienteResponse)
def cadastrar_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):

    # -----------------------------------------------------
    # VERIFICAR E-MAIL
    # -----------------------------------------------------

    cliente_existente = (
        db.query(models.Cliente).filter(models.Cliente.email == cliente.email).first()
    )

    if cliente_existente:

        raise HTTPException(status_code=400, detail="E-mail jÃ¡ cadastrado.")

    if cliente.indicador_id is not None:
        if cliente.indicador_id <= 0:
            raise HTTPException(status_code=400, detail="Número do indicador inválido.")
        indicador = db.query(models.Cliente).filter(models.Cliente.id == cliente.indicador_id, models.Cliente.email_confirmado == 1).first()
        if indicador is None:
            raise HTTPException(status_code=400, detail="Cliente indicador não encontrado ou e-mail ainda não confirmado.")

    # -----------------------------------------------------
    # CRIAR CLIENTE
    # -----------------------------------------------------

    # O saldo inicial Ã© definido automaticamente
    # pelo models.py atravÃ©s de default=1000.0

    agora = datetime.now()
    dias_desde_domingo = (agora.weekday() + 1) % 7
    domingo = agora - timedelta(days=dias_desde_domingo)
    data_domingo = domingo.strftime("%Y-%m-%d")

    token_confirmacao = secrets.token_urlsafe(32)
    token_expira_em = (agora + timedelta(hours=24)).isoformat()

    novo_cliente = models.Cliente(
        nome=cliente.nome,
        email=cliente.email,
        senha=cliente.senha,
        ultimo_credito_cvt=data_domingo,
        token_confirmacao_email=token_confirmacao,
        token_confirmacao_expira_em=token_expira_em,
    )

    db.add(novo_cliente)

    db.commit()

    db.refresh(novo_cliente)

    if cliente.indicador_id is not None:
        db.add(models.Indicacao(indicador_id=cliente.indicador_id, indicado_id=novo_cliente.id, creditada=0))
        db.commit()

    # -----------------------------------------------------
    # CRIAR CASA PEQUENA AUTOMATICAMENTE
    # -----------------------------------------------------

    espaco_pequena = models.EspacoCliente(
        cliente_id=novo_cliente.id,
        tipo="pequena",
        nome="Casa Pequena",
        valor=0.0,
        adquirido="Sim",
    )

    db.add(espaco_pequena)
    db.commit()

    # -----------------------------------------------------
    # ENVIAR E-MAIL DE CONFIRMAÃ‡ÃƒO
    # -----------------------------------------------------

    link_confirmacao = (
        "https://valt-on.onrender.com/confirmar-email?token=" + token_confirmacao
    )

    mensagem_confirmacao = (
        f"OlÃ¡, {novo_cliente.nome}!\n\n"
        "Sua conta no VALT-ON foi criada com sucesso.\n\n"
        "Para confirmar seu endereÃ§o de e-mail, "
        "acesse o link abaixo:\n\n"
        f"{link_confirmacao}\n\n"
        "Este link Ã© vÃ¡lido por 24 horas.\n\n"
        "Se vocÃª nÃ£o criou esta conta, ignore este e-mail.\n\n"
        "VALT-ON"
    )

    url_segura = html.escape(link_confirmacao, quote=True)
    html_confirmacao = (
        f"<p>Olá, {html.escape(novo_cliente.nome)}!</p>"
        "<p>Sua conta no VALT-ON foi criada. Confirme seu e-mail:</p>"
        f'<p><a href="{url_segura}" style="display:inline-block;padding:12px 20px;background:#f3d77e;color:#27313b;font-weight:bold;text-decoration:none;border-radius:6px">Confirmar meu e-mail</a></p>'
        f'<p>Ou copie este endereço: <a href="{url_segura}">{url_segura}</a></p>'
        "<p>O link é válido por 24 horas. Se não criou a conta, ignore esta mensagem.</p>"
    )
    enviar_email(
        novo_cliente.email, "Confirme seu e-mail - VALT-ON", mensagem_confirmacao, html_confirmacao
    )

    return novo_cliente



# Reenvio público por e-mail: resposta neutra para não revelar contas.
@app.post("/reenviar-confirmacao-email")
def reenviar_confirmacao_publico(dados: schemas.ReenviarConfirmacao, db: Session = Depends(get_db)):
    resposta_neutra = {"mensagem": "Se houver uma conta pendente com esse e-mail, enviaremos um novo link. Confira também a pasta de spam."}
    email_normalizado = dados.email.strip().lower()
    if not email_normalizado or len(email_normalizado) > 254 or "@" not in email_normalizado:
        raise HTTPException(status_code=422, detail="Informe um e-mail válido.")
    cliente = db.query(models.Cliente).filter(models.Cliente.email == email_normalizado).first()
    if cliente is None or cliente.email_confirmado == 1:
        return resposta_neutra
    agora = datetime.now()
    # Limite de um envio a cada dois minutos, inclusive após o cadastro inicial.
    if cliente.token_confirmacao_expira_em:
        try:
            criado_em = datetime.fromisoformat(cliente.token_confirmacao_expira_em) - timedelta(hours=24)
            if agora - criado_em < timedelta(minutes=2):
                return resposta_neutra
        except ValueError:
            pass
    token = secrets.token_urlsafe(32)
    link = "https://valt-on.onrender.com/confirmar-email?token=" + token
    link_seguro = html.escape(link, quote=True)
    texto = f"Olá, {cliente.nome}!\\n\\nConfirme seu e-mail VALT-ON:\\n{link}\\n\\nO link é válido por 24 horas."
    html_corpo = (
        f"<p>Olá, {html.escape(cliente.nome)}!</p>"
        "<p>Seu novo link de confirmação VALT-ON:</p>"
        f'<p><a href="{link_seguro}" style="display:inline-block;background:#f3d77e;color:#27313b;padding:12px 18px;font-weight:bold">Confirmar meu e-mail</a></p>'
        f'<p>Ou acesse: <a href="{link_seguro}">{link_seguro}</a></p>'
        "<p>Válido por 24 horas.</p>"
    )
    if not enviar_email(cliente.email, "Novo link de confirmação - VALT-ON", texto, html_corpo):
        raise HTTPException(status_code=503, detail="Não foi possível enviar agora. Tente novamente mais tarde.")
    cliente.token_confirmacao_email = token
    cliente.token_confirmacao_expira_em = (agora + timedelta(hours=24)).isoformat()
    db.commit()
    return resposta_neutra

# Contagem aproximada de navegadores ativos nos últimos 2 minutos.
@app.post("/presenca/ping")
def registrar_presenca(dados: schemas.PresencaPing, db: Session = Depends(get_db)):
    sessao = dados.sessao
    if not isinstance(sessao, str) or len(sessao) != 36 or any(c not in "0123456789abcdef-" for c in sessao.lower()):
        raise HTTPException(status_code=422, detail="Sessão inválida.")
    agora = datetime.now()
    limite = (agora - timedelta(minutes=2)).isoformat()
    db.query(models.PresencaVisitante).filter(models.PresencaVisitante.ultima_atividade < limite).delete(synchronize_session=False)
    existente = db.query(models.PresencaVisitante).filter(models.PresencaVisitante.sessao == sessao).first()
    if existente:
        existente.ultima_atividade = agora.isoformat()
    else:
        db.add(models.PresencaVisitante(sessao=sessao, ultima_atividade=agora.isoformat()))
    db.commit()
    return {"ok": True}

# =========================================================
# RECUPERAÃ‡ÃƒO DE SENHA
# ========================================================


@app.post("/solicitar-recuperacao-senha")
def solicitar_recuperacao_senha(
    dados: schemas.RecuperacaoSenhaSolicitacao, db: Session = Depends(get_db)
):

    cliente = (
        db.query(models.Cliente).filter(models.Cliente.email == dados.email).first()
    )

    # Por seguranÃ§a, nÃ£o informamos se o e-mail existe ou nÃ£o.
    mensagem_padrao = {
        "mensagem": "Se o e-mail estiver cadastrado, enviaremos um link para recuperaÃ§Ã£o da senha."
    }

    if cliente is None:
        return mensagem_padrao

    token_recuperacao = secrets.token_urlsafe(32)

    token_expira_em = (datetime.now() + timedelta(hours=1)).isoformat()

    cliente.token_recuperacao_senha = token_recuperacao
    cliente.token_recuperacao_expira_em = token_expira_em

    db.commit()

    link_recuperacao = (
        "https://valt-on.vercel.app/recuperar-senha?token=" + token_recuperacao
    )

    mensagem_recuperacao = (
        f"OlÃ¡, {cliente.nome}!\n\n"
        "Recebemos uma solicitaÃ§Ã£o para redefinir sua senha no VALT-ON.\n\n"
        "Para criar uma nova senha, acesse o link abaixo:\n\n"
        f"{link_recuperacao}\n\n"
        "Este link Ã© vÃ¡lido por 1 hora.\n\n"
        "Se vocÃª nÃ£o solicitou a recuperaÃ§Ã£o da senha, ignore este e-mail.\n\n"
        "VALT-ON"
    )

    html_recuperacao = f"""
<html>
<body>
    <h2>RecuperaÃ§Ã£o de senha - VALT-ON</h2>

    <p>OlÃ¡, {cliente.nome}!</p>

    <p>
        Recebemos uma solicitaÃ§Ã£o para redefinir sua senha no VALT-ON.
    </p>

    <p>
        Para criar uma nova senha, clique no botÃ£o abaixo:
    </p>

    <p>
        <a href="{link_recuperacao}"
           style="
               display: inline-block;
               padding: 12px 24px;
               background-color: #000000;
               color: #ffffff;
               text-decoration: none;
               border-radius: 6px;
               font-weight: bold;
           ">
            Redefinir minha senha
        </a>
    </p>

    <p>
        Este link Ã© vÃ¡lido por 1 hora.
    </p>

    <p>
        Se vocÃª nÃ£o solicitou a recuperaÃ§Ã£o da senha, ignore este e-mail.
    </p>

    <p>
        VALT-ON
    </p>
</body>
</html>
"""

    enviado = enviar_email(
        cliente.email,
        "RecuperaÃ§Ã£o de senha - VALT-ON",
        mensagem_recuperacao,
        html_recuperacao,
    )

    if not enviado:
        raise HTTPException(
            status_code=500, detail="NÃ£o foi possÃ­vel enviar o e-mail de recuperaÃ§Ã£o."
        )

    return mensagem_padrao


@app.post("/redefinir-senha")
def redefinir_senha(
    dados: schemas.RecuperacaoSenhaRedefinir, db: Session = Depends(get_db)
):

    cliente = (
        db.query(models.Cliente)
        .filter(models.Cliente.token_recuperacao_senha == dados.token)
        .first()
    )

    if cliente is None:
        raise HTTPException(status_code=400, detail="Token de recuperaÃ§Ã£o invÃ¡lido.")

    if not cliente.token_recuperacao_expira_em:
        raise HTTPException(status_code=400, detail="Token de recuperaÃ§Ã£o invÃ¡lido.")

    try:
        expiracao = datetime.fromisoformat(cliente.token_recuperacao_expira_em)
    except ValueError:
        raise HTTPException(status_code=400, detail="Token de recuperaÃ§Ã£o invÃ¡lido.")

    if datetime.now() > expiracao:
        raise HTTPException(status_code=400, detail="O link de recuperaÃ§Ã£o expirou.")

    cliente.senha = dados.nova_senha

    # Invalida o token depois que a senha foi alterada.
    cliente.token_recuperacao_senha = None
    cliente.token_recuperacao_expira_em = None

    db.commit()

    return {"mensagem": "Senha redefinida com sucesso."}


# =========================================================
# CONFIRMAÃ‡ÃƒO DE E-MAIL
# =========================================================


@app.get("/confirmar-email")
def confirmar_email(token: str, db: Session = Depends(get_db)):
    cliente = (
        db.query(models.Cliente)
        .filter(models.Cliente.token_confirmacao_email == token)
        .first()
    )

    if cliente is None:
        raise HTTPException(status_code=400, detail="Token de confirmaÃ§Ã£o invÃ¡lido.")

    if cliente.email_confirmado == 1:
        return {"mensagem": "E-mail jÃ¡ confirmado."}

    if cliente.token_confirmacao_expira_em is None:
        raise HTTPException(status_code=400, detail="Token de confirmaÃ§Ã£o invÃ¡lido.")

    try:
        expiracao = datetime.fromisoformat(cliente.token_confirmacao_expira_em)
    except ValueError:
        raise HTTPException(status_code=400, detail="Token de confirmaÃ§Ã£o invÃ¡lido.")

    if datetime.now() > expiracao:
        raise HTTPException(status_code=400, detail="Token de confirmaÃ§Ã£o expirado.")

    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente.id).with_for_update().one()
    if cliente.email_confirmado == 1:
        return {"mensagem": "E-mail já confirmado."}
    indicacao = db.query(models.Indicacao).filter(models.Indicacao.indicado_id == cliente.id, models.Indicacao.creditada == 0).with_for_update().first()
    if indicacao is not None:
        indicador = db.query(models.Cliente).filter(models.Cliente.id == indicacao.indicador_id).with_for_update().first()
        if indicador is not None:
            indicador.saldo_cvt = (indicador.saldo_cvt or 0) + 300.0
            indicacao.creditada = 1

    cliente.email_confirmado = 1
    cliente.token_confirmacao_email = None
    cliente.token_confirmacao_expira_em = None

    db.commit()

    return {"mensagem": "E-mail confirmado com sucesso!"}


# =========================================================
# LOGIN
# =========================================================


@app.post("/login")
def login(dados: schemas.ClienteLogin, db: Session = Depends(get_db)):
    cliente = (
        db.query(models.Cliente).filter(models.Cliente.email == dados.email).first()
    )

    if cliente is None:
        raise HTTPException(status_code=401, detail="E-mail ou senha invÃ¡lidos.")

    if cliente.email_confirmado != 1:
        raise HTTPException(
            status_code=403, detail="Confirme seu e-mail antes de fazer login."
        )

    if cliente.senha != dados.senha:
        raise HTTPException(status_code=401, detail="E-mail ou senha invÃ¡lidos.")

    # =====================================================
    # VERIFICAR CRÃ‰DITO SEMANAL
    # =====================================================

    conceder_credito_semanal(db)

    # Atualizar os dados do cliente apÃ³s
    # possÃ­vel crÃ©dito

    db.refresh(cliente)

    return {
        "mensagem": "Login realizado com sucesso!",
        "cliente": {
            "id": cliente.id,
            "nome": cliente.nome,
            "email": cliente.email,
            "saldo_cvt": cliente.saldo_cvt,
        },
    }


# =========================================================
# LOGIN DO ADMINISTRADOR
# =========================================================


@app.post("/login-admin")
def login_admin(dados: schemas.ClienteLogin, db: Session = Depends(get_db)):

    # ADMINISTRADOR PRINCIPAL
    if dados.email == ADMIN_EMAIL and dados.senha == ADMIN_PASSWORD:
        return {
            "mensagem": "Login de administrador realizado com sucesso!",
            "admin": True,
            "email": dados.email,
            "admin_id": 0,
        }

    # DEMAIS ADMINISTRADORES
    administrador = (
        db.query(models.Administrador)
        .filter(
            models.Administrador.email == dados.email, models.Administrador.ativo == 1
        )
        .first()
    )

    if administrador is None:
        raise HTTPException(
            status_code=401, detail="E-mail ou senha de administrador invÃ¡lidos."
        )

    senha_correta = bcrypt.checkpw(
        dados.senha.encode("utf-8"), administrador.senha_hash.encode("utf-8")
    )

    if not senha_correta:
        raise HTTPException(
            status_code=401, detail="E-mail ou senha de administrador invÃ¡lidos."
        )

    return {
        "mensagem": "Login de administrador realizado com sucesso!",
        "admin": True,
        "email": administrador.email,
        "nome": administrador.nome,
        "admin_id": administrador.id,
    }


# =========================================================
# ESTATÃSTICAS DO ADMINISTRADOR
# =========================================================


@app.get("/admin/estatisticas")
def estatisticas_admin(db: Session = Depends(get_db)):
    quantidade_clientes = db.query(models.Cliente).count()

    quantidade_produtos = db.query(models.Produto).count()

    limite = (datetime.now() - timedelta(minutes=2)).isoformat()
    visitantes_ativos = db.query(models.PresencaVisitante).filter(models.PresencaVisitante.ultima_atividade >= limite).count()
    inicio_30_dias = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S")
    pedidos_validos = ~models.Pedido.status.in_(["Pendente", "Cancelado", "Cancelada", "Estornado", "Reembolsado"])

    def unidades_compradas(desde=None):
        consulta = (
            db.query(func.coalesce(func.sum(models.ItemPedido.quantidade), 0))
            .join(models.Pedido, models.ItemPedido.pedido_id == models.Pedido.id)
            .filter(pedidos_validos)
        )
        if desde is not None:
            consulta = consulta.filter(models.Pedido.data_pedido >= desde)
        return int(consulta.scalar() or 0)

    def usados_vendidos(desde=None):
        consulta = db.query(models.VendaUsado).filter(
            models.VendaUsado.comprador_id.isnot(None),
            models.VendaUsado.status.in_(["EM_ENTREGA", "ENTREGUE", "VENDIDO"]),
        )
        if desde is not None:
            consulta = consulta.filter(models.VendaUsado.data_venda >= desde)
        return consulta.count()

    return {
        "clientes": quantidade_clientes,
        "produtos": quantidade_produtos,
        "visitantes_ativos": visitantes_ativos,
        "comprados_30_dias": unidades_compradas(inicio_30_dias),
        "comprados_total": unidades_compradas(),
        "usados_vendidos_30_dias": usados_vendidos(inicio_30_dias),
        "usados_vendidos_total": usados_vendidos(),
    }


# =========================================================
# FINALIZAR COMPRA
# =========================================================


@app.post("/finalizar-compra")
def finalizar_compra(compra: schemas.CompraCreate, db: Session = Depends(get_db)):

    # -----------------------------------------------------
    # VERIFICAR CARRINHO
    # -----------------------------------------------------

    if not compra.itens:

        raise HTTPException(status_code=400, detail="Carrinho vazio.")

    # -----------------------------------------------------
    # VERIFICAR CLIENTE
    # -----------------------------------------------------

    cliente = (
        db.query(models.Cliente).filter(models.Cliente.id == compra.cliente_id).first()
    )

    if cliente is None:

        raise HTTPException(status_code=404, detail="Cliente nÃ£o encontrado.")

    # -----------------------------------------------------
    # VERIFICAR ESPAÃ‡O DO CLIENTE
    # -----------------------------------------------------

    if compra.espaco_id is None:
        raise HTTPException(
            status_code=400,
            detail="Ã‰ necessÃ¡rio selecionar um espaÃ§o para realizar a compra.",
        )

    espaco = (
        db.query(models.EspacoCliente)
        .filter(
            models.EspacoCliente.id == compra.espaco_id,
            models.EspacoCliente.cliente_id == compra.cliente_id,
        )
        .first()
    )

    if espaco is None:
        raise HTTPException(
            status_code=400, detail="EspaÃ§o invÃ¡lido ou nÃ£o pertence ao cliente."
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

            raise HTTPException(status_code=400, detail="Quantidade invÃ¡lida.")

        produto = (
            db.query(models.Produto).filter(models.Produto.id == produto_id).first()
        )

        if produto is None:

            raise HTTPException(
                status_code=404, detail=(f"Produto {produto_id} " "nÃ£o encontrado.")
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
                    f"DisponÃ­vel: "
                    f"{produto.estoque}"
                ),
            )

        prazo_entrega = max(prazo_entrega, produto.prazo_entrega_dias)

        produtos_compra.append((produto, quantidade))

        total += produto.preco * quantidade

    # -----------------------------------------------------
    # VERIFICAR SALDO CVT
    # -----------------------------------------------------

    if cliente.saldo_cvt < total:

        raise HTTPException(
            status_code=400,
            detail=(
                "Saldo CVT insuficiente. "
                f"Saldo disponÃ­vel: "
                f"{cliente.saldo_cvt:.2f} CVT. "
                f"Total da compra: "
                f"{total:.2f} CVT."
            ),
        )

    # -----------------------------------------------------
    # DESCONTAR SALDO CVT
    # -----------------------------------------------------

    cliente.saldo_cvt -= total

    # -----------------------------------------------------
    # CRIAR PEDIDO
    # -----------------------------------------------------

    data_pedido = datetime.now()
    data_entrega_prevista = data_pedido + timedelta(days=prazo_entrega)

    pedido = models.Pedido(
        cliente_id=compra.cliente_id,
        espaco_id=compra.espaco_id,
        status="Pago",
        total=total,
        prazo_entrega=prazo_entrega,
        data_pedido=data_pedido.strftime("%Y-%m-%d %H:%M:%S"),
        data_entrega_prevista=data_entrega_prevista.strftime("%Y-%m-%d %H:%M:%S"),
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
            preco_unitario=produto.preco,
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
        "saldo_cvt": cliente.saldo_cvt,
    }


# =========================================================
# PEDIDOS DO CLIENTE
# =========================================================


@app.get("/clientes/{cliente_id}/pedidos")
def listar_pedidos_cliente(cliente_id: int, db: Session = Depends(get_db)):

    # -----------------------------------------------------
    # VERIFICAR CLIENTE
    # -----------------------------------------------------

    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()

    if cliente is None:

        raise HTTPException(status_code=404, detail="Cliente nÃ£o encontrado.")

    # -----------------------------------------------------
    # BUSCAR PEDIDOS
    # -----------------------------------------------------

    pedidos = (
        db.query(models.Pedido)
        .filter(models.Pedido.cliente_id == cliente_id)
        .order_by(models.Pedido.id.desc())
        .all()
    )

    resultado = []

    # -----------------------------------------------------
    # MONTAR RESPOSTA
    # -----------------------------------------------------

    for pedido in pedidos:

        itens = (
            db.query(models.ItemPedido)
            .filter(models.ItemPedido.pedido_id == pedido.id)
            .all()
        )

        itens_resultado = []

        for item in itens:

            produto = (
                db.query(models.Produto)
                .filter(models.Produto.id == item.produto_id)
                .first()
            )

            itens_resultado.append(
                {
                    "produto_id": item.produto_id,
                    "nome": (produto.nome if produto else "Produto nÃ£o encontrado"),
                    "imagem": (produto.imagem if produto else None),
                    "quantidade": item.quantidade,
                    "preco_unitario": item.preco_unitario,
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
                "itens": itens_resultado,
            }
        )

    return resultado


# =========================================================
# ALTERAR STATUS DO PEDIDO
# ADMINISTRADOR
# =========================================================
@app.put("/pedidos/{pedido_id}/status")
def alterar_status_pedido(pedido_id: int, dados: dict, db: Session = Depends(get_db)):

    # -----------------------------------------------------
    # BUSCAR PEDIDO
    # -----------------------------------------------------

    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()

    if pedido is None:

        raise HTTPException(status_code=404, detail="Pedido nÃ£o encontrado.")

    # -----------------------------------------------------
    # PEGAR NOVO STATUS
    # -----------------------------------------------------

    novo_status = dados.get("status")

    if not novo_status:

        raise HTTPException(status_code=400, detail="O status do pedido Ã© obrigatÃ³rio.")

    # -----------------------------------------------------
    # STATUS PERMITIDOS
    # -----------------------------------------------------

    status_permitidos = [
        "Pago",
        "Preparando",
        "Enviado",
        "A caminho",
        "Entregue",
        "Cancelado",
    ]

    if novo_status not in status_permitidos:

        raise HTTPException(status_code=400, detail="Status invÃ¡lido.")

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
            .filter(models.Cliente.id == pedido.cliente_id)
            .first()
        )

        if novo_status == "Entregue" and cliente and cliente.email:

            enviar_email(
                cliente.email,
                f"AtualizaÃ§Ã£o do pedido #{pedido.id} - VALT-ON",
                (
                    f"OlÃ¡, {cliente.nome}!\n\n"
                    f"Seu pedido #{pedido.id} teve uma atualizaÃ§Ã£o.\n\n"
                    f"Status anterior: {status_anterior}\n"
                    f"Novo status: {novo_status}\n"
                    f"Total do pedido: {pedido.total:.2f} CVT\n\n"
                    "Acompanhe seu pedido pela sua conta na VALT-ON.\n\n"
                    "VALT-ON"
                ),
            )
    # -----------------------------------------------------
    # RESPOSTA
    # -----------------------------------------------------

    return {
        "mensagem": "Status do pedido atualizado com sucesso!",
        "pedido_id": pedido.id,
        "status": pedido.status,
    }


# =========================================================
# LISTAR TODOS OS PEDIDOS
# ADMINISTRADOR
# =========================================================


@app.get("/pedidos")
def listar_todos_pedidos(db: Session = Depends(get_db)):

    pedidos = db.query(models.Pedido).order_by(models.Pedido.id.desc()).all()

    resultado = []

    for pedido in pedidos:

        cliente = (
            db.query(models.Cliente)
            .filter(models.Cliente.id == pedido.cliente_id)
            .first()
        )

        resultado.append(
            {
                "pedido_id": pedido.id,
                "cliente_id": pedido.cliente_id,
                "cliente_nome": (cliente.nome if cliente else "Cliente nÃ£o encontrado"),
                "cliente_email": cliente.email if cliente else "",
                "status": pedido.status,
                "total": pedido.total,
                "prazo_entrega": pedido.prazo_entrega,
            }
        )

    return resultado


# =========================================================
# ESPAÃ‡OS DO CLIENTE
# =========================================================


@app.post("/clientes/{cliente_id}/espacos/comprar")
def comprar_casa(
    cliente_id: int, casa: schemas.CasaCompra, db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # VERIFICAR CLIENTE
    # -----------------------------------------------------

    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()

    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente nÃ£o encontrado.")

    # -----------------------------------------------------
    # VERIFICAR CLIENTE INFORMADO
    # -----------------------------------------------------

    if casa.cliente_id != cliente_id:
        raise HTTPException(
            status_code=400,
            detail="Cliente informado nÃ£o corresponde ao cliente da rota.",
        )

    # -----------------------------------------------------
    # VERIFICAR TIPO DA CASA
    # -----------------------------------------------------

    config = CASAS_CONFIG.get(casa.tipo)

    if config is None:
        raise HTTPException(status_code=400, detail="Tipo de casa invÃ¡lido.")

    # -----------------------------------------------------
    # VERIFICAR SALDO
    # -----------------------------------------------------

    valor = config["valor"]

    if cliente.saldo_cvt < valor:
        raise HTTPException(
            status_code=400,
            detail=(
                "Saldo CVT insuficiente. "
                f"Saldo disponÃ­vel: {cliente.saldo_cvt:.2f} CVT. "
                f"Valor da casa: {valor:.2f} CVT."
            ),
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
        adquirido="Sim",
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
        "saldo_cvt": cliente.saldo_cvt,
    }


# =========================================================
# ESPAÃ‡OS DO CLIENTE
# =========================================================


@app.get("/clientes/{cliente_id}/espacos")
def listar_espacos_cliente(cliente_id: int, db: Session = Depends(get_db)):

    # -----------------------------------------------------
    # VERIFICAR CLIENTE
    # -----------------------------------------------------

    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()

    if cliente is None:

        raise HTTPException(status_code=404, detail="Cliente nÃ£o encontrado.")

    # -----------------------------------------------------
    # BUSCAR ESPAÃ‡OS DO CLIENTE
    # -----------------------------------------------------

    espacos = (
        db.query(models.EspacoCliente)
        .filter(models.EspacoCliente.cliente_id == cliente_id)
        .order_by(models.EspacoCliente.id)
        .all()
    )

    # -----------------------------------------------------
    # MONTAR RESPOSTA
    # -----------------------------------------------------

    resultado = []

    for espaco in espacos:

        itens = (
            db.query(models.ItemEspacoCliente, models.Produto)
            .join(
                models.Produto, models.Produto.id == models.ItemEspacoCliente.produto_id
            )
            .filter(
                models.ItemEspacoCliente.espaco_id == espaco.id,
                models.ItemEspacoCliente.status != "EXCLUIDO",
            )
            .all()
        )

        figurinhas = []

        for item_espaco, produto in itens:

            figurinhas.append(
                {
                    "id": item_espaco.id,
                    "produto_id": produto.id,
                    "nome": produto.nome,
                    "imagem": produto.imagem,
                    "preco": produto.preco,
                    "data_entrada": item_espaco.data_entrada,
                }
            )

        resultado.append(
            {
                "id": espaco.id,
                "cliente_id": espaco.cliente_id,
                "tipo": espaco.tipo,
                "nome": espaco.nome,
                "valor": espaco.valor,
                "adquirido": espaco.adquirido,
                "figurinhas": figurinhas,
            }
        )

    return resultado

# =========================================================
# EXCLUIR ITEM DA CASA DO CLIENTE
# =========================================================


@app.delete("/clientes/{cliente_id}/espacos/itens/{item_id}")
def excluir_item_espaco(
    cliente_id: int,
    item_id: int,
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # BUSCAR ITEM E VERIFICAR PROPRIETÃRIO
    # -----------------------------------------------------

    item = (
        db.query(models.ItemEspacoCliente)
        .join(
            models.EspacoCliente,
            models.EspacoCliente.id == models.ItemEspacoCliente.espaco_id,
        )
        .filter(
            models.ItemEspacoCliente.id == item_id,
            models.EspacoCliente.cliente_id == cliente_id,
        )
        .first()
    )

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item nÃ£o encontrado na casa deste cliente.",
        )

    # -----------------------------------------------------
    # EXCLUSÃƒO LÃ“GICA
    # -----------------------------------------------------

    if item.status == "VENDA":
        raise HTTPException(
            status_code=400,
            detail="Este produto esta anunciado para venda e nao pode ser excluido.",
        )

    item.status = "EXCLUIDO"

    db.commit()

    return {
        "mensagem": "Produto excluÃ­do da casa com sucesso.",
        "item_id": item.id,
    }


# =========================================================
# COLOCAR FIGURINHA A VENDA
# =========================================================


@app.post("/clientes/{cliente_id}/espacos/itens/{item_id}/vender")
def colocar_item_a_venda(
    cliente_id: int,
    item_id: int,
    dados: schemas.VendaUsadoCriar,
    db: Session = Depends(get_db),
):

    if dados.cliente_id != cliente_id:
        raise HTTPException(
            status_code=400,
            detail="Cliente informado nao corresponde ao proprietario.",
        )

    item = (
        db.query(models.ItemEspacoCliente)
        .join(
            models.EspacoCliente,
            models.EspacoCliente.id == models.ItemEspacoCliente.espaco_id,
        )
        .filter(
            models.ItemEspacoCliente.id == item_id,
            models.EspacoCliente.cliente_id == cliente_id,
        )
        .first()
    )

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item nao encontrado na casa deste cliente.",
        )

    if item.status == "EXCLUIDO":
        raise HTTPException(
            status_code=400,
            detail="Este produto nao esta mais disponivel na casa.",
        )

    if item.status == "VENDA":
        raise HTTPException(
            status_code=400,
            detail="Este produto ja esta anunciado para venda.",
        )

    produto = (
        db.query(models.Produto)
        .filter(models.Produto.id == item.produto_id)
        .first()
    )

    if produto is None:
        raise HTTPException(
            status_code=404,
            detail="Produto original nao encontrado.",
        )

    limite_venda = round(produto.preco * 0.80, 2)

    if dados.preco_venda <= 0:
        raise HTTPException(
            status_code=400,
            detail="O preco de venda deve ser maior que zero.",
        )

    if dados.preco_venda > limite_venda:
        raise HTTPException(
            status_code=400,
            detail=f"O preco maximo permitido e {limite_venda:.2f} CVT.",
        )

    item.status = "VENDA"
    item.preco_venda = dados.preco_venda

    venda = models.VendaUsado(
        item_espaco_id=item.id,
        vendedor_id=cliente_id,
        produto_id=produto.id,
        preco_venda=dados.preco_venda,
        status="DISPONIVEL",
        data_venda=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )

    db.add(venda)
    db.commit()
    db.refresh(venda)

    return {
        "mensagem": "Produto colocado a venda com sucesso.",
        "venda_id": venda.id,
        "item_id": item.id,
        "produto_id": produto.id,
        "preco_venda": venda.preco_venda,
        "limite_maximo": limite_venda,
        "status": venda.status,
    }
# =========================================================
# LISTAR PRODUTOS USADOS DISPONIVEIS
# =========================================================


@app.get("/produtos-usados")
def listar_produtos_usados(db: Session = Depends(get_db)):

    vendas = (
        db.query(
            models.VendaUsado,
            models.Produto,
            models.Cliente,
        )
        .join(
            models.Produto,
            models.Produto.id == models.VendaUsado.produto_id,
        )
        .join(
            models.Cliente,
            models.Cliente.id == models.VendaUsado.vendedor_id,
        )
        .filter(
            models.VendaUsado.status == "DISPONIVEL",
        )
        .all()
    )

    resultado = []

    for venda, produto, vendedor in vendas:
        resultado.append(
            {
                "venda_id": venda.id,
                "produto_id": produto.id,
                "nome": produto.nome,
                "descricao": produto.descricao,
                "imagem": produto.imagem,
                "preco_original": produto.preco,
                "preco_venda": venda.preco_venda,
                "vendedor_id": vendedor.id,
                "vendedor_nome": vendedor.nome,
                "status": venda.status,
            }
        )

    return resultado


# =========================================================
# SUGESTÃ•ES DOS CLIENTES
# =========================================================


@app.post("/sugestoes")
def criar_sugestao(
    dados: schemas.SugestaoCriar,
    db: Session = Depends(get_db),
):
    sugestao = models.Sugestao(
        cliente_id=dados.cliente_id,
        nome=dados.nome,
        email=dados.email,
        tipo=dados.tipo,
        mensagem=dados.mensagem,
        status="Pendente",
        data_criacao=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )

    db.add(sugestao)
    db.commit()
    db.refresh(sugestao)

    return {
        "mensagem": "SugestÃ£o enviada com sucesso!",
        "id": sugestao.id,
        "status": sugestao.status,
        "resposta_admin": sugestao.resposta_admin,
    }


# =========================================================
# DIAGNOSTICO TEMPORARIO
# =========================================================

# =========================================================
# ATUALIZAÃ‡ÃƒO DO STATUS DA SUGESTÃƒO
# =========================================================

@app.put("/sugestoes/{sugestao_id}/status")
def atualizar_status_sugestao(
    sugestao_id: int,
    status: str,
    admin_id: int,
    resposta_admin: str | None = None,
    db: Session = Depends(get_db),
):
    if admin_id != 0:
        administrador = (
            db.query(models.Administrador)
            .filter(
                models.Administrador.id == admin_id,
                models.Administrador.ativo == 1,
            )
            .first()
        )

        if administrador is None:
            raise HTTPException(
                status_code=403,
                detail="Acesso permitido somente para administradores.",
            )

    status_permitidos = [
        "Pendente",
        "Em anÃ¡lise",
        "Respondida",
        "Encerrada",
    ]

    if status not in status_permitidos:
        raise HTTPException(
            status_code=400,
            detail="Status invÃ¡lido.",
        )

    sugestao = (
        db.query(models.Sugestao)
        .filter(models.Sugestao.id == sugestao_id)
        .first()
    )

    if sugestao is None:
        raise HTTPException(
            status_code=404,
            detail="SugestÃ£o nÃ£o encontrada.",
        )

    sugestao.status = status

    if resposta_admin is not None:
        sugestao.resposta_admin = resposta_admin

    db.commit()
    db.refresh(sugestao)

    if status == "Respondida" and sugestao.resposta_admin:
        assunto = "Resposta ? sua sugest?o - VALT-ON"

        mensagem_email = (
            f"Ol?, {sugestao.nome}!\n\n"
            "Recebemos sua sugest?o enviada ao VALT-ON.\n\n"
            f"Sua mensagem:\n{sugestao.mensagem}\n\n"
            "Resposta do administrador:\n"
            f"{sugestao.resposta_admin}\n\n"
            "Atenciosamente,\n"
            "Equipe VALT-ON"
        )

        enviar_email(
            sugestao.email,
            assunto,
            mensagem_email,
        )

    return {
        "mensagem": "Status da sugestÃ£o atualizado com sucesso!",
        "id": sugestao.id,
        "status": sugestao.status,
        "resposta_admin": sugestao.resposta_admin,
    }



# =========================================================
# LISTAGEM DAS SUGESTÃ•ES
# =========================================================

@app.get("/sugestoes")
def listar_sugestoes(
    admin_id: int,
    db: Session = Depends(get_db),
):
    if admin_id != 0:
        administrador = (
            db.query(models.Administrador)
            .filter(
                models.Administrador.id == admin_id,
                models.Administrador.ativo == 1,
            )
            .first()
        )

        if administrador is None:
            raise HTTPException(
                status_code=403,
                detail="Acesso permitido somente para administradores.",
            )

    sugestoes = (
        db.query(models.Sugestao)
        .order_by(models.Sugestao.id.desc())
        .all()
    )

    return [
        {
            "id": sugestao.id,
            "cliente_id": sugestao.cliente_id,
            "nome": sugestao.nome,
            "email": sugestao.email,
            "tipo": sugestao.tipo,
            "mensagem": sugestao.mensagem,
            "status": sugestao.status,
            "resposta_admin": sugestao.resposta_admin,
            "data_criacao": sugestao.data_criacao,
        }
        for sugestao in sugestoes
    ]
@app.get("/diagnostico-versao")
def diagnostico_versao():
    return {
        "arquivo": __file__,
        "confirmar_email": any(rota.path == "/confirmar-email" for rota in app.routes),
    }

# =========================================================
# ENVIAR OFERTA POR PRODUTO USADO
# =========================================================

@app.post("/produtos-usados/ofertar")
def enviar_oferta_produto_usado(
    dados: schemas.OfertaUsadoCriar,
    db: Session = Depends(get_db),
):
    comprador = (
        db.query(models.Cliente)
        .filter(models.Cliente.id == dados.comprador_id)
        .first()
    )

    if comprador is None:
        raise HTTPException(
            status_code=404,
            detail="Comprador nÃ£o encontrado.",
        )

    venda = (
        db.query(models.VendaUsado)
        .filter(models.VendaUsado.id == dados.venda_id)
        .first()
    )

    if venda is None:
        raise HTTPException(
            status_code=404,
            detail="Venda nÃ£o encontrada.",
        )

    if venda.status != "DISPONIVEL":
        raise HTTPException(
            status_code=400,
            detail="Esta venda nÃ£o estÃ¡ mais disponÃ­vel.",
        )

    if venda.vendedor_id == dados.comprador_id:
        raise HTTPException(
            status_code=400,
            detail="VocÃª nÃ£o pode fazer uma oferta para o prÃ³prio produto.",
        )

    if dados.valor_oferta <= 0:
        raise HTTPException(
            status_code=400,
            detail="O valor da oferta deve ser maior que zero.",
        )

    if dados.valor_oferta > venda.preco_venda:
        raise HTTPException(
            status_code=400,
            detail="A oferta nÃ£o pode ultrapassar o preÃ§o anunciado.",
        )

    oferta = models.OfertaUsado(
        venda_id=venda.id,
        comprador_id=dados.comprador_id,
        espaco_id=dados.espaco_id,
        valor_oferta=dados.valor_oferta,
        status="PENDENTE",
        data_oferta=datetime.now().isoformat(),
    )

    db.add(oferta)
    db.commit()
    db.refresh(oferta)

    return {
        "mensagem": "Oferta enviada com sucesso!",
        "id": oferta.id,
        "venda_id": oferta.venda_id,
        "comprador_id": oferta.comprador_id,
        "valor_oferta": oferta.valor_oferta,
        "status": oferta.status,
        "data_oferta": oferta.data_oferta,
    }

    # =========================================================
# LISTAR OFERTAS RECEBIDAS PELO VENDEDOR
# =========================================================

@app.get("/produtos-usados/ofertas/{vendedor_id}")
def listar_ofertas_produtos_usados(
    vendedor_id: int,
    db: Session = Depends(get_db),
):
    ofertas = (
        db.query(
            models.OfertaUsado,
            models.VendaUsado,
            models.Produto,
            models.Cliente,
        )
        .join(
            models.VendaUsado,
            models.VendaUsado.id == models.OfertaUsado.venda_id,
        )
        .join(
            models.Produto,
            models.Produto.id == models.VendaUsado.produto_id,
        )
        .join(
            models.Cliente,
            models.Cliente.id == models.OfertaUsado.comprador_id,
        )
        .filter(
            models.VendaUsado.vendedor_id == vendedor_id,
        )
        .order_by(
            models.OfertaUsado.id.desc()
        )
        .all()
    )

    resultado = []

    for oferta, venda, produto, comprador in ofertas:
        resultado.append(
            {
                "oferta_id": oferta.id,
                "venda_id": venda.id,
                "produto_id": produto.id,
                "produto_nome": produto.nome,
                "comprador_id": comprador.id,
                "comprador_nome": comprador.nome,
                "preco_venda": venda.preco_venda,
                "valor_oferta": oferta.valor_oferta,
                "status": oferta.status,
                "data_oferta": oferta.data_oferta,
            }
        )

    return resultado


# =========================================================
# COMPRAR PRODUTO USADO
# =========================================================


@app.post("/produtos-usados/comprar")
def comprar_produto_usado(
    compra: schemas.CompraUsadoCriar,
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # VERIFICAR COMPRADOR
    # -----------------------------------------------------

    comprador = (
        db.query(models.Cliente)
        .filter(models.Cliente.id == compra.cliente_id)
        .first()
    )

    if comprador is None:
        raise HTTPException(
            status_code=404,
            detail="Cliente comprador nao encontrado.",
        )

    # -----------------------------------------------------
    # BUSCAR VENDA
    # -----------------------------------------------------

    venda = (
        db.query(models.VendaUsado)
        .filter(models.VendaUsado.id == compra.venda_id)
        .first()
    )

    if venda is None:
        raise HTTPException(
            status_code=404,
            detail="Anuncio de produto usado nao encontrado.",
        )

    # -----------------------------------------------------
    # VERIFICAR DISPONIBILIDADE
    # -----------------------------------------------------

    if venda.status != "DISPONIVEL":
        raise HTTPException(
            status_code=400,
            detail="Este produto usado nao esta mais disponivel para venda.",
        )

    # -----------------------------------------------------
    # IMPEDIR COMPRA PELO PROPRIO VENDEDOR
    # -----------------------------------------------------

    if venda.vendedor_id == compra.cliente_id:
        raise HTTPException(
            status_code=400,
            detail="O vendedor nao pode comprar o proprio produto.",
        )

    # -----------------------------------------------------
    # VERIFICAR CASA DE DESTINO
    # -----------------------------------------------------

    espaco = (
        db.query(models.EspacoCliente)
        .filter(
            models.EspacoCliente.id == compra.espaco_id,
            models.EspacoCliente.cliente_id == compra.cliente_id,
        )
        .first()
    )

    if espaco is None:
        raise HTTPException(
            status_code=400,
            detail="Espaco invalido ou nao pertence ao comprador.",
        )

    # -----------------------------------------------------
    # VERIFICAR CAPACIDADE DA CASA
    # -----------------------------------------------------

    config = CASAS_CONFIG.get(espaco.tipo)

    if config is None:
        raise HTTPException(
            status_code=400,
            detail="Configuracao da casa nao encontrada.",
        )

    itens_na_casa = (
        db.query(models.ItemEspacoCliente)
        .filter(
            models.ItemEspacoCliente.espaco_id == espaco.id,
            models.ItemEspacoCliente.status != "EXCLUIDO",
        )
        .count()
    )

    if itens_na_casa >= config["capacidade"]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"A casa atingiu sua capacidade maxima de "
                f"{config['capacidade']} itens."
            ),
        )

    # -----------------------------------------------------
    # VERIFICAR SALDO
    # -----------------------------------------------------

    if comprador.saldo_cvt < venda.preco_venda:
        raise HTTPException(
            status_code=400,
            detail=(
                "Saldo CVT insuficiente. "
                f"Saldo disponivel: {comprador.saldo_cvt:.2f} CVT. "
                f"Valor da compra: {venda.preco_venda:.2f} CVT."
            ),
        )

    # -----------------------------------------------------
    # REGISTRAR COMPRA
    # -----------------------------------------------------

    data_venda = datetime.now()
    data_entrega_prevista = data_venda + timedelta(days=1)

    comprador.saldo_cvt -= venda.preco_venda

    venda.comprador_id = compra.cliente_id
    venda.espaco_comprador_id = compra.espaco_id
    venda.status = "EM_ENTREGA"
    venda.data_venda = data_venda.strftime("%Y-%m-%d %H:%M:%S")
    venda.data_entrega_prevista = data_entrega_prevista.strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    db.commit()
    db.refresh(venda)

    return {
        "mensagem": "Compra do produto usado realizada com sucesso.",
        "venda_id": venda.id,
        "produto_id": venda.produto_id,
        "preco_venda": venda.preco_venda,
        "comprador_id": venda.comprador_id,
        "espaco_comprador_id": venda.espaco_comprador_id,
        "status": venda.status,
        "data_entrega_prevista": venda.data_entrega_prevista,
        "saldo_cvt": comprador.saldo_cvt,
    }

# =========================================================
# ACEITAR OFERTA DE PRODUTO USADO
# =========================================================


@app.post("/produtos-usados/ofertas/aceitar")
def aceitar_oferta_produto_usado(
    oferta_id: int,
    vendedor_id: int,
    db: Session = Depends(get_db),
):

    oferta = (
        db.query(models.OfertaUsado)
        .filter(models.OfertaUsado.id == oferta_id)
        .first()
    )

    if oferta is None:
        raise HTTPException(
            status_code=404,
            detail="Oferta nao encontrada.",
        )

    if oferta.status != "PENDENTE":
        raise HTTPException(
            status_code=400,
            detail="Esta oferta nao esta mais pendente.",
        )

    venda = (
        db.query(models.VendaUsado)
        .filter(models.VendaUsado.id == oferta.venda_id)
        .first()
    )

    if venda is None:
        raise HTTPException(
            status_code=404,
            detail="Anuncio de produto usado nao encontrado.",
        )

    if venda.vendedor_id != vendedor_id:
        raise HTTPException(
            status_code=403,
            detail="Voce nao pode aceitar uma oferta desta venda.",
        )

    if venda.status != "DISPONIVEL":
        raise HTTPException(
            status_code=400,
            detail="Este produto usado nao esta mais disponivel para venda.",
        )

    comprador = (
        db.query(models.Cliente)
        .filter(models.Cliente.id == oferta.comprador_id)
        .first()
    )

    if comprador is None:
        raise HTTPException(
            status_code=404,
            detail="Cliente comprador nao encontrado.",
        )

    espaco = (
        db.query(models.EspacoCliente)
        .filter(
            models.EspacoCliente.id == oferta.espaco_id,
            models.EspacoCliente.cliente_id == oferta.comprador_id,
        )
        .first()
    )

    if espaco is None:
        raise HTTPException(
            status_code=400,
            detail="Espaco invalido ou nao pertence ao comprador.",
        )

    config = CASAS_CONFIG.get(espaco.tipo)

    if config is None:
        raise HTTPException(
            status_code=400,
            detail="Configuracao da casa nao encontrada.",
        )

    itens_na_casa = (
        db.query(models.ItemEspacoCliente)
        .filter(
            models.ItemEspacoCliente.espaco_id == espaco.id,
            models.ItemEspacoCliente.status != "EXCLUIDO",
        )
        .count()
    )

    if itens_na_casa >= config["capacidade"]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"A casa atingiu sua capacidade maxima de "
                f"{config['capacidade']} itens."
            ),
        )

    if comprador.saldo_cvt < oferta.valor_oferta:
        raise HTTPException(
            status_code=400,
            detail=(
                "Saldo CVT insuficiente. "
                f"Saldo disponivel: {comprador.saldo_cvt:.2f} CVT. "
                f"Valor da oferta: {oferta.valor_oferta:.2f} CVT."
            ),
        )

    data_venda = datetime.now()
    data_entrega_prevista = data_venda + timedelta(days=1)

    comprador.saldo_cvt -= oferta.valor_oferta

    venda.preco_venda = oferta.valor_oferta
    venda.comprador_id = oferta.comprador_id
    venda.espaco_comprador_id = oferta.espaco_id
    venda.status = "EM_ENTREGA"
    venda.data_venda = data_venda.strftime("%Y-%m-%d %H:%M:%S")
    venda.data_entrega_prevista = data_entrega_prevista.strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    oferta.status = "ACEITA"

    db.commit()
    db.refresh(venda)
    db.refresh(oferta)

    return {
        "mensagem": "Oferta aceita com sucesso.",
        "oferta_id": oferta.id,
        "venda_id": venda.id,
        "produto_id": venda.produto_id,
        "valor_oferta": oferta.valor_oferta,
        "comprador_id": venda.comprador_id,
        "espaco_comprador_id": venda.espaco_comprador_id,
        "status_oferta": oferta.status,
        "status_venda": venda.status,
        "data_entrega_prevista": venda.data_entrega_prevista,
        "saldo_cvt": comprador.saldo_cvt,
    }


# =========================================================

@app.post("/produtos-usados/ofertas/cancelar")
def cancelar_oferta_produto_usado(
    oferta_id: int,
    vendedor_id: int,
    db: Session = Depends(get_db),
):
    oferta = (
        db.query(models.OfertaUsado)
        .filter(models.OfertaUsado.id == oferta_id)
        .first()
    )

    if oferta is None:
        raise HTTPException(status_code=404, detail="Oferta nao encontrada.")

    if oferta.status != "PENDENTE":
        raise HTTPException(
            status_code=400,
            detail="Esta oferta nao esta mais pendente.",
        )

    venda = (
        db.query(models.VendaUsado)
        .filter(models.VendaUsado.id == oferta.venda_id)
        .first()
    )

    if venda is None:
        raise HTTPException(
            status_code=404,
            detail="Anuncio de produto usado nao encontrado.",
        )

    if venda.vendedor_id != vendedor_id:
        raise HTTPException(
            status_code=403,
            detail="Voce nao pode cancelar uma oferta desta venda.",
        )

    oferta.status = "CANCELADA"

    db.commit()
    db.refresh(oferta)

    return {
        "mensagem": "Oferta cancelada com sucesso.",
        "oferta_id": oferta.id,
        "status": oferta.status,
    }


# ATUALIZAR VENDAS DE PRODUTOS USADOS AUTOMATICAMENTE
# =========================================================


def atualizar_vendas_usados_automaticamente(db):

    agora = datetime.now()

    vendas = (
        db.query(models.VendaUsado)
        .filter(models.VendaUsado.status == "EM_ENTREGA")
        .all()
    )

    for venda in vendas:

        if not venda.data_venda:
            continue

        try:

            data_venda = datetime.strptime(
                venda.data_venda,
                "%Y-%m-%d %H:%M:%S",
            )

        except ValueError:

            continue

        tempo_decorrido = (agora - data_venda).total_seconds()

        # Produto usado possui prazo fixo de 1 dia
        tempo_total = 24 * 60 * 60

        if tempo_decorrido < tempo_total:
            continue

        vendedor = (
            db.query(models.Cliente)
            .filter(models.Cliente.id == venda.vendedor_id)
            .first()
        )

        comprador = (
            db.query(models.Cliente)
            .filter(models.Cliente.id == venda.comprador_id)
            .first()
        )

        item = (
            db.query(models.ItemEspacoCliente)
            .filter(models.ItemEspacoCliente.id == venda.item_espaco_id)
            .first()
        )

        if vendedor is None or comprador is None or item is None:
            continue

        valor_vendedor = round(venda.preco_venda * 0.60, 2)
        valor_valt_on = round(venda.preco_venda * 0.40, 2)

        vendedor.saldo_cvt += valor_vendedor

        venda.valor_vendedor = valor_vendedor
        venda.valor_valt_on = valor_valt_on
        venda.status = "ENTREGUE"

        item.status = "EXCLUIDO"
        item.preco_venda = None

        figurinha = models.ItemEspacoCliente(
            espaco_id=venda.espaco_comprador_id,
            produto_id=venda.produto_id,
            data_entrada=agora.strftime("%Y-%m-%d %H:%M:%S"),
        )

        db.add(figurinha)

        db.commit()

        print(
            f"Venda usada #{venda.id}: "
            f"EM_ENTREGA -> ENTREGUE"
        )

        print(
            f"Venda usada #{venda.id}: "
            f"Vendedor recebeu {valor_vendedor:.2f} CVT"
        )

        print(
            f"Venda usada #{venda.id}: "
            f"VALT-ON recebeu {valor_valt_on:.2f} CVT"
        )
