from datetime import datetime, timedelta
import secrets
import html

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from autenticacao.email import enviar_email


router = APIRouter()


@router.post("/clientes", response_model=schemas.ClienteResponse)
def cadastrar_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):

    # -----------------------------------------------------
    # VERIFICAR E-MAIL
    # -----------------------------------------------------

    cliente_existente = (
        db.query(models.Cliente).filter(models.Cliente.email == cliente.email).first()
    )

    if cliente_existente:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")

    if cliente.indicador_id is not None:
        if cliente.indicador_id <= 0:
            raise HTTPException(status_code=400, detail="Número do indicador inválido.")

        indicador = (
            db.query(models.Cliente)
            .filter(
                models.Cliente.id == cliente.indicador_id,
                models.Cliente.email_confirmado == 1,
            )
            .first()
        )

        if indicador is None:
            raise HTTPException(
                status_code=400,
                detail="Cliente indicador não encontrado ou e-mail ainda não confirmado.",
            )

    # -----------------------------------------------------
    # CRIAR CLIENTE
    # -----------------------------------------------------

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
        db.add(
            models.Indicacao(
                indicador_id=cliente.indicador_id,
                indicado_id=novo_cliente.id,
                creditada=0,
            )
        )
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
    # ENVIAR E-MAIL DE CONFIRMAÇÃO
    # -----------------------------------------------------

    link_confirmacao = (
        "https://valt-on.onrender.com/confirmar-email?token=" + token_confirmacao
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

    url_segura = html.escape(link_confirmacao, quote=True)

    html_confirmacao = (
        f"<p>Olá, {html.escape(novo_cliente.nome)}!</p>"
        "<p>Sua conta no VALT-ON foi criada. Confirme seu e-mail:</p>"
        f'<p><a href="{url_segura}" style="display:inline-block;padding:12px 20px;background:#f3d77e;color:#27313b;font-weight:bold;text-decoration:none;border-radius:6px">Confirmar meu e-mail</a></p>'
        f'<p>Ou copie este endereço: <a href="{url_segura}">{url_segura}</a></p>'
        "<p>O link é válido por 24 horas. Se não criou a conta, ignore esta mensagem.</p>"
    )

    enviar_email(
        novo_cliente.email,
        "Confirme seu e-mail - VALT-ON",
        mensagem_confirmacao,
        html_confirmacao,
    )

    return novo_cliente

@router.get("/clientes/{cliente_id}/extrato-cvt")
def extrato_cvt(cliente_id: int, db: Session = Depends(get_db)):
    movimentos = (
        db.query(models.CVTMovimento)
        .filter(models.CVTMovimento.cliente_id == cliente_id)
        .order_by(models.CVTMovimento.id.desc())
        .limit(100)
        .all()
    )

    return [
        {
            "id": movimento.id,
            "tipo": movimento.tipo,
            "motivo": movimento.motivo,
            "quantidade": movimento.quantidade,
            "saldo_apos": movimento.saldo_apos,
            "criado_em": movimento.criado_em,
        }
        for movimento in movimentos
    ]
