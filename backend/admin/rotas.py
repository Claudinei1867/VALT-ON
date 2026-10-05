from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

import models
from database import get_db

router = APIRouter()


@router.get("/admin/estatisticas")
def estatisticas_admin(db: Session = Depends(get_db)):
    quantidade_clientes = db.query(models.Cliente).count()

    quantidade_produtos = db.query(models.Produto).count()

    limite = (datetime.now() - timedelta(minutes=2)).isoformat()
    visitantes_ativos = (
        db.query(models.PresencaVisitante)
        .filter(models.PresencaVisitante.ultima_atividade >= limite)
        .count()
    )

    inicio_30_dias = (
        datetime.now() - timedelta(days=30)
    ).strftime("%Y-%m-%d %H:%M:%S")

    pedidos_validos = ~models.Pedido.status.in_(
        ["Pendente", "Cancelado", "Cancelada", "Estornado", "Reembolsado"]
    )

    def unidades_compradas(desde=None):
        consulta = (
            db.query(func.coalesce(func.sum(models.ItemPedido.quantidade), 0))
            .join(
                models.Pedido,
                models.ItemPedido.pedido_id == models.Pedido.id,
            )
            .filter(pedidos_validos)
        )

        if desde is not None:
            consulta = consulta.filter(models.Pedido.data_pedido >= desde)

        return int(consulta.scalar() or 0)

    def usados_vendidos(desde=None):
        consulta = db.query(models.VendaUsado).filter(
            models.VendaUsado.comprador_id.isnot(None),
            models.VendaUsado.status.in_(
                ["EM_ENTREGA", "ENTREGUE", "VENDIDO"]
            ),
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
