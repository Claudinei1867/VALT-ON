import { useState } from "react";

const API_URL = "https://valt-on.onrender.com";

function Login({ onLogin, onVoltar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const fazerLogin = async (evento) => {
    evento.preventDefault();

    setErro("");

    if (!email || !senha) {
      setErro("Digite seu e-mail e sua senha.");
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          senha: senha,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail || "E-mail ou senha inválidos."
        );
      }

      console.log("LOGIN REALIZADO:", dados);

      // Envia os dados do cliente para o App.jsx
      if (onLogin) {
        onLogin(dados.cliente);
      }
    } catch (error) {
      console.error("ERRO NO LOGIN:", error);

      setErro(
        error.message ||
          "Não foi possível realizar o login."
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          🛍️ VALT-ON
        </h1>

        <h2
          style={{
            textAlign: "center",
            marginBottom: "25px",
          }}
        >
          Entrar
        </h2>

        {erro && (
          <div
            style={{
              background: "#ffe5e5",
              color: "#c00",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "15px",
              textAlign: "center",
            }}
          >
            {erro}
          </div>
        )}

        <form onSubmit={fazerLogin}>
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              E-mail
            </label>

            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(evento) =>
                setEmail(evento.target.value)
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                fontSize: "16px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Senha
            </label>

            <input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(evento) =>
                setSenha(evento.target.value)
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                fontSize: "16px",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "8px",
              cursor: carregando
                ? "not-allowed"
                : "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            {carregando
              ? "Entrando..."
              : "🔐 Entrar"}
          </button>
        </form>

        <button
          type="button"
          onClick={onVoltar}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "15px",
          }}
        >
          ← Voltar para a loja
        </button>
      </div>
    </div>
  );
}

export default Login;
