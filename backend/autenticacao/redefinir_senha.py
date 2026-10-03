from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import models
import schemas
from database import get_db

router = APIRouter()

@router.post("/redefinir-senha")
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






