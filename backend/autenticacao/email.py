import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def enviar_email(
    destinatario: str, assunto: str, mensagem: str, html_mensagem: str = None
):

    try:

        servidor = os.getenv("SMTP_HOST")
        porta = int(os.getenv("SMTP_PORT", "465"))
        usuario = os.getenv("SMTP_USER")
        senha = os.getenv("SMTP_PASSWORD")

        corpo_html = (
            html_mensagem
            if html_mensagem is not None
            else mensagem.replace("\n", "<br>")
        )

        msg = MIMEMultipart("alternative")
        msg["From"] = f"Valt-on <{usuario}>"
        msg["To"] = destinatario
        msg["Subject"] = assunto

        msg.attach(MIMEText(mensagem, "plain", "utf-8"))
        msg.attach(MIMEText(corpo_html, "html", "utf-8"))

        with smtplib.SMTP_SSL(servidor, porta) as conexao:
            conexao.login(usuario, senha)
            conexao.sendmail(usuario, destinatario, msg.as_string())

        print(f"E-mail enviado com sucesso para {destinatario} via Hostinger")

        return True

    except Exception as erro:

        print(f"Erro ao enviar e-mail para {destinatario}: {erro}")

        return False


# =========================================================
# REENVIO TEMPORARIO DE CONFIRMACAO DE E-MAIL
# =========================================================


