from datetime import datetime
import models

def registrar_movimento_cvt(
    db,
    cliente_id: int,
    tipo: str,
    motivo: str,
    quantidade: float,
    saldo_apos: float
):
    movimento = models.CVTMovimento(
        cliente_id=cliente_id,
        tipo=tipo,
        motivo=motivo,
        quantidade=quantidade,
        saldo_apos=saldo_apos,
        criado_em=datetime.now().isoformat()
    )
    db.add(movimento)
