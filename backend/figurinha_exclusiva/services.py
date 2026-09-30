from sqlalchemy.orm import Session

import models
from .models import FigurinhaExclusiva


def registrar_entrega_exclusiva(
    db: Session,
    produto_id: int,
    item_espaco_id: int,
) -> None:
    produto = (
        db.query(models.Produto)
        .filter(models.Produto.id == produto_id)
        .first()
    )

    if not produto or not produto.exclusiva:
        return

    existente = (
        db.query(FigurinhaExclusiva)
        .filter(FigurinhaExclusiva.produto_id == produto_id)
        .first()
    )

    if existente:
        return

    registro = FigurinhaExclusiva(
        produto_id=produto_id,
        item_espaco_id=item_espaco_id,
        valor_original=produto.preco,
        status="ATIVA",
    )

    db.add(registro)
    