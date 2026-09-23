import { useState } from "react";

const API_URL = "https://valt-on.onrender.com";

function Cadastro({ onCadastroSucesso, onVoltar }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [aceitouSimulador, setAceitouSimulador] = useState(false);

  const cadastrar = async (e) => {
    e.preventDefault();

    setMensagem("");
    setErro("");

    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (!aceitouSimulador) {
      setErro(
        "Você precisa ler e confirmar que o VALT-ON é um simulador de vendas on-line e não realiza vendas reais."
      );
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch(`${API_URL}/clientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          senha,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.detail || "Não foi possível realizar o cadastro.");
        return;
      }

      setMensagem("Cadastro realizado com sucesso!");

      setNome("");
      setEmail("");
      setSenha("");
      setAceitouSimulador(false);

      if (onCadastroSucesso) {
        onCadastroSucesso(dados);
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div
      className="pagina-cadastro"
      style={{
        width: "100%",
        maxWidth: "500px",
        margin: "30px auto",
        padding: "25px",
        boxSizing: "border-box",
      }}
    >
      <h2
        style={{
          fontSize: "28px",
          marginBottom: "10px",
          textAlign: "center",
        }}
      >
        📝 Cadastro
      </h2>

      <p
        style={{
          fontSize: "18px",
          textAlign: "center",
          marginBottom: "25px",
        }}
      >
        Crie sua conta na VALT-ON
      </p>

      <form
        onSubmit={cadastrar}
        style={{
          width: "100%",
        }}
      >
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <label>Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Digite seu nome"
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "17px",
              boxSizing: "border-box",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginTop: "6px",
            }}
          />
        </div>

        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <label>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu e-mail"
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "17px",
              boxSizing: "border-box",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginTop: "6px",
            }}
          />
        </div>

        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <label>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite sua senha"
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "17px",
              boxSizing: "border-box",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginTop: "6px",
            }}
          />
        </div>

        <div
          style={{
            marginTop: "10px",
            marginBottom: "20px",
            padding: "15px",
            borderRadius: "8px",
            backgroundColor: "#f0f0f0",
            border: "1px solid #ccc",
          }}
        >
          <p
            style={{
              margin: "0 0 12px 0",
              fontSize: "15px",
              lineHeight: "1.5",
              textAlign: "left",
            }}
          >
            O VALT-ON é um simulador de vendas on-line para fins de demonstração e
            aprendizado. Não são realizadas vendas reais nem transações financeiras
            reais.
          </p>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontSize: "15px",
              lineHeight: "1.4",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={aceitouSimulador}
              onChange={(e) =>
                setAceitouSimulador(e.target.checked)
              }
              style={{
                width: "20px",
                height: "20px",
                flexShrink: 0,
                marginTop: "1px",
              }}
            />

            <span>
              Li e estou ciente de que o VALT-ON é um simulador de vendas on-line e
              não realiza vendas reais.
            </span>
          </label>
        </div>

        {mensagem && (
          <p>{mensagem}</p>
        )}

        {erro && (
          <p>{erro}</p>
        )}

        <button type="submit" disabled={carregando}>
          {carregando ? "Cadastrando..." : "Criar conta"}
        </button>
      </form>

      <button type="button" onClick={onVoltar}>
        Voltar
      </button>
    </div>
  );
}

export default Cadastro;
