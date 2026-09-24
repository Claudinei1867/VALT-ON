import { useEffect, useState } from "react";

const API_URL = "https://valt-on.onrender.com";

export default function ProdutosAdmin({
  onVoltar,
  onEditarProduto,
}) {
  const [produtos, setProdutos] = useState([]);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [filtroEstoque,setFiltroEstoque]=useState("todos");

  const obterUrlImagem = (url) => {
    if (!url) {
      return "";
    }

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const carregarProdutos = () => {
    fetch(`${API_URL}/produtos`)
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error("Erro ao carregar produtos");
        }

        return resposta.json();
      })
      .then((dados) => {
        setProdutos(dados);
      })
      .catch((erro) => {
        console.error("ERRO AO CARREGAR PRODUTOS:", erro);
      });
  };

  const excluirProduto = async (id) => {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este produto?"
    );

    if (!confirmar) {
      return;
    }

    try {
      const resposta = await fetch(
        `${API_URL}/produtos/${id}`,
        {
          method: "DELETE",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail || "Erro ao excluir produto."
        );
      }

      setProdutos((produtosAtuais) =>
        produtosAtuais.filter((produto) => produto.id !== id)
      );
    } catch (erro) {
      console.error("ERRO AO EXCLUIR PRODUTO:", erro);
      alert(erro.message || "Não foi possível excluir o produto.");
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  const produtosFiltrados = produtos.filter((produto) => {
    const texto = buscaProduto.toLowerCase().trim();

    if(filtroEstoque==="baixo"&&!(Number(produto.estoque)>0&&Number(produto.estoque)<=5))return false;
    if(filtroEstoque==="esgotado"&&Number(produto.estoque)>0)return false;
    if (!texto) {return true;}

    return (
      (produto.nome || "").toLowerCase().includes(texto) ||
      (produto.descricao || "").toLowerCase().includes(texto) ||
      (produto.categoria || "").toLowerCase().includes(texto)
    );
  });

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <button
        type="button"
        onClick={onVoltar}
        style={{
          marginBottom: "20px",
          padding: "10px 18px",
          borderRadius: "8px",
          border: "none",
          background: "#222",
          color: "#fff",
          cursor: "pointer",
          fontSize: "15px",
          fontWeight: "bold",
        }}
      >
        ← Voltar ao painel
      </button>

      <h1>📦 Produtos cadastrados</h1>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="🔎 Buscar produto..."
          value={buscaProduto}
          onChange={(evento) =>
            setBuscaProduto(evento.target.value)
          }
          style={{
            width: "100%",
            maxWidth: "600px",
            padding: "12px",
            fontSize: "16px",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div className="valt-admin-filter"><label>Estoque <select value={filtroEstoque} onChange={e=>setFiltroEstoque(e.target.value)}><option value="todos">Todos</option><option value="baixo">Baixo (1–5)</option><option value="esgotado">Esgotados</option></select></label><button onClick={carregarProdutos}>Atualizar produtos</button></div>
      {produtos.length === 0 ? (
        <p>Nenhum produto cadastrado.</p>
      ) : produtosFiltrados.length === 0 ? (
        <p>Nenhum produto corresponde à pesquisa.</p>
      ) : (
        produtosFiltrados.map((produto) => (
          <div
            key={produto.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "15px",
            }}
          >
            {produto.imagem ? (
              <img
                src={obterUrlImagem(produto.imagem)}
                alt={produto.nome}
                style={{
                  width: "150px",
                  height: "120px",
                  objectFit: "contain",
                  display: "block",
                  marginBottom: "10px",
                }}
              />
            ) : (
              <div
                style={{
                  width: "150px",
                  height: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f5f5f5",
                  fontSize: "40px",
                  marginBottom: "10px",
                }}
              >
                🛍️
              </div>
            )}

            <h3>{produto.nome}</h3>

            <p>{produto.descricao}</p>

            <strong>
              CVT {Number(produto.preco).toFixed(2)}
            </strong>

            <p>
              Categoria: {produto.categoria}
              <br />
              Estoque: {produto.estoque}
              <br />
              ID: {produto.id}
            </p>

            <button
              type="button"
              onClick={() => onEditarProduto(produto)}
            >
              ✏️ Editar
            </button>

            <button
              type="button"
              onClick={() => excluirProduto(produto.id)}
              style={{
                marginLeft: "10px",
              }}
            >
              🗑️ Excluir
            </button>
          </div>
        ))
      )}
    </div>
  );
}