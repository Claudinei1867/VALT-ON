from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter()


@router.post("/presenca/ping")
def registrar_presenca(dados: schemas.PresencaPing, db: Session = Depends(get_db)):
    sessao = dados.sessao

    if (
        not isinstance(sessao, str)
        or len(sessao) != 36
        or any(c not in "0123456789abcdef-" for c in sessao.lower())
    ):
        raise HTTPException(status_code=422, detail="Sessão inválida.")

    agora = datetime.now()
    limite = (agora - timedelta(minutes=2)).isoformat()

    db.query(models.PresencaVisitante).filter(
        models.PresencaVisitante.ultima_atividade < limite
    ).delete(synchronize_session=False)

    existente = (
        db.query(models.PresencaVisitante)
        .filter(models.PresencaVisitante.sessao == sessao)
        .first()
    )

    if existente:
        existente.ultima_atividade = agora.isoformat()
    else:
        db.add(
            models.PresencaVisitante(
                sessao=sessao,
                ultima_atividade=agora.isoformat(),
            )
        )

    db.commit()

    return {"ok": True}

