from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import models
import schemas
from database import get_db
from .email import enviar_email

router = APIRouter()

@router.post("/solicitar-recuperacao-senha")
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




