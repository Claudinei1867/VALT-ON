import React from "react";

const formatarPreco = (valor) => {
  return `CVT ${Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// =====================================================
// PÁGINA DE DETALHES DO PRODUTO
// =====================================================

function ProdutoDetalhes({
  produto,
  quantidade,
  setQuantidade,
  onVoltar,
  onComprar,
  obterUrlImagem,
}) {
  // =====================================================
  // VERIFICAR PRODUTO
  // =====================================================

  if (!produto) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          background: "#f5f5f5",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "16px",
            textAlign: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h2>Produto não encontrado.</h2>

          <button
            onClick={onVoltar}
            style={{
              marginTop: "20px",
              padding: "12px 22px",
              cursor: "pointer",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "white",
              fontWeight: "bold",
            }}
          >
            ← Voltar para a loja
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // AUMENTAR QUANTIDADE
  // =====================================================

  const aumentarQuantidade = () => {
    if (quantidade < produto.estoque) {
      setQuantidade(quantidade + 1);
    }
  };

  // =====================================================
  // DIMINUIR QUANTIDADE
  // =====================================================

  const diminuirQuantidade = () => {
    if (quantidade > 1) {
      setQuantidade(quantidade - 1);
    }
  };

  // =====================================================
  // PREÇO TOTAL
  // =====================================================

  const totalProduto = Number(produto.preco) * quantidade;

  // =====================================================
  // TELA
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
        }}
      >
        {/* =================================================
            VOLTAR
        ================================================= */}

        <button
          onClick={onVoltar}
          style={{
            padding: "11px 20px",
            cursor: "pointer",
            marginBottom: "20px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            background: "white",
            fontWeight: "bold",
            fontSize: "15px",
          }}
        >
          ← Voltar para a loja
        </button>

        {/* =================================================
            PRODUTO
        ================================================= */}

        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "clamp(18px, 4vw, 35px)",
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) minmax(0, 1fr)",
            gap: "clamp(25px, 5vw, 50px)",
            boxShadow:
              "0 4px 18px rgba(0,0,0,0.08)",
          }}
        >
          {/* =================================================
              IMAGEM
          ================================================= */}

          <div>
            <div
              style={{
                width: "100%",
                minHeight: "420px",
                border: "1px solid #e1e1e1",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                boxSizing: "border-box",
                background: "#fff",
                overflow: "hidden",
              }}
            >
              {produto.imagem ? (
                <img
                  src={obterUrlImagem(produto.imagem)}
                  alt={produto.nome}
                  onError={(evento) => {
                    evento.currentTarget.style.display = "none";
                  }}
                  style={{
                    width: "100%",
                    height: "390px",
                    objectFit: "contain",
                    borderRadius: "10px",
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: "100px",
                  }}
                >
                  🛍️
                </div>
              )}
            </div>

            {/* INFORMAÇÃO ABAIXO DA IMAGEM */}

            <div
              style={{
                marginTop: "15px",
                textAlign: "center",
                color: "#777",
                fontSize: "14px",
              }}
            >
              Imagem ilustrativa do produto
            </div>
          </div>

          {/* =================================================
              INFORMAÇÕES DO PRODUTO
          ================================================= */}

          <div>
            {/* CATEGORIA */}

            <p
              style={{
                color: "#666",
                marginTop: "0",
                marginBottom: "8px",
                fontSize: "15px",
              }}
            >
              🏷️ {produto.categoria}
            </p>

            {/* NOME */}

            <h1
              style={{
                marginTop: "0",
                marginBottom: "12px",
                fontSize: "clamp(26px, 4vw, 36px)",
                lineHeight: "1.2",
              }}
            >
              {produto.nome}
            </h1>

            {/* AVALIAÇÃO */}

            <div
              style={{
                marginBottom: "20px",
                fontSize: "18px",
              }}
            >
              ⭐⭐⭐⭐⭐

              <span
                style={{
                  fontSize: "14px",
                  marginLeft: "8px",
                  color: "#666",
                }}
              >
                Produto em destaque
              </span>
            </div>

            {/* DESCRIÇÃO */}

            <div
              style={{
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  marginBottom: "8px",
                }}
              >
                Sobre o produto
              </h3>

              <p
                style={{
                  fontSize: "16px",
                  lineHeight: "1.6",
                  color: "#444",
                  marginTop: "0",
                }}
              >
                {produto.descricao ||
                  "Descrição não informada."}
              </p>
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #eee",
                margin: "25px 0",
              }}
            />

            {/* PREÇO */}

            <p
              style={{
                marginBottom: "5px",
                color: "#666",
              }}
            >
              Por apenas:
            </p>

            <h2
              style={{
                fontSize: "clamp(28px, 5vw, 38px)",
                marginTop: "0",
                marginBottom: "5px",
              }}
            >
              {formatarPreco(produto.preco)}
            </h2>

            {/* TOTAL */}

            {quantidade > 1 && (
              <p
                style={{
                  color: "#666",
                  marginTop: "5px",
                  marginBottom: "15px",
                }}
              >
                Total de {quantidade} unidades:{" "}
                <strong>
                  {formatarPreco(totalProduto)}
                </strong>
              </p>
            )}

            {/* ESTOQUE */}

            <p
              style={{
                fontWeight: "bold",
                marginBottom: "20px",
                color:
                  produto.estoque > 0
                    ? "green"
                    : "red",
              }}
            >
              {produto.estoque > 0
                ? `📦 Estoque disponível: ${produto.estoque}`
                : "❌ Produto sem estoque"}
            </p>

            {/* =================================================
                QUANTIDADE
            ================================================= */}

            {produto.estoque > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "25px",
                  flexWrap: "wrap",
                }}
              >
                <strong>Quantidade:</strong>

                <button
                  onClick={diminuirQuantidade}
                  disabled={quantidade <= 1}
                  style={{
                    width: "42px",
                    height: "42px",
                    fontSize: "22px",
                    cursor:
                      quantidade > 1
                        ? "pointer"
                        : "not-allowed",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    background:
                      quantidade > 1
                        ? "white"
                        : "#eee",
                  }}
                >
                  −
                </button>

                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    minWidth: "35px",
                    textAlign: "center",
                  }}
                >
                  {quantidade}
                </span>

                <button
                  onClick={aumentarQuantidade}
                  disabled={
                    quantidade >= produto.estoque
                  }
                  style={{
                    width: "42px",
                    height: "42px",
                    fontSize: "22px",
                    cursor:
                      quantidade <
                      produto.estoque
                        ? "pointer"
                        : "not-allowed",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    background:
                      quantidade <
                      produto.estoque
                        ? "white"
                        : "#eee",
                  }}
                >
                  +
                </button>
              </div>
            )}

            {/* =================================================
                COMPRAR
            ================================================= */}

            <button
              onClick={onComprar}
              disabled={produto.estoque <= 0}
              style={{
                width: "100%",
                padding: "17px",
                fontSize: "19px",
                fontWeight: "bold",
                cursor:
                  produto.estoque > 0
                    ? "pointer"
                    : "not-allowed",
                borderRadius: "10px",
                border: "none",
                background:
                  produto.estoque > 0
                    ? "#111"
                    : "#aaa",
                color: "white",
                boxShadow:
                  produto.estoque > 0
                    ? "0 4px 10px rgba(0,0,0,0.15)"
                    : "none",
              }}
            >
              {produto.estoque > 0
                ? "🛒 Comprar agora"
                : "Sem estoque"}
            </button>

            {/* =================================================
                INFORMAÇÕES EXTRAS
            ================================================= */}

            <div
              style={{
                marginTop: "25px",
                padding: "20px",
                background: "#f8f8f8",
                borderRadius: "12px",
                fontSize: "15px",
                color: "#444",
                border: "1px solid #eee",
              }}
            >
              <p
                style={{
                  marginTop: "0",
                }}
              >
                🚚{" "}
                <strong>
                  Prazo de entrega:
                </strong>{" "}
                {produto.prazo_entrega_dias
                  ? `${produto.prazo_entrega_dias} dias`
                  : "A consultar"}
              </p>

              <p>
                📦{" "}
                <strong>
                  Disponibilidade:
                </strong>{" "}
                {produto.estoque > 0
                  ? "Produto disponível em estoque"
                  : "Produto sem estoque"}
              </p>

              <p>
                🔒{" "}
                <strong>
                  Compra segura
                </strong>
              </p>

              <p
                style={{
                  marginBottom: "0",
                }}
              >
                🛍️{" "}
                <strong>
                  Produto vendido pela VALT-ON
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            RODAPÉ DA PÁGINA
        ================================================= */}

        <div
          style={{
            textAlign: "center",
            padding: "25px 10px",
            color: "#777",
            fontSize: "14px",
          }}
        >
          VALT-ON • Sua loja online
        </div>
      </div>
    </div>
  );
}

export default ProdutoDetalhes;