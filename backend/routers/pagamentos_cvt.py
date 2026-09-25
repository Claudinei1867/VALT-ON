from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime
import os
import secrets
import mercadopago

import models
import schemas
from dependencies import get_db

router = APIRouter()

MERCADOPAGO_ACCESS_TOKEN = os.getenv("MERCADOPAGO_ACCESS_TOKEN")
MERCADOPAGO_PUBLIC_KEY = os.getenv("MERCADOPAGO_PUBLIC_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL")
BACKEND_URL = os.getenv("BACKEND_URL")

PACOTES_CVT = {
    1000: {"quantidade_cvt": 1000.0, "valor_reais": 5.00},
    2500: {"quantidade_cvt": 2500.0, "valor_reais": 12.00},
    5000: {"quantidade_cvt": 5000.0, "valor_reais": 20.00},
    10000: {"quantidade_cvt": 10000.0, "valor_reais": 35.00},
}


@router.post("/pagamentos/cvt/criar")
def criar_pagamento_cvt(
    compra: schemas.CompraCVT,
    db: Session = Depends(get_db)
):
    cliente = (
        db.query(models.Cliente)
        .filter(models.Cliente.id == compra.cliente_id)
        .first()
    )

    if not cliente:
        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado"
        )

    pacote = PACOTES_CVT.get(compra.quantidade_cvt)

    if not pacote:
        raise HTTPException(
            status_code=400,
            detail="Pacote de CVT inválido"
        )

    referencia = f"CVT-{cliente.id}-{secrets.token_hex(8)}"

    pagamento = models.PagamentoCVT(
        cliente_id=cliente.id,
        quantidade_cvt=pacote["quantidade_cvt"],
        valor_reais=pacote["valor_reais"],
        status="PENDENTE",
        referencia=referencia,
        data_criacao=datetime.now().isoformat()
    )

    db.add(pagamento)
    db.commit()
    db.refresh(pagamento)

    sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)

    preference_data = {
        "items": [
            {
                "title": "Pacote CVT " + str(int(pacote["quantidade_cvt"])),
                "quantity": 1,
                "unit_price": pacote["valor_reais"],
                "currency_id": "BRL"
            }
        ],
        "statement_descriptor": "VALT-ON",
        "external_reference": referencia,
        "back_urls": {
            "success": f"{FRONTEND_URL}/minha-conta",
            "failure": f"{FRONTEND_URL}/minha-conta",
            "pending": f"{FRONTEND_URL}/minha-conta"
        },
        "auto_return": "approved",
        "notification_url": f"{BACKEND_URL}/pagamentos/cvt/webhook"
    }

    preference_response = sdk.preference().create(preference_data)

    if preference_response.get("status") not in (200, 201):
        pagamento.status = "ERRO"
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Não foi possível criar o pagamento"
        )

    preference = preference_response["response"]

    return {
        "pagamento_id": pagamento.id,
        "referencia": referencia,
        "init_point": preference.get("init_point"),
        "sandbox_init_point": preference.get("sandbox_init_point")
    }


@router.post("/pagamentos/cvt/webhook")
async def pagamento_cvt_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        dados = await request.json()
    except Exception:
        dados = {}

    payment_id = None

    if dados.get("data") and dados["data"].get("id"):
        payment_id = str(dados["data"]["id"])

    if not payment_id:
        return {"status": "ok"}

    sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)

    resposta = sdk.payment().get(payment_id)

    if resposta.get("status") != 200:
        return {"status": "ok"}

    pagamento_mp = resposta.get("response", {})

    status_mp = pagamento_mp.get("status")
    referencia = pagamento_mp.get("external_reference")

    if not referencia:
        return {"status": "ok"}

    pagamento = (
        db.query(models.PagamentoCVT)
        .filter(models.PagamentoCVT.referencia == referencia)
        .first()
    )

    if not pagamento:
        return {"status": "ok"}

    if pagamento.status == "APROVADO":
        return {"status": "ok"}

    if status_mp == "approved":
        cliente = (
            db.query(models.Cliente)
            .filter(models.Cliente.id == pagamento.cliente_id)
            .first()
        )

        if not cliente:
            return {"status": "ok"}

        pagamento.status = "APROVADO"
        pagamento.mp_payment_id = str(payment_id)

        cliente.saldo_cvt += pagamento.quantidade_cvt

        db.commit()

    elif status_mp in ("rejected", "cancelled"):
        pagamento.status = "RECUSADO"
        pagamento.mp_payment_id = str(payment_id)

        db.commit()

    elif status_mp == "pending":
        pagamento.status = "PENDENTE"
        pagamento.mp_payment_id = str(payment_id)

        db.commit()

    return {"status": "ok"}
