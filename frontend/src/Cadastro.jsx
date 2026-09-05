import { useState } from "react";

const API_URL = "https://valt-on.onrender.com";

function Cadastro({ onCadastroSucesso, onVoltar }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const cadastrar = async (e) => {
    e.preventDefault();

    setMensagem("");
    setErro("");

    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setErro("Preencha todos os campos.");
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
    <div className="pagina-cadastro">
      <h2>📝 Cadastro</h2>

      <p>Crie sua conta na VALT-ON</p>

      <form onSubmit={cadastrar}>
        <div>
          <label>Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Digite seu nome"
          />
        </div>

        <div>
          <label>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu e-mail"
          />
        </div>

        <div>
          <label>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite sua senha"
          />
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
