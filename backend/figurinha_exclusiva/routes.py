from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db, SessionLocal
import models
from .models import FigurinhaExclusiva, RendimentoExclusiva
router=APIRouter(prefix="/figurinhas-exclusivas",tags=["figurinhas-exclusivas"])
class OfertaDireta(BaseModel):
    comprador_id:int
    item_espaco_id:int
    valor_oferta:float
    espaco_id:int
def _sincronizar_exclusivas(db: Session):
    """Garante que exclusivas antigas/revendidas apontem para o dono atual."""
    produtos = db.query(models.Produto).filter(models.Produto.exclusiva == True).all()
    alterou = False
    for produto in produtos:
        item_atual = (
            db.query(models.ItemEspacoCliente)
            .join(models.EspacoCliente, models.EspacoCliente.id == models.ItemEspacoCliente.espaco_id)
            .filter(
                models.ItemEspacoCliente.produto_id == produto.id,
                models.ItemEspacoCliente.status != "EXCLUIDO",
            )
            .order_by(models.ItemEspacoCliente.id.desc())
            .first()
        )
        # Pedidos marcados manualmente como Entregue no admin antigo nao criavam
        # ItemEspacoCliente. Recupera a figurinha a partir do ultimo pedido entregue.
        if not item_atual:
            pedido_entregue = (
                db.query(models.Pedido)
                .join(models.ItemPedido, models.ItemPedido.pedido_id == models.Pedido.id)
                .filter(
                    models.ItemPedido.produto_id == produto.id,
                    models.Pedido.status == "Entregue",
                    models.Pedido.espaco_id.isnot(None),
                )
                .order_by(models.Pedido.id.desc())
                .first()
            )
            if pedido_entregue:
                espaco = (
                    db.query(models.EspacoCliente)
                    .filter(models.EspacoCliente.id == pedido_entregue.espaco_id)
                    .first()
                )
                if espaco:
                    item_atual = models.ItemEspacoCliente(
                        espaco_id=espaco.id,
                        produto_id=produto.id,
                        data_entrada=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    )
                    db.add(item_atual)
                    db.flush()
                    alterou = True

        if not item_atual:
            continue

        reg = db.query(FigurinhaExclusiva).filter(FigurinhaExclusiva.produto_id == produto.id).first()
        if not reg:
            reg = FigurinhaExclusiva(
                produto_id=produto.id,
                item_espaco_id=item_atual.id,
                valor_original=produto.preco,
                status="ATIVA",
            )
            db.add(reg)
            alterou = True
        elif reg.item_espaco_id != item_atual.id or reg.status != "ATIVA":
            reg.item_espaco_id = item_atual.id
            reg.status = "ATIVA"
            alterou = True
    if alterou:
        db.commit()

@router.get("/mercado")
def mercado(db:Session=Depends(get_db)):
    _sincronizar_exclusivas(db)
    rows=(db.query(FigurinhaExclusiva,models.ItemEspacoCliente,models.EspacoCliente,models.Produto,models.Cliente).join(models.ItemEspacoCliente,models.ItemEspacoCliente.id==FigurinhaExclusiva.item_espaco_id).join(models.EspacoCliente,models.EspacoCliente.id==models.ItemEspacoCliente.espaco_id).join(models.Produto,models.Produto.id==FigurinhaExclusiva.produto_id).join(models.Cliente,models.Cliente.id==models.EspacoCliente.cliente_id).filter(FigurinhaExclusiva.status=="ATIVA",models.ItemEspacoCliente.status!="EXCLUIDO").all())
    return [{"item_id":i.id,"produto_id":p.id,"nome":p.nome,"imagem":p.imagem,"valor_original":e.valor_original,"dono_id":c.id,"dono_nome":c.nome} for e,i,esp,p,c in rows]

@router.get("/produto/{produto_id}")
def exclusiva_por_produto(produto_id:int, db:Session=Depends(get_db)):
    _sincronizar_exclusivas(db)
    row=(db.query(FigurinhaExclusiva,models.ItemEspacoCliente,models.EspacoCliente,models.Produto,models.Cliente)
         .join(models.ItemEspacoCliente,models.ItemEspacoCliente.id==FigurinhaExclusiva.item_espaco_id)
         .join(models.EspacoCliente,models.EspacoCliente.id==models.ItemEspacoCliente.espaco_id)
         .join(models.Produto,models.Produto.id==FigurinhaExclusiva.produto_id)
         .join(models.Cliente,models.Cliente.id==models.EspacoCliente.cliente_id)
         .filter(FigurinhaExclusiva.produto_id==produto_id,FigurinhaExclusiva.status=="ATIVA",models.ItemEspacoCliente.status!="EXCLUIDO").first())
    if not row: raise HTTPException(404,"Proprietario atual ainda nao encontrado para esta exclusiva.")
    e,i,esp,p,c=row
    return {"item_id":i.id,"produto_id":p.id,"nome":p.nome,"imagem":p.imagem,"valor_original":e.valor_original,"dono_id":c.id,"dono_nome":c.nome}

