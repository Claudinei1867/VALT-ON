import { useEffect, useState } from "react";

const API_URL = "https://valt-on.onrender.com";

function Pedidos({ cliente, voltar }) {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!cliente || !cliente.id) {
      setErro("Cliente não identificado.");
      setCarregando(false);
      return;
    }

    fetch(`${API_URL}/clientes/${cliente.id}/pedidos`)
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error("Não foi possível carregar os pedidos.");
        }

        return resposta.json();
      })
      .then((dados) => {
        console.log("PEDIDOS RECEBIDOS:", dados);
        setPedidos(dados);
        setErro("");
        setCarregando(false);
      })
      .catch((error) => {
        console.error("ERRO AO CARREGAR PEDIDOS:", error);
        setErro(error.message);
        setCarregando(false);
      });
  }, [cliente]);

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <button
        onClick={voltar}
        style={{
          padding: "10px 20px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        ← Voltar para a loja
      </button>

      <h1>📦 Meus Pedidos</h1>

      <p>
        Cliente: <strong>{cliente?.nome}</strong>
      </p>

      {carregando && <p>Carregando seus pedidos...</p>}

      {erro && (
        <p style={{ color: "red" }}>
          ❌ {erro}
        </p>
      )}

      {!carregando && !erro && pedidos.length === 0 && (
        <div>
          <p>Você ainda não possui pedidos.</p>
        </div>
      )}

      {!carregando &&
        !erro &&
        pedidos.map((pedido) => (
          <div
            key={pedido.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px",
              marginBottom: "20px",
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h2>📦 Pedido #{pedido.id}</h2>

            <p>
              <strong>Status:</strong>{" "}
              {pedido.status}
            </p>

            <p>
              <strong>Total:</strong> CVT{" "}
              {Number(pedido.total).toFixed(2)}
            </p>

            <h3>Itens do pedido</h3>

            {pedido.itens && pedido.itens.length > 0 ? (
              pedido.itens.map((item, indice) => (
                <div
                  key={indice}
                  style={{
                    borderTop: "1px solid #eee",
                    padding: "10px 0",
                  }}
                >
                  <strong>
                    {item.produto_nome}
                  </strong>

                  <p>
                    Quantidade: {item.quantidade}
                  </p>

                  <p>
                    Preço unitário: CVT{" "}
                    {Number(
                      item.preco_unitario
                    ).toFixed(2)}
                  </p>

                  <p>
                    Subtotal: CVT{" "}
                    {(
                      Number(item.preco_unitario) *
                      item.quantidade
                    ).toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p>Nenhum item encontrado.</p>
            )}
          </div>
        ))}
    </div>
  );
}

export default Pedidos;