from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
import figurinha_exclusiva.models
import figurinha_exclusiva.services

from database import get_db


router = APIRouter()


# OFERTA DE FIGURINHA EXCLUSIVA
# =========================================================

@router.post("/figurinhas-exclusivas/ofertar")
def enviar_oferta_figurinha_exclusiva(
    dados: schemas.OfertaFigurinhaExclusivaCriar,
    db: Session = Depends(get_db),
):

    produto = (
        db.query(models.Produto)
        .filter(
            models.Produto.id == dados.produto_id,
            models.Produto.exclusiva == True,
        )
        .first()
    )

    if produto is None:
        raise HTTPException(
            status_code=404,
            detail="Figurinha exclusiva nao encontrada.",
        )

    figurinha = (
        db.query(
            figurinha_exclusiva.models.FigurinhaExclusiva
        )
        .filter(
            figurinha_exclusiva.models.FigurinhaExclusiva.produto_id
            == dados.produto_id,
            figurinha_exclusiva.models.FigurinhaExclusiva.status
            == "ATIVA",
        )
        .first()
    )

    if figurinha is None:
        raise HTTPException(
            status_code=400,
            detail="Esta figurinha exclusiva nao esta disponivel.",
        )

    comprador = (
        db.query(models.Cliente)
        .filter(models.Cliente.id == dados.comprador_id)
        .first()
    )

    if comprador is None:
        raise HTTPException(
            status_code=404,
            detail="Comprador nao encontrado.",
        )

    espaco = (
        db.query(models.EspacoCliente)
        .filter(
            models.EspacoCliente.id == dados.espaco_id,
            models.EspacoCliente.cliente_id == dados.comprador_id,
        )
        .first()
    )

    if espaco is None:
        raise HTTPException(
            status_code=400,
            detail="Espaco invalido ou nao pertence ao comprador.",
        )

    proprietario_id = (
        figurinha_exclusiva.services.obter_proprietario_exclusiva(
            db,
            figurinha,
        )
    )

    if proprietario_id is None:
        raise HTTPException(
            status_code=400,
            detail="Nao foi possivel identificar o proprietario.",
        )

    if proprietario_id == dados.comprador_id:
        raise HTTPException(
            status_code=400,
            detail="O proprietario nao pode fazer uma oferta para sua propria figurinha.",
        )

    if dados.valor_oferta <= 0:
        raise HTTPException(
            status_code=400,
            detail="O valor da oferta deve ser maior que zero.",
        )

    oferta = (
        figurinha_exclusiva.models.OfertaFigurinhaExclusiva(
            produto_id=dados.produto_id,
            proprietario_id=proprietario_id,
            comprador_id=dados.comprador_id,
            espaco_id=dados.espaco_id,
            valor_oferta=dados.valor_oferta,
            status="PENDENTE",
        )
    )

    db.add(oferta)
    db.commit()
    db.refresh(oferta)

    return {
        "mensagem": "Oferta enviada com sucesso.",
        "oferta_id": oferta.id,
        "produto_id": oferta.produto_id,
        "proprietario_id": oferta.proprietario_id,
        "comprador_id": oferta.comprador_id,
        "espaco_id": oferta.espaco_id,
        "valor_oferta": oferta.valor_oferta,
        "status": oferta.status,
    }


# =========================================================
# ACEITAR OFERTA DE FIGURINHA EXCLUSIVA
# =========================================================

