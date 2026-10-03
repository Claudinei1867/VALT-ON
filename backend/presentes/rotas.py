from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from .servicos import preparar_presente

router = APIRouter(
    prefix="/presentes",
    tags=["Presentes"]
)


@router.get("/destinatario/{destinatario_id}")
def verificar_destinatario(
    destinatario_id: int,
    db: Session = Depends(get_db)
):
    try:
        return preparar_presente(db, destinatario_id)
    except ValueError as erro:
        raise HTTPException(
            status_code=404,
            detail=str(erro)
        )