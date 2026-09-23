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
  categoria,
  setCategoria,
}) {
  const [mostrarCategorias, setMostrarCategorias] = React.useState(false);

  const categorias = [
    "Todos",
    "Celulares",
    "Informática",
    "Casa",
    "Moda",
    "Esportes",
    "Pet",
    "Infantil",
    "Enfeites",
    "Bebidas",
    "Alimentos",
    "Escritório",
    "Ferramentas",
  ];

  return (
    <>
      <button
        onClick={() => setMostrarCategorias(!mostrarCategorias)}
        style={{
          padding: "7px 10px",
          fontSize: "12px",
          backgroundColor: "#000",
          color: "#fff",
          border: "1px solid #000",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        📂 Categorias
      </button>

      {mostrarCategorias && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "0",
            zIndex: 1000,
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(130px, 1fr))",
            gap: "6px",
            minWidth: "280px",
          }}
        >
          {categorias.map((nomeCategoria) => (
            <button
              key={nomeCategoria}
              onClick={() => {
                setCategoria(nomeCategoria);
                setMostrarCategorias(false);
              }}
              style={{
                padding: "8px 10px",
                fontSize: "14px",
                textAlign: "left",
                backgroundColor:
                  categoria === nomeCategoria ? "#000" : "#f5f5f5",
                color:
                  categoria === nomeCategoria ? "#fff" : "#222",
                border: "1px solid #ddd",
                borderRadius: "7px",
                cursor: "pointer",
              }}
            >
              {nomeCategoria}
            </button>
          ))}
        </div>
      )}

      {/* LOGIN / MINHA CONTA */}

      {usuario ? (
        <button
          onClick={() => setMostrarConta(true)}
          style={{
            padding: "7px 10px",
            fontSize: "12px",
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
            padding: "7px 10px",
            fontSize: "12px",
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
          padding: "7px 10px",
          fontSize: "12px",
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
            padding: "7px 10px",
            fontSize: "12px",
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
          padding: "7px 10px",
          fontSize: "12px",
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
          padding: "7px 10px",
          fontSize: "12px",
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
          padding: "7px 10px",
          fontSize: "12px",
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