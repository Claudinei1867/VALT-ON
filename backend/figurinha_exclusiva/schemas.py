from pydantic import BaseModel


class OfertaFigurinhaExclusivaCriar(BaseModel):
    produto_id: int
    comprador_id: int
    espaco_id: int
    valor_oferta: float