@router.post("/ofertar")
def ofertar(d:OfertaDireta,db:Session=Depends(get_db)):
    if d.valor_oferta<=0: raise HTTPException(400,"Oferta deve ser maior que zero.")
    reg=db.query(FigurinhaExclusiva).filter(FigurinhaExclusiva.item_espaco_id==d.item_espaco_id,FigurinhaExclusiva.status=="ATIVA").first()
    item=db.query(models.ItemEspacoCliente).filter(models.ItemEspacoCliente.id==d.item_espaco_id,models.ItemEspacoCliente.status!="EXCLUIDO").first()
    if not reg or not item: raise HTTPException(404,"Figurinha exclusiva nao encontrada.")
    casa=db.query(models.EspacoCliente).filter(models.EspacoCliente.id==item.espaco_id).first()
    if not casa or casa.cliente_id==d.comprador_id: raise HTTPException(400,"Nao e permitido ofertar na propria figurinha.")
    destino=db.query(models.EspacoCliente).filter(models.EspacoCliente.id==d.espaco_id,models.EspacoCliente.cliente_id==d.comprador_id).first()
    if not destino: raise HTTPException(400,"Casa de destino invalida.")
    venda=db.query(models.VendaUsado).filter(models.VendaUsado.item_espaco_id==item.id,models.VendaUsado.status=="DISPONIVEL").first()
    if not venda:
        venda=models.VendaUsado(item_espaco_id=item.id,vendedor_id=casa.cliente_id,produto_id=item.produto_id,preco_venda=d.valor_oferta,status="DISPONIVEL");db.add(venda);db.flush()
    oferta=models.OfertaUsado(venda_id=venda.id,comprador_id=d.comprador_id,espaco_id=d.espaco_id,valor_oferta=d.valor_oferta,status="PENDENTE",data_oferta=datetime.now().isoformat())
    db.add(oferta);db.commit();return {"mensagem":"Oferta enviada.","oferta_id":oferta.id}
@router.get("/ofertas/{dono_id}")
def ofertas(dono_id:int,db:Session=Depends(get_db)):
    rows=(db.query(models.OfertaUsado,models.VendaUsado,models.Produto,models.Cliente).join(models.VendaUsado,models.VendaUsado.id==models.OfertaUsado.venda_id).join(models.Produto,models.Produto.id==models.VendaUsado.produto_id).join(models.Cliente,models.Cliente.id==models.OfertaUsado.comprador_id).join(FigurinhaExclusiva,FigurinhaExclusiva.item_espaco_id==models.VendaUsado.item_espaco_id).filter(models.VendaUsado.vendedor_id==dono_id,models.OfertaUsado.status=="PENDENTE").all())
    return [{"oferta_id":o.id,"item_id":v.item_espaco_id,"produto_id":p.id,"produto_nome":p.nome,"comprador_nome":c.nome,"valor_oferta":o.valor_oferta} for o,v,p,c in rows]
@router.post("/ofertas/{oferta_id}/responder")
def responder(oferta_id:int,dono_id:int,aceitar:bool,db:Session=Depends(get_db)):
    o=db.query(models.OfertaUsado).filter(models.OfertaUsado.id==oferta_id,models.OfertaUsado.status=="PENDENTE").first()
    if not o: raise HTTPException(404,"Oferta nao encontrada.")
    v=db.query(models.VendaUsado).filter(models.VendaUsado.id==o.venda_id).first()
    if not v or v.vendedor_id!=dono_id: raise HTTPException(403,"Sem permissao.")
    if not aceitar: o.status="RECUSADA";db.commit();return {"status":"RECUSADA"}
    comprador=db.query(models.Cliente).filter(models.Cliente.id==o.comprador_id).first()
    if not comprador or comprador.saldo_cvt<o.valor_oferta: raise HTTPException(400,"Comprador sem saldo suficiente.")
    comprador.saldo_cvt-=o.valor_oferta;v.preco_venda=o.valor_oferta;v.comprador_id=o.comprador_id;v.espaco_comprador_id=o.espaco_id;v.status="EM_ENTREGA";v.data_venda=datetime.now().strftime("%Y-%m-%d %H:%M:%S");v.data_entrega_prevista=(datetime.now()+timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S");o.status="ACEITA";db.commit();return {"status":"ACEITA"}
def pagar_rendimento_semanal():
    db=SessionLocal()
    try:
        agora=datetime.now();semana=(agora-timedelta(days=agora.weekday())).date().isoformat()
        for reg in db.query(FigurinhaExclusiva).filter(FigurinhaExclusiva.status=="ATIVA").all():
            item=db.query(models.ItemEspacoCliente).filter(models.ItemEspacoCliente.id==reg.item_espaco_id,models.ItemEspacoCliente.status!="EXCLUIDO").first()
            if not item: continue
            casa=db.query(models.EspacoCliente).filter(models.EspacoCliente.id==item.espaco_id).first()
            if not casa or db.query(RendimentoExclusiva).filter(RendimentoExclusiva.figurinha_exclusiva_id==reg.id,RendimentoExclusiva.semana==semana).first(): continue
            cliente=db.query(models.Cliente).filter(models.Cliente.id==casa.cliente_id).first()
            if not cliente: continue
            valor=round(reg.valor_original*0.03,2);cliente.saldo_cvt+=valor;db.add(RendimentoExclusiva(figurinha_exclusiva_id=reg.id,cliente_id=cliente.id,semana=semana,valor=valor))
        db.commit()
    finally: db.close()

from sqlalchemy.orm import Session




# router jÃ¡ definido acima


# OFERTA DE FIGURINHA EXCLUSIVA
# =========================================================

@router.post("/ofertar")
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

@router.post("/ofertas/aceitar")
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

@router.post("/ofertas/recusar")
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

@router.get("/ofertas/{proprietario_id}")
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