@router.post("/figurinhas-exclusivas/ofertas/aceitar")
def aceitar_oferta_figurinha_exclusiva(
    oferta_id: int,
    proprietario_id: int,
    db: Session = Depends(get_db),
):

    oferta = (
        db.query(
            figurinha_exclusiva.models.OfertaFigurinhaExclusiva
        )
        .filter(
            figurinha_exclusiva.models.OfertaFigurinhaExclusiva.id
            == oferta_id
        )
        .first()
    )

    if oferta is None:
        raise HTTPException(
            status_code=404,
            detail="Oferta nao encontrada.",
        )

    if oferta.status != "PENDENTE":
        raise HTTPException(
            status_code=400,
            detail="Esta oferta nao esta mais pendente.",
        )

    figurinha = (
        db.query(
            figurinha_exclusiva.models.FigurinhaExclusiva
        )
        .filter(
            figurinha_exclusiva.models.FigurinhaExclusiva.produto_id
            == oferta.produto_id,
            figurinha_exclusiva.models.FigurinhaExclusiva.status
            == "ATIVA",
        )
        .first()
    )

    if figurinha is None:
        raise HTTPException(
            status_code=404,
            detail="Figurinha exclusiva nao encontrada.",
        )

    proprietario_atual = (
        figurinha_exclusiva.services.obter_proprietario_exclusiva(
            db,
            figurinha,
        )
    )

    if proprietario_atual != proprietario_id:
        raise HTTPException(
            status_code=403,
            detail="Voce nao e o proprietario atual desta figurinha.",
        )

    if oferta.proprietario_id != proprietario_id:
        raise HTTPException(
            status_code=400,
            detail="Esta oferta pertence a outro proprietario.",
        )

    comprador = (
        db.query(models.Cliente)
        .filter(models.Cliente.id == oferta.comprador_id)
        .first()
    )

    proprietario = (
        db.query(models.Cliente)
        .filter(models.Cliente.id == proprietario_id)
        .first()
    )

    if comprador is None or proprietario is None:
        raise HTTPException(
            status_code=404,
            detail="Cliente nao encontrado.",
        )

    espaco = (
        db.query(models.EspacoCliente)
        .filter(
            models.EspacoCliente.id == oferta.espaco_id,
            models.EspacoCliente.cliente_id == oferta.comprador_id,
        )
        .first()
    )

    if espaco is None:
        raise HTTPException(
            status_code=400,
            detail="Espaco invalido ou nao pertence ao comprador.",
        )

    config = CASAS_CONFIG.get(espaco.tipo)

    if config is None:
        raise HTTPException(
            status_code=400,
            detail="Configuracao da casa nao encontrada.",
        )

    itens_na_casa = (
        db.query(models.ItemEspacoCliente)
        .filter(
            models.ItemEspacoCliente.espaco_id == espaco.id,
            models.ItemEspacoCliente.status != "EXCLUIDO",
        )
        .count()
    )

    if itens_na_casa >= config["capacidade"]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"A casa atingiu sua capacidade maxima de "
                f"{config['capacidade']} itens."
            ),
        )

    if comprador.saldo_cvt < oferta.valor_oferta:
        raise HTTPException(
            status_code=400,
            detail=(
                "Saldo CVT insuficiente. "
                f"Saldo disponivel: {comprador.saldo_cvt:.2f} CVT. "
                f"Valor da oferta: {oferta.valor_oferta:.2f} CVT."
            ),
        )

    item_atual = (
        db.query(models.ItemEspacoCliente)
        .filter(
            models.ItemEspacoCliente.id == figurinha.item_espaco_id
        )
        .first()
    )

    if item_atual is None:
        raise HTTPException(
            status_code=400,
            detail="Item atual da figurinha nao encontrado.",
        )

    comprador.saldo_cvt -= oferta.valor_oferta
    proprietario.saldo_cvt += oferta.valor_oferta

    item_atual.status = "EXCLUIDO"
    item_atual.preco_venda = None

    novo_item = models.ItemEspacoCliente(
        espaco_id=oferta.espaco_id,
        produto_id=oferta.produto_id,
        data_entrada=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )

    db.add(novo_item)
    db.flush()

    figurinha.item_espaco_id = novo_item.id
    oferta.status = "ACEITA"

    db.commit()

    return {
        "mensagem": "Oferta aceita com sucesso.",
        "oferta_id": oferta.id,
        "produto_id": oferta.produto_id,
        "comprador_id": oferta.comprador_id,
        "proprietario_id": proprietario_id,
        "valor_oferta": oferta.valor_oferta,
        "status": oferta.status,
    }

# =========================================================
# RECUSAR OFERTA DE FIGURINHA EXCLUSIVA
# =========================================================

@router.post("/figurinhas-exclusivas/ofertas/recusar")
def recusar_oferta_figurinha_exclusiva(
    oferta_id: int,
    proprietario_id: int,
    db: Session = Depends(get_db),
):

    oferta = (
        db.query(
            figurinha_exclusiva.models.OfertaFigurinhaExclusiva
        )
        .filter(
            figurinha_exclusiva.models.OfertaFigurinhaExclusiva.id
            == oferta_id
        )
        .first()
    )

    if oferta is None:
        raise HTTPException(
            status_code=404,
            detail="Oferta nao encontrada.",
        )

    if oferta.status != "PENDENTE":
        raise HTTPException(
            status_code=400,
            detail="Esta oferta nao esta mais pendente.",
        )

    if oferta.proprietario_id != proprietario_id:
        raise HTTPException(
            status_code=403,
            detail="Esta oferta nao pertence a este proprietario.",
        )

    oferta.status = "RECUSADA"

    db.commit()

    return {
        "mensagem": "Oferta recusada com sucesso.",
        "oferta_id": oferta.id,
        "produto_id": oferta.produto_id,
        "status": oferta.status,
    }

# =========================================================
# LISTAR OFERTAS DE FIGURINHAS EXCLUSIVAS
# =========================================================

@router.get("/figurinhas-exclusivas/ofertas/{proprietario_id}")
def listar_ofertas_figurinhas_exclusivas(
    proprietario_id: int,
    db: Session = Depends(get_db),
):

    ofertas = (
        db.query(
            figurinha_exclusiva.models.OfertaFigurinhaExclusiva
        )
        .filter(
            figurinha_exclusiva.models.OfertaFigurinhaExclusiva.proprietario_id
            == proprietario_id,
            figurinha_exclusiva.models.OfertaFigurinhaExclusiva.status
            == "PENDENTE",
        )
        .all()
    )

    return [
        {
            "oferta_id": oferta.id,
            "produto_id": oferta.produto_id,
            "proprietario_id": oferta.proprietario_id,
            "comprador_id": oferta.comprador_id,
            "espaco_id": oferta.espaco_id,
            "valor_oferta": oferta.valor_oferta,
            "status": oferta.status,
        }
        for oferta in ofertas
    ]