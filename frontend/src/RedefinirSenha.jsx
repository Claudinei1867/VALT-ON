import { useState } from "react";

const API_URL = "https://valt-on.onrender.com";

function RedefinirSenha({ onVoltar }) {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const token = new URLSearchParams(
    window.location.search
  ).get("token");

  const redefinirSenha = async (event) => {
    event.preventDefault();

    setMensagem("");
    setErro("");

    if (!token) {
      setErro("Link de recuperação inválido.");
      return;
    }

    if (!novaSenha || !confirmarSenha) {
      setErro("Preencha os dois campos de senha.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch(
        `${API_URL}/redefinir-senha`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            nova_senha: novaSenha,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail || "Não foi possível redefinir a senha."
        );
      }

      setMensagem(
        dados.mensagem || "Senha redefinida com sucesso."
      );

      setNovaSenha("");
      setConfirmarSenha("");
    } catch (error) {
      console.error(
        "ERRO AO REDEFINIR SENHA:",
        error
      );

      setErro(
        error.message ||
        "Não foi possível redefinir a senha."
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "450px",
        margin: "60px auto",
        padding: "30px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        backgroundColor: "#fff",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: "25px",
        }}
      >
        Redefinir senha
      </h2>

      {mensagem ? (
        <div>
          <p
            style={{
              color: "green",
              textAlign: "center",
            }}
          >
            {mensagem}
          </p>

          <button
            onClick={onVoltar}
            style={{
              width: "100%",
              padding: "12px",
              cursor: "pointer",
            }}
          >
            Voltar para o login
          </button>
        </div>
      ) : (
        <form onSubmit={redefinirSenha}>
          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <label>
              Nova senha
            </label>

            <input
              type="password"
              value={novaSenha}
              onChange={(event) =>
                setNovaSenha(event.target.value)
              }
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <label>
              Confirmar nova senha
            </label>

            <input
              type="password"
              value={confirmarSenha}
              onChange={(event) =>
                setConfirmarSenha(event.target.value)
              }
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {erro && (
            <p
              style={{
                color: "red",
                marginBottom: "15px",
              }}
            >
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            style={{
              width: "100%",
              padding: "12px",
              cursor: carregando
                ? "not-allowed"
                : "pointer",
            }}
          >
            {carregando
              ? "Redefinindo..."
              : "Redefinir minha senha"}
          </button>

          <button
            type="button"
            onClick={onVoltar}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "10px",
              cursor: "pointer",
            }}
          >
            Voltar para o login
          </button>
        </form>
      )}
    </div>
  );
}

export default RedefinirSenha;
