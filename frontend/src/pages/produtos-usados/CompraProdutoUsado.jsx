export default function CompraProdutoUsado({
  usuario,
  espacos,
  produtoUsadoSelecionado,
  setProdutoUsadoSelecionado,
  espacoUsadoSelecionado,
  setEspacoUsadoSelecionado,
  API_URL,
  carregarProdutosUsados,
}) {
  if (!produtoUsadoSelecionado) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px",
      }}
    >
      <h2>Escolha a casa de destino</h2>

      <p>
        Produto:{" "}
        <strong>
          {produtoUsadoSelecionado.nome}
        </strong>
      </p>

      <p>
        Preço:{" "}
        <strong>
          {Number(
            produtoUsadoSelecionado.preco_venda
          ).toFixed(2)}{" "}
          CVT
        </strong>
      </p>

      {espacos.length === 0 ? (
        <p>
          Você ainda não possui nenhuma casa disponível.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxWidth: "500px",
          }}
        >
          {espacos.map((espaco) => (
            <button
              key={espaco.id}
              onClick={() =>
                setEspacoUsadoSelecionado(
                  String(espaco.id)
                )
              }
              style={{
                padding: "12px",
                fontSize: "16px",
                textAlign: "left",
                backgroundColor:
                  String(espaco.id) ===
                    String(espacoUsadoSelecionado)
                    ? "#d0ffd0"
                    : "#f5f5f5",
                border:
                  String(espaco.id) ===
                    String(espacoUsadoSelecionado)
                    ? "2px solid #008000"
                    : "1px solid #ccc",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              🏠 {espaco.nome}
            </button>
          ))}
        </div>
      )}

      {espacoUsadoSelecionado && (
        <button
          onClick={async () => {
            try {
              const resposta = await fetch(
                `${API_URL}/produtos-usados/comprar`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    cliente_id: usuario.id,
                    venda_id:
                      produtoUsadoSelecionado.venda_id,
                    espaco_id: Number(
                      espacoUsadoSelecionado
                    ),
                  }),
                }
              );

              const dados = await resposta.json();

              if (!resposta.ok) {
                throw new Error(
                  dados.detail ||
                    "Erro ao comprar produto usado."
                );
              }

              alert(
                "Produto usado comprado com sucesso!"
              );

              setProdutoUsadoSelecionado(null);
              setEspacoUsadoSelecionado("");

              await carregarProdutosUsados();
            } catch (error) {
              console.error(
                "ERRO AO COMPRAR PRODUTO USADO:",
                error
              );

              alert(
                error.message ||
                  "Não foi possível concluir a compra."
              );
            }
          }}
          style={{
            marginTop: "15px",
            padding: "12px 18px",
            fontSize: "16px",
            backgroundColor: "#000",
            color: "#fff",
            border: "1px solid #000",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ✅ Confirmar compra
        </button>
      )}
    </div>
  );
}