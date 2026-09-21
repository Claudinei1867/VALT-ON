import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://valt-on.onrender.com";

export default function PedidosAdmin({ onVoltar }) {
  const [pedidos, setPedidos] = useState([]);
  const [buscaPedido, setBuscaPedido] = useState("");

  const carregarPedidos = async () => {
    try {
      const resposta = await fetch(`${API_URL}/pedidos`);

      if (!resposta.ok) {
        throw new Error("Erro ao carregar pedidos");
      }

      const dados = await resposta.json();
      setPedidos(dados);
    } catch (erro) {
      console.error("ERRO AO CARREGAR PEDIDOS:", erro);
    }
  };

  const alterarStatusPedido = async (pedidoId, novoStatus) => {
    try {
      const resposta = await fetch(
        `${API_URL}/pedidos/${pedidoId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: novoStatus,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail || "Erro ao alterar status do pedido."
        );
      }

      setPedidos((pedidosAtuais) =>
        pedidosAtuais.map((pedido) =>
          pedido.pedido_id === pedidoId
            ? { ...pedido, status: dados.status }
            : pedido
        )
      );
    } catch (erro) {
      console.error("ERRO AO ALTERAR STATUS DO PEDIDO:", erro);
      alert(erro.message || "Não foi possível alterar o status do pedido.");
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const texto = buscaPedido.toLowerCase().trim();

    if (!texto) return true;

    return (
      String(pedido.pedido_id).toLowerCase().includes(texto) ||
      String(pedido.cliente_nome || "").toLowerCase().includes(texto) ||
      String(pedido.cliente_email || "").toLowerCase().includes(texto) ||
      String(pedido.status || "").toLowerCase().includes(texto)
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

      <h1>📦 Pedidos</h1>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="🔎 Buscar pedido..."
          value={buscaPedido}
          onChange={(evento) => setBuscaPedido(evento.target.value)}
          style={{
            width: "100%",
            maxWidth: "600px",
            padding: "12px",
            fontSize: "16px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {pedidos.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : pedidosFiltrados.length === 0 ? (
        <p>Nenhum pedido corresponde à pesquisa.</p>
      ) : (
        pedidosFiltrados.map((pedido) => (
          <div
            key={pedido.pedido_id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "15px",
            }}
          >
            <h3>Pedido #{pedido.pedido_id}</h3>

            <p>
              <strong>Cliente:</strong> {pedido.cliente_nome}
              <br />
              <strong>E-mail:</strong>{" "}
              {pedido.cliente_email || "Não informado"}
              <br />
              <strong>Status:</strong> {pedido.status}
              <br />

              <label>
                <strong>Alterar status:</strong>{" "}
                <select
                  value={pedido.status}
                  onChange={(evento) =>
                    alterarStatusPedido(
                      pedido.pedido_id,
                      evento.target.value
                    )
                  }
                  style={{
                    padding: "8px",
                    marginTop: "8px",
                    cursor: "pointer",
                  }}
                >
                  <option value="Pago">Pago</option>
                  <option value="Preparando">Preparando</option>
                  <option value="Enviado">Enviado</option>
                  <option value="A caminho">A caminho</option>
                  <option value="Entregue">Entregue</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </label>
              <br />
              <strong>Total:</strong> CVT{" "}
              {Number(pedido.total).toFixed(2)}
              <br />
              <strong>Prazo de entrega:</strong>{" "}
              {pedido.prazo_entrega} dias
            </p>
          </div>
        ))
      )}
    </div>
  );
}