from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pathlib import Path
from ftplib import FTP
import os

import models
import schemas
from database import get_db


router = APIRouter()


@router.get("/produtos", response_model=list[schemas.ProdutoResponse])
def listar_produtos(db: Session = Depends(get_db)):

    produtos = db.query(models.Produto).all()

    return produtos


@router.get("/produtos/{produto_id}", response_model=schemas.ProdutoResponse)
def buscar_produto(produto_id: int, db: Session = Depends(get_db)):

    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()

    if produto is None:

        raise HTTPException(status_code=404, detail="Produto não encontrado")

    return produto


@router.post("/produtos", response_model=schemas.ProdutoResponse)
def cadastrar_produto(produto: schemas.ProdutoCreate, db: Session = Depends(get_db)):

    if produto.exclusiva and produto.estoque > 1:
        raise HTTPException(
            status_code=400,
            detail="Figurinha exclusiva nao pode ter estoque maior que 1."
        )

    novo_produto = models.Produto(
        nome=produto.nome,
        descricao=produto.descricao,
        preco=produto.preco,
        categoria=produto.categoria,
        estoque=produto.estoque,
        prazo_entrega_dias=produto.prazo_entrega_dias,
        imagem=produto.imagem,
        exclusiva=produto.exclusiva,
    )

    db.add(novo_produto)
    db.commit()
    db.refresh(novo_produto)

    return novo_produto


@router.put("/produtos/{produto_id}", response_model=schemas.ProdutoResponse)
def alterar_produto(
    produto_id: int, dados: schemas.ProdutoCreate, db: Session = Depends(get_db)
):

    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()

    if produto is None:

        raise HTTPException(status_code=404, detail="Produto não encontrado")

    if dados.exclusiva and dados.estoque > 1:
        raise HTTPException(
            status_code=400,
            detail="Figurinha exclusiva nao pode ter estoque maior que 1."
        )

    produto.nome = dados.nome
    produto.descricao = dados.descricao
    produto.preco = dados.preco
    produto.categoria = dados.categoria
    produto.estoque = dados.estoque
    produto.prazo_entrega_dias = dados.prazo_entrega_dias
    produto.imagem = dados.imagem
    produto.exclusiva = dados.exclusiva

    db.commit()
    db.refresh(produto)

    return produto


@router.delete("/produtos/{produto_id}")
def excluir_produto(produto_id: int, db: Session = Depends(get_db)):

    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()

    if produto is None:

        raise HTTPException(status_code=404, detail="Produto não encontrado")

    db.delete(produto)
    db.commit()

    return {"mensagem": "Produto excluído com sucesso"}


@router.post("/upload-imagem")
async def upload_imagem(file: UploadFile = File(...)):

    extensoes_permitidas = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

    extensao = Path(file.filename or "").suffix.lower()

    if extensao not in extensoes_permitidas:
        raise HTTPException(
            status_code=400,
            detail="Formato de imagem não permitido."
        )

    nome_arquivo = Path(file.filename or "imagem").name

    try:
        conteudo = await file.read()

        ftp = FTP()
        ftp.connect(os.getenv("HOSTINGER_FTP_HOST"), 21, timeout=15)
        ftp.login(
            os.getenv("HOSTINGER_FTP_USER"),
            os.getenv("HOSTINGER_FTP_PASSWORD"),
        )
        ftp.cwd(os.getenv("HOSTINGER_FTP_PATH"))

        from io import BytesIO
        ftp.storbinary(f"STOR {nome_arquivo}", BytesIO(conteudo))
        ftp.quit()

        url_publica = (
            f"https://www.valt-on.com/"
            f"produtos/{nome_arquivo}"
        )

        return {
            "mensagem": "Imagem enviada com sucesso!",
            "arquivo": nome_arquivo,
            "url": url_publica,
        }

    except Exception as erro:
        raise HTTPException(
            status_code=500, detail=f"Erro ao enviar imagem: {str(erro)}"
        )
