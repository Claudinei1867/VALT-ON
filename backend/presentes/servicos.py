from sqlalchemy.orm import Session

from models import Cliente, EspacoCliente


def buscar_espaco_destinatario(
    db: Session,
    destinatario_id: int
):
    destinatario = (
        db.query(Cliente)
        .filter(Cliente.id == destinatario_id)
        .first()
    )

    if destinatario is None:
        raise ValueError("Destinatario nao encontrado.")

    espaco = (
        db.query(EspacoCliente)
        .filter(EspacoCliente.cliente_id == destinatario_id)
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