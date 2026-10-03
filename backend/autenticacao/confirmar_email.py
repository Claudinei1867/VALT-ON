@app.get("/confirmar-email")
def confirmar_email(token: str, db: Session = Depends(get_db)):
    cliente = (
        db.query(models.Cliente)
        .filter(models.Cliente.token_confirmacao_email == token)
        .first()
    )

    if cliente is None:
        raise HTTPException(status_code=400, detail="Token de confirmação inválido.")

    if cliente.email_confirmado == 1:
        return {"mensagem": "E-mail já confirmado."}

    if cliente.token_confirmacao_expira_em is None:
        raise HTTPException(status_code=400, detail="Token de confirmação inválido.")

    try:
        expiracao = datetime.fromisoformat(cliente.token_confirmacao_expira_em)
    except ValueError:
        raise HTTPException(status_code=400, detail="Token de confirmação inválido.")

    if datetime.now() > expiracao:
        raise HTTPException(status_code=400, detail="Token de confirmação expirado.")

    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente.id).with_for_update().one()
    if cliente.email_confirmado == 1:
        return {"mensagem": "E-mail já confirmado."}
    indicacao = db.query(models.Indicacao).filter(models.Indicacao.indicado_id == cliente.id, models.Indicacao.creditada == 0).with_for_update().first()
    if indicacao is not None:
        indicador = db.query(models.Cliente).filter(models.Cliente.id == indicacao.indicador_id).with_for_update().first()
        if indicador is not None:
            indicador.saldo_cvt = (indicador.saldo_cvt or 0) + 300.0
            indicacao.creditada = 1

    cliente.email_confirmado = 1
    cliente.token_confirmacao_email = None
    cliente.token_confirmacao_expira_em = None

    db.commit()

    return {"mensagem": "E-mail confirmado com sucesso!"}


# =========================================================
# LOGIN
# =========================================================


