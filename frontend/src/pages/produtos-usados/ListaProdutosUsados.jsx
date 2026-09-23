export default function ListaProdutosUsados({
  usuario,
  produtosUsados,
  obterUrlImagem,
  setProdutoUsadoSelecionado,
  setEspacoUsadoSelecionado,
  setProdutoUsadoOfertaSelecionado,
  setValorOfertaUsado,
}) {
  if (produtosUsados.length === 0) {
    return (
      <p>
        Nenhum produto usado está disponível para venda no momento.
      </p>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "20px",
      }}
    >
      {produtosUsados.map((produto) => (
        <div
          key={produto.venda_id}
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "15px",
          }}
        >
          <h2>{produto.nome}</h2>

          {produto.imagem && (
            <img
              src={obterUrlImagem(produto.imagem)}
              alt={produto.nome}
              style={{
                width: "100%",
                height: "180px",
                objectFit: "contain",
              }}
            />
          )}

          <p>
            Preço original:{" "}
            {Number(produto.preco_original).toFixed(2)} CVT
          </p>

          <p>
            <strong>
              Preço usado:{" "}
              {Number(produto.preco_venda).toFixed(2)} CVT
            </strong>
          </p>

          <p>
            Vendedor:{" "}
            {produto.vendedor_nome}
          </p>

          <button
            onClick={() => {
              if (!usuario) {
                alert(
                  "Você precisa estar logado para comprar um produto usado."
                );
                return;
              }

              setProdutoUsadoSelecionado(produto);
              setEspacoUsadoSelecionado("");
            }}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "10px",
              fontSize: "16px",
              backgroundColor: "#000",
              color: "#fff",
              border: "1px solid #000",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            🛒 Comprar produto
          </button>

          <button
            onClick={() => {
              if (!usuario) {
                alert(
                  "Você precisa estar logado para fazer uma oferta."
                );
                return;
              }

              setProdutoUsadoOfertaSelecionado(produto);
              setValorOfertaUsado("");
            }}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "10px",
              fontSize: "16px",
              backgroundColor: "#fff",
              color: "#000",
              border: "1px solid #000",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Fazer oferta
          </button>
        </div>
      ))}
    </div>
  );
}