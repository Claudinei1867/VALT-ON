from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from autenticacao.email import enviar_email

router = APIRouter()


@router.post("/sugestoes")
def criar_sugestao(
    dados: schemas.SugestaoCriar,
    db: Session = Depends(get_db),
):
    sugestao = models.Sugestao(
        cliente_id=dados.cliente_id,
        nome=dados.nome,
        email=dados.email,
        tipo=dados.tipo,
        mensagem=dados.mensagem,
        status="Pendente",
        data_criacao=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )

    db.add(sugestao)
    db.commit()
    db.refresh(sugestao)

    return {
        "mensagem": "Sugestão enviada com sucesso!",
        "id": sugestao.id,
        "status": sugestao.status,
        "resposta_admin": sugestao.resposta_admin,
    }


@router.put("/sugestoes/{sugestao_id}/status")
def atualizar_status_sugestao(
    sugestao_id: int,
    status: str,
    admin_id: int,
    resposta_admin: str | None = None,
    db: Session = Depends(get_db),
):
    if admin_id != 0:
        administrador = (
            db.query(models.Administrador)
            .filter(
                models.Administrador.id == admin_id,
                models.Administrador.ativo == 1,
            )
            .first()
        )

        if administrador is None:
            raise HTTPException(
                status_code=403,
                detail="Acesso permitido somente para administradores.",
            )

    status_permitidos = [
        "Pendente",
        "Em análise",
        "Respondida",
        "Encerrada",
    ]

    if status not in status_permitidos:
        raise HTTPException(
            status_code=400,
            detail="Status inválido.",
        )

    sugestao = (
        db.query(models.Sugestao)
        .filter(models.Sugestao.id == sugestao_id)
        .first()
    )

    if sugestao is None:
        raise HTTPException(
            status_code=404,
            detail="Sugestão não encontrada.",
        )

    sugestao.status = status

    if resposta_admin is not None:
        sugestao.resposta_admin = resposta_admin

    db.commit()
    db.refresh(sugestao)

    if status == "Respondida" and sugestao.resposta_admin:
        assunto = "Resposta à sua sugestão - VALT-ON"

        mensagem_email = (
            f"Olá, {sugestao.nome}!\n\n"
            "Recebemos sua sugestão enviada ao VALT-ON.\n\n"
            f"Sua mensagem:\n{sugestao.mensagem}\n\n"
            "Resposta do administrador:\n"
            f"{sugestao.resposta_admin}\n\n"
            "Atenciosamente,\n"
            "Equipe VALT-ON"
        )

        enviar_email(
            sugestao.email,
            assunto,
            mensagem_email,
        )

    return {
        "mensagem": "Status da sugestão atualizado com sucesso!",
        "id": sugestao.id,
        "status": sugestao.status,
        "resposta_admin": sugestao.resposta_admin,
    }


@router.get("/sugestoes")
def listar_sugestoes(
    admin_id: int,
    db: Session = Depends(get_db),
):
    if admin_id != 0:
        administrador = (
            db.query(models.Administrador)
            .filter(
                models.Administrador.id == admin_id,
                models.Administrador.ativo == 1,
            )
            .first()
        )

        if administrador is None:
            raise HTTPException(
                status_code=403,
                detail="Acesso permitido somente para administradores.",
            )

    sugestoes = (
        db.query(models.Sugestao)
        .order_by(models.Sugestao.id.desc())
        .all()
    )

    return [
        {
            "id": sugestao.id,
            "cliente_id": sugestao.cliente_id,
            "nome": sugestao.nome,
            "email": sugestao.email,
            "tipo": sugestao.tipo,
            "mensagem": sugestao.mensagem,
            "status": sugestao.status,
            "resposta_admin": sugestao.resposta_admin,
            "data_criacao": sugestao.data_criacao,
        }
        for sugestao in sugestoes
    ]

