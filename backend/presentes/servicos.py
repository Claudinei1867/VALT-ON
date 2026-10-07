from datetime import datetime

from sqlalchemy.orm import Session

import models
import figurinha_exclusiva.models


def buscar_espaco_destinatario(
    db: Session,
    destinatario_id: int
):
    destinatario = (
        db.query(models.Cliente)
        .filter(models.Cliente.id == destinatario_id)
        .first()
    )

    if destinatario is None:
        raise ValueError("Destinatario nao encontrado.")

    espaco = (
        db.query(models.EspacoCliente)
        .filter(models.EspacoCliente.cliente_id == destinatario_id)
        .first()
    )

    if espaco is None:
        raise ValueError("Destinatario nao possui espaco cadastrado.")

    return espaco


def preparar_presente(
    db: Session,
    destinatario_id: int
):
    espaco = buscar_espaco_destinatario(
        db,
        destinatario_id
    )

    return {
        "destinatario_id": destinatario_id,
        "espaco_id": espaco.id
    }


def listar_presentes_espaco(
    db: Session,
    espaco_id: int,
    destinatario_id: int
):
    pedidos = (
        db.query(models.Pedido)
        .filter(
            models.Pedido.espaco_id == espaco_id,
            models.Pedido.destinatario_id == destinatario_id,
            models.Pedido.eh_presente == True,
            models.Pedido.status == "Entregue",
        )
        .order_by(models.Pedido.id.desc())
        .all()
    )

    resultado = []

    for pedido in pedidos:
        remetente = (
            db.query(models.Cliente)
            .filter(models.Cliente.id == pedido.cliente_id)
            .first()
        )

        presente = {
            "pedido_id": pedido.id,
            "presente_aberto": bool(pedido.presente_aberto),
            "embalagem_presente": pedido.embalagem_presente,
            "remetente_id": remetente.id if remetente else None,
            "remetente_nome": remetente.nome if remetente else None,
            "mensagem_presente": None,
            "itens": [],
        }

        if pedido.presente_aberto:
            presente["mensagem_presente"] = pedido.mensagem_presente

            itens_pedido = (
                db.query(models.ItemPedido)
                .filter(models.ItemPedido.pedido_id == pedido.id)
                .all()
            )

            for item in itens_pedido:
                produto = (
                    db.query(models.Produto)
                    .filter(models.Produto.id == item.produto_id)
                    .first()
                )

                if produto is None:
                    continue

                for _ in range(item.quantidade):
                    presente["itens"].append(
                        {
                            "produto_id": produto.id,
                            "nome": produto.nome,
                            "imagem": produto.imagem,
                            "quantidade": 1,
                            "preco_unitario": item.preco_unitario,
                        }
                    )

        resultado.append(presente)

    return resultado


def abrir_presente(
    db: Session,
    pedido_id: int,
    destinatario_id: int
):
    pedido = (
        db.query(models.Pedido)
        .filter(models.Pedido.id == pedido_id)
        .first()
    )

    if pedido is None:
        raise ValueError("Presente nao encontrado.")

    if not pedido.eh_presente:
        raise ValueError("Este pedido nao e um presente.")

    if pedido.destinatario_id != destinatario_id:
        raise ValueError("Este presente nao pertence a este destinatario.")

    if pedido.status != "Entregue":
        raise ValueError("O presente ainda nao foi entregue.")

    if pedido.espaco_id is None:
        raise ValueError("O presente nao possui casa de destino.")

    if pedido.presente_aberto:
        raise ValueError("Este presente ja foi aberto.")

    remetente = (
        db.query(models.Cliente)
        .filter(models.Cliente.id == pedido.cliente_id)
        .first()
    )

    itens_pedido = (
        db.query(models.ItemPedido)
        .filter(models.ItemPedido.pedido_id == pedido.id)
        .all()
    )

    itens_resultado = []

    for item in itens_pedido:
        produto = (
            db.query(models.Produto)
            .filter(models.Produto.id == item.produto_id)
            .first()
        )

        if produto is None:
            continue

        for _ in range(item.quantidade):
            figurinha = models.ItemEspacoCliente(
                espaco_id=pedido.espaco_id,
                produto_id=item.produto_id,
                data_entrada=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            )

            db.add(figurinha)
            db.flush()

            if produto.exclusiva:
                existente = (
                    db.query(
                        figurinha_exclusiva.models.FigurinhaExclusiva
                    )
                    .filter(
                        figurinha_exclusiva.models.FigurinhaExclusiva.produto_id
                        == item.produto_id
                    )
                    .first()
                )

                if not existente:
                    registro_exclusivo = (
                        figurinha_exclusiva.models.FigurinhaExclusiva(
                            produto_id=item.produto_id,
                            item_espaco_id=figurinha.id,
                            valor_original=item.preco_unitario,
                            status="ATIVA",
                        )
                    )
                    db.add(registro_exclusivo)

            itens_resultado.append(
                {
                    "produto_id": produto.id,
                    "nome": produto.nome,
                    "imagem": produto.imagem,
                    "quantidade": 1,
                    "preco_unitario": item.preco_unitario,
                }
            )

    pedido.presente_aberto = True

    db.commit()
    db.refresh(pedido)

    return {
        "pedido_id": pedido.id,
        "presente_aberto": True,
        "remetente_id": (
            remetente.id
            if remetente
            else None
        ),
        "remetente_nome": (
            remetente.nome
            if remetente
            else None
        ),
        "mensagem_presente": pedido.mensagem_presente,
        "embalagem_presente": pedido.embalagem_presente,
        "itens": itens_resultado,
    }
