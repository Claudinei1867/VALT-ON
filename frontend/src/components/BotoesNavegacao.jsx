import React from "react";

export default function BotoesNavegacao({
  usuario,
  setMostrarConta,
  setMostrarLogin,
  setMostrarCadastro,
  setMostrarAdmin,
  mostrarProdutosUsados,
  setMostrarProdutosUsados,
  carregarProdutosUsados,
  setMostrarSugestoes,
  mostrarCarrinho,
  setMostrarCarrinho,
  quantidadeCarrinho,
}) {
  return (
    <>
      {/* LOGIN / MINHA CONTA */}

      {usuario ? (
        <button
          onClick={() => setMostrarConta(true)}
          style={{
            padding: "10px 14px",
            fontSize: "16px",
            backgroundColor: "#000",
            color: "#fff",
            border: "1px solid #000",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          👤 {usuario.nome}
        </button>
      ) : (
        <button
          onClick={() => setMostrarLogin(true)}
          style={{
            padding: "10px 14px",
            fontSize: "16px",
            backgroundColor: "#000",
            color: "#fff",
            border: "1px solid #000",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          👤 Entrar
        </button>
      )}

      <button
        onClick={() => setMostrarCadastro(true)}
        style={{
          padding: "10px 14px",
          fontSize: "16px",
          backgroundColor: "#000",
          color: "#fff",
          border: "1px solid #000",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        📋 Cadastro
      </button>

      {/* ADMIN */}

      {usuario?.admin && (
        <button
          onClick={() => setMostrarAdmin(true)}
          style={{
            padding: "10px 14px",
            fontSize: "16px",
            backgroundColor: "#000",
            color: "#fff",
            border: "1px solid #000",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ⚙️ Administrador
        </button>
      )}

      {/* PRODUTOS USADOS */}

      <button
        onClick={() => {
          const novoEstado = !mostrarProdutosUsados;

          setMostrarProdutosUsados(novoEstado);

          if (novoEstado) {
            carregarProdutosUsados();
          }
        }}
        style={{
          padding: "10px 14px",
          fontSize: "16px",
          backgroundColor: "#000",
          color: "#fff",
          border: "1px solid #000",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        🛒 Produtos Usados
      </button>

      {/* SUGESTÕES */}

      <button
        onClick={() => setMostrarSugestoes(true)}
        style={{
          padding: "10px 14px",
          fontSize: "16px",
          backgroundColor: "#000",
          color: "#fff",
          border: "1px solid #000",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        💡 Sugestões
      </button>

      {/* CARRINHO */}

      <button
        onClick={() => setMostrarCarrinho(!mostrarCarrinho)}
        style={{
          padding: "10px 14px",
          fontSize: "16px",
          backgroundColor: "#000",
          color: "#fff",
          border: "1px solid #000",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        🛒 Carrinho ({quantidadeCarrinho})
      </button>
    </>
  );
}