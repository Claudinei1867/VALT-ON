import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from database import get_db
from .email import enviar_email

router = APIRouter()
REENVIO_ULTIMO = {}



class ReenvioConfirmacaoRequest(BaseModel):
    email: str


@router.post("/reenviar-confirmacao-email")
def reenviar_confirmacao_email(
    dados: ReenvioConfirmacaoRequest,
    db: Session = Depends(get_db)
):
    email = dados.email.strip().lower()

    cliente = (
        db.query(models.Cliente)
        .filter(models.Cliente.email == email)
        .first()
    )

    resposta_neutra = {
        "mensagem": "Se houver uma conta pendente com esse e-mail, enviaremos um novo link. Confira também a pasta de spam."
    }

    if not cliente or cliente.email_confirmado == 1:
        return resposta_neutra


    agora = datetime.now()
    ultimo = REENVIO_ULTIMO.get(email)
    if ultimo and agora - ultimo < timedelta(minutes=2):
        return resposta_neutra

    REENVIO_ULTIMO[email] = agora



    token = secrets.token_urlsafe(32)
    expiracao = agora + timedelta(hours=24)

    cliente.token_confirmacao_email = token
    cliente.token_confirmacao_expira_em = expiracao.isoformat()

    db.commit()

    link = f"https://valt-on.onrender.com/confirmar-email?token={token}"

    mensagem = (
        "Olá!\n\n"
        "Seu novo link de confirmação de e-mail do VALT-ON está disponível.\n\n"
        f"Clique no link para confirmar seu e-mail:\n{link}\n\n"
        "Este link é válido por 24 horas.\n\n"
        "VALT-ON"
    )

    html_mensagem = f"""
<html>
<body>
<p>Olá!</p>
<p>Seu novo link de confirmação de e-mail do VALT-ON está disponível.</p>
<p>
<a href="{link}">Clique aqui para confirmar seu e-mail</a>
</p>
<p>Este link é válido por 24 horas.</p>
<p>VALT-ON</p>
</body>
</html>
"""

    enviado = enviar_email(
        cliente.email,
        "Confirmação de e-mail - VALT-ON",
        mensagem,
        html_mensagem
    )

    if not enviado:
        raise HTTPException(
            status_code=500,
            detail="Não foi possível enviar o e-mail de confirmação."
        )

    return {
        "mensagem": "Um novo link de confirmação foi enviado para seu e-mail."
    }

