import { useState } from "react";

const API_URL = "https://valt-on.onrender.com";

// =====================================================
// TRANSFORMAR URL DA IMAGEM
// =====================================================

const obterUrlImagem = (url) => {
  if (!url) {
    return "";
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${API_URL}${url}`;
  }

  return `${API_URL}/${url}`;
};

// =====================================================
// MINHA CONTA
// =====================================================

function MinhaConta({
  usuario,
  onVoltar,
  onLogout,
}) {
  // =====================================================
  // PEDIDOS
  // =====================================================

  const [pedidos, setPedidos] = useState([]);
  const [carregandoPedidos, setCarregandoPedidos] =
    useState(false);
  const [mostrarPedidos, setMostrarPedidos] =
    useState(false);

  // =====================================================
  // ESPAÇOS
  // =====================================================

  const [espacos, setEspacos] = useState([]);
  const [carregandoEspacos, setCarregandoEspacos] =
    useState(false);
  const [mostrarEspacos, setMostrarEspacos] =
    useState(false);
  const [erroEspacos, setErroEspacos] =
    useState("");

  // =====================================================
  // ERRO GERAL
  // =====================================================

  const [erro, setErro] = useState("");

  // =====================================================
  // PEDIDO ABERTO
  // =====================================================

  const [pedidoAberto, setPedidoAberto] =
    useState(null);

  // =====================================================
  // BUSCAR PEDIDOS DO CLIENTE
  // =====================================================

  const carregarPedidos = async () => {
    if (!usuario || !usuario.id) {
      return;
    }

    setCarregandoPedidos(true);
    setErro("");

    try {
      const resposta = await fetch(
        `${API_URL}/clientes/${usuario.id}/pedidos`
      );

      if (!resposta.ok) {
        throw new Error(
          "Não foi possível carregar os pedidos."
        );
      }

      const dados = await resposta.json();

      console.log(
        "PEDIDOS DO CLIENTE:",
        dados
      );

      setPedidos(dados);
      setMostrarPedidos(true);
    } catch (error) {
      console.error(
        "ERRO AO BUSCAR PEDIDOS:",
        error
      );

      setErro(
        "Não foi possível carregar seus pedidos."
      );
    } finally {
      setCarregandoPedidos(false);
    }
  };

  // =====================================================
  // BUSCAR ESPAÇOS DO CLIENTE
  // =====================================================

  const carregarEspacos = async () => {
    if (!usuario || !usuario.id) {
      return;
    }

    setCarregandoEspacos(true);
    setErroEspacos("");

    try {
      const resposta = await fetch(
        `${API_URL}/clientes/${usuario.id}/espacos`
      );

      if (!resposta.ok) {
        throw new Error(
          "Não foi possível carregar os espaços."
        );
      }

      const dados = await resposta.json();

      console.log(
        "ESPAÇOS DO CLIENTE:",
        dados
      );

      setEspacos(dados);
      setMostrarEspacos(true);
    } catch (error) {
      console.error(
        "ERRO AO BUSCAR ESPAÇOS:",
        error
      );

      setErroEspacos(
        "Não foi possível carregar seus espaços."
      );
    } finally {
      setCarregandoEspacos(false);
    }
  };

  // =====================================================
  // ABRIR / FECHAR PEDIDO
  // =====================================================

  const alternarPedido = (pedidoId) => {
    if (pedidoAberto === pedidoId) {
      setPedidoAberto(null);
    } else {
      setPedidoAberto(pedidoId);
    }
  };

  // =====================================================
  // ETAPAS DO PEDIDO
  // =====================================================

  const etapasPedido = [
    {
      numero: 1,
      nome: "Pago",
      icone: "✓",
    },
    {
      numero: 2,
      nome: "Preparando",
      icone: "📦",
    },
    {
      numero: 3,
      nome: "Enviado",
      icone: "🚚",
    },
    {
      numero: 4,
      nome: "A caminho",
      icone: "🛵",
    },
    {
      numero: 5,
      nome: "Entregue",
      icone: "✓",
    },
  ];

  // =====================================================
  // DESCOBRIR ETAPA ATUAL
  // =====================================================

  const obterEtapaPedido = (status) => {
    const statusNormalizado = String(status || "")
      .toLowerCase()
      .trim();

    if (statusNormalizado === "pago") {
      return 1;
    }

    if (statusNormalizado === "preparando") {
      return 2;
    }

    if (statusNormalizado === "enviado") {
      return 3;
    }

    if (
      statusNormalizado === "a caminho" ||
      statusNormalizado === "a_caminho"
    ) {
      return 4;
    }

    if (statusNormalizado === "entregue") {
      return 5;
    }

    return 1;
  };

  // =====================================================
  // VERIFICAR USUÃRIO
  // =====================================================

  if (!usuario) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
        }}
      >
        <h2>
          Você não está logado.
        </h2>

        <button
          onClick={onVoltar}
          style={{
            padding: "12px 25px",
            cursor: "pointer",
          }}
        >
          🛍️ Voltar para a loja
        </button>
      </div>
    );
  }

  // =====================================================
  // TELA MINHA CONTA
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "30px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "950px",
          margin: "0 auto",
        }}
      >

        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h1
            style={{
              margin: 0,
            }}
          >
            👤 Minha Conta
          </h1>

          <button
            onClick={onVoltar}
            style={{
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            🛍️ Voltar para a loja
          </button>
        </div>

        {/* =================================================
            DADOS DA CONTA
        ================================================= */}

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            marginBottom: "20px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h2>
            👤 Dados da conta
          </h2>

          <p>
            <strong>Nome:</strong>{" "}
            {usuario.nome}
          </p>

          <p>
            <strong>E-mail:</strong>{" "}
            {usuario.email}
          </p>

          <p>
            <strong>Saldo CVT:</strong>{" "}
            {Number(usuario.saldo_cvt || 0).toFixed(2)} CVT
          </p>
        </div>

        {/* =================================================
            BOTÕES DA CONTA
        ================================================= */}

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            marginBottom: "20px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h2>
            Minha conta
          </h2>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {/* PEDIDOS */}

            <button
              onClick={carregarPedidos}
              disabled={carregandoPedidos}
              style={{
                padding: "12px 20px",
                cursor: carregandoPedidos
                  ? "default"
                  : "pointer",
                fontWeight: "bold",
              }}
            >
              {carregandoPedidos
                ? "â³ Carregando..."
                : "📦 Ver meus pedidos"}
            </button>

            {/* ESPAÇOS */}

            <button
              onClick={carregarEspacos}
              disabled={carregandoEspacos}
              style={{
                padding: "12px 20px",
                cursor: carregandoEspacos
                  ? "default"
                  : "pointer",
                fontWeight: "bold",
              }}
            >
              {carregandoEspacos
                ? "â³ Carregando..."
                : "🏠 Meus Espaços"}
            </button>

            {/* SAIR */}

            <button
              onClick={onLogout}
              style={{
                padding: "12px 20px",
                cursor: "pointer",
              }}
            >
              🚪 Sair da conta
            </button>
          </div>
        </div>

        {/* =================================================
            ERRO DOS PEDIDOS
        ================================================= */}

        {erro && (
          <div
            style={{
              background: "#ffe5e5",
              color: "#b00000",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            {erro}
          </div>
        )}

        {/* =================================================
            ERRO DOS ESPAÇOS
        ================================================= */}

        {erroEspacos && (
          <div
            style={{
              background: "#ffe5e5",
              color: "#b00000",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            {erroEspacos}
          </div>
        )}

        {/* =================================================
            MEUS ESPAÇOS
        ================================================= */}

        {mostrarEspacos && (
          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              marginBottom: "20px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              🏠 Meus Espaços
            </h2>

            {espacos.length === 0 ? (
              <p>
                Você ainda não possui espaços.
              </p>
            ) : (
              espacos.map((espaco) => (
                <div
                  key={espaco.id}
                  style={{
                    border:
                      "1px solid #ddd",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "15px",
                    background: "#fafafa",
                  }}
                >
                  <h3
                    style={{
                      marginTop: 0,
                    }}
                  >
                    🏠 {espaco.nome}
                  </h3>

                  <p>
                    <strong>
                      Tipo:
                    </strong>{" "}
                    {espaco.tipo}
                  </p>

                  <p>
                    <strong>
                      Valor:
                    </strong>{" "}
                    {Number(
                      espaco.valor || 0
                    ).toFixed(2)}{" "}
                    CVT
                  </p>

                  <p>
                    <strong>
                      Status:
                    </strong>{" "}
                    {espaco.adquirido}
                  </p>

                  <p>
                    <strong>
                      ID do espaço:
                    </strong>{" "}
                    {espaco.id}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* =================================================
            MEUS PEDIDOS
        ================================================= */}

        {mostrarPedidos && (
          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              📦 Meus Pedidos
            </h2>

            {pedidos.length === 0 ? (
              <p>
                Você ainda não possui
                pedidos.
              </p>
            ) : (
              pedidos.map((pedido) => {
                const aberto =
                  pedidoAberto === pedido.id;

                const etapaAtual =
                  obterEtapaPedido(
                    pedido.status
                  );

                return (
                  <div
                    key={pedido.id}
                    style={{
                      border:
                        "1px solid #ddd",
                      borderRadius: "12px",
                      marginBottom: "15px",
                      overflow: "hidden",
                      background: "#fff",
                    }}
                  >
                    {/* RESUMO DO PEDIDO */}

                    <div
                      style={{
                        padding: "20px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          flexWrap:
                            "wrap",
                          gap: "10px",
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                          }}
                        >
                          📦 Pedido #{pedido.id}
                        </h3>

                        <span
                          style={{
                            fontWeight:
                              "bold",
                            padding:
                              "6px 12px",
                            borderRadius:
                              "20px",
                            background:
                              "#e8f5e9",
                            color:
                              "#2e7d32",
                          }}
                        >
                          {pedido.status}
                        </span>
                      </div>

                      {/* ACOMPANHAMENTO */}

                      <div
                        style={{
                          marginTop:
                            "25px",
                          padding: "20px",
                          background:
                            "#f8f9fa",
                          borderRadius:
                            "12px",
                          border:
                            "1px solid #ddd",
                          overflowX:
                            "auto",
                        }}
                      >
                        <h4
                          style={{
                            marginTop: 0,
                            marginBottom:
                              "25px",
                          }}
                        >
                          📦 Acompanhamento do pedido
                        </h4>

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "flex-start",
                            justifyContent:
                              "space-between",
                            minWidth:
                              "650px",
                          }}
                        >
                          {etapasPedido.map(
                            (
                              etapa,
                              indice
                            ) => {
                              const concluida =
                                etapa.numero <=
                                etapaAtual;

                              const atual =
                                etapa.numero ===
                                etapaAtual;

                              return (
                                <div
                                  key={
                                    etapa.numero
                                  }
                                  style={{
                                    flex: 1,
                                    textAlign:
                                      "center",
                                    position:
                                      "relative",
                                  }}
                                >
                                  {/* LINHA */}

                                  {indice <
                                    etapasPedido.length -
                                    1 && (
                                      <div
                                        style={{
                                          position:
                                            "absolute",
                                          top:
                                            "20px",
                                          left:
                                            "50%",
                                          width:
                                            "100%",
                                          height:
                                            "4px",
                                          background:
                                            etapa.numero <
                                              etapaAtual
                                              ? "#2e7d32"
                                              : "#ddd",
                                          zIndex:
                                            0,
                                        }}
                                      />
                                    )}

                                  {/* CÃRCULO */}

                                  <div
                                    style={{
                                      position:
                                        "relative",
                                      zIndex:
                                        1,
                                      width:
                                        "42px",
                                      height:
                                        "42px",
                                      margin:
                                        "0 auto 10px",
                                      borderRadius:
                                        "50%",
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      justifyContent:
                                        "center",
                                      background:
                                        concluida
                                          ? "#2e7d32"
                                          : "#e0e0e0",
                                      color:
                                        concluida
                                          ? "white"
                                          : "#777",
                                      fontWeight:
                                        "bold",
                                      fontSize:
                                        "18px",
                                      border:
                                        atual
                                          ? "4px solid #a5d6a7"
                                          : "2px solid #ccc",
                                      boxSizing:
                                        "border-box",
                                    }}
                                  >
                                    {etapa.icone}
                                  </div>

                                  {/* NOME */}

                                  <div
                                    style={{
                                      fontWeight:
                                        concluida
                                          ? "bold"
                                          : "normal",
                                      color:
                                        concluida
                                          ? "#2e7d32"
                                          : "#777",
                                      fontSize:
                                        "14px",
                                    }}
                                  >
                                    {etapa.nome}
                                  </div>

                                  {/* ETAPA ATUAL */}

                                  {atual && (
                                    <div
                                      style={{
                                        marginTop:
                                          "6px",
                                        fontSize:
                                          "12px",
                                        fontWeight:
                                          "bold",
                                        color:
                                          "#2e7d32",
                                      }}
                                    >
                                      Você está aqui
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {/* TOTAL */}

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          flexWrap:
                            "wrap",
                          gap: "15px",
                          marginTop:
                            "15px",
                        }}
                      >
                        <strong
                          style={{
                            fontSize:
                              "18px",
                          }}
                        >
                          Total: CVT{" "}
                          {Number(
                            pedido.total
                          ).toFixed(2)}
                        </strong>

                        <button
                          onClick={() =>
                            alternarPedido(
                              pedido.id
                            )
                          }
                          style={{
                            padding:
                              "10px 18px",
                            cursor:
                              "pointer",
                            fontWeight:
                              "bold",
                          }}
                        >
                          {aberto
                            ? "🔽 Ocultar detalhes"
                            : "🔎 Ver detalhes"}
                        </button>
                      </div>
                    </div>

                    {/* =================================================
                        DETALHES DO PEDIDO
                    ================================================= */}

                    {aberto && (
                      <div
                        style={{
                          borderTop:
                            "1px solid #ddd",
                          padding:
                            "20px",
                          background:
                            "#fafafa",
                        }}
                      >

                        <div
                          style={{
                            marginBottom: "20px",
                            padding: "15px",
                            background: "#f1f8e9",
                            border: "1px solid #c5e1a5",
                            borderRadius: "10px",
                          }}
                        >
                          <h4
                            style={{
                              marginTop: 0,
                              marginBottom: "12px",
                            }}
                          >
                            🚚 Entrega
                          </h4>

                          <p>
                            <strong>Prazo de entrega:</strong>{" "}
                            {pedido.prazo_entrega} dias
                          </p>

                          <p>
                            <strong>Data do pedido:</strong>{" "}
                            {pedido.data_pedido
                              ? new Date(pedido.data_pedido).toLocaleString("pt-BR")
                              : "Não informado"}
                          </p>

                          <p>
                            <strong>Entrega prevista:</strong>{" "}
                            {pedido.data_entrega_prevista
                              ? new Date(
                                pedido.data_entrega_prevista
                              ).toLocaleString("pt-BR")
                              : "Não informado"}
                          </p>
                        </div>

                        {/* PRODUTOS */}

                        <h4>
                          🛍️ Produtos
                        </h4>

                        {pedido.itens &&
                          pedido.itens.length >
                          0 ? (
                          pedido.itens.map(
                            (
                              item,
                              indice
                            ) => {
                              const subtotal =
                                Number(
                                  item.preco_unitario
                                ) *
                                Number(
                                  item.quantidade
                                );

                              return (
                                <div
                                  key={
                                    indice
                                  }
                                  style={{
                                    display:
                                      "flex",
                                    gap: "15px",
                                    alignItems:
                                      "center",
                                    padding:
                                      "15px",
                                    background:
                                      "white",
                                    border:
                                      "1px solid #ddd",
                                    borderRadius:
                                      "10px",
                                    marginBottom:
                                      "10px",
                                    flexWrap:
                                      "wrap",
                                  }}
                                >
                                  {/* IMAGEM */}

                                  <div
                                    style={{
                                      width:
                                        "110px",
                                      height:
                                        "110px",
                                      background:
                                        "white",
                                      borderRadius:
                                        "8px",
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      justifyContent:
                                        "center",
                                      overflow:
                                        "hidden",
                                      border:
                                        "1px solid #ddd",
                                      flexShrink:
                                        0,
                                    }}
                                  >
                                    {item.imagem ? (
                                      <img
                                        src={obterUrlImagem(
                                          item.imagem
                                        )}
                                        alt={
                                          item.produto_nome
                                        }
                                        onError={(
                                          evento
                                        ) => {
                                          evento.currentTarget.style.display =
                                            "none";

                                          if (
                                            evento
                                              .currentTarget
                                              .parentElement
                                          ) {
                                            evento.currentTarget.parentElement.innerHTML =
                                              "🛍️";

                                            evento.currentTarget.parentElement.style.fontSize =
                                              "45px";

                                            evento.currentTarget.parentElement.style.textAlign =
                                              "center";
                                          }
                                        }}
                                        style={{
                                          width:
                                            "100%",
                                          height:
                                            "100%",
                                          objectFit:
                                            "contain",
                                        }}
                                      />
                                    ) : (
                                      <span
                                        style={{
                                          fontSize:
                                            "45px",
                                        }}
                                      >
                                        🛍️
                                      </span>
                                    )}
                                  </div>

                                  {/* INFORMAÇÕES */}

                                  <div
                                    style={{
                                      flex: 1,
                                      minWidth:
                                        "220px",
                                    }}
                                  >
                                    <strong
                                      style={{
                                        fontSize:
                                          "18px",
                                      }}
                                    >
                                      {
                                        item.produto_nome
                                      }
                                    </strong>

                                    <p
                                      style={{
                                        margin:
                                          "8px 0",
                                      }}
                                    >
                                      🔢 Quantidade:{" "}
                                      {
                                        item.quantidade
                                      }
                                    </p>

                                    <p
                                      style={{
                                        margin:
                                          "8px 0",
                                      }}
                                    >
                                      💵 Preço unitário:{" "}
                                      <strong>
                                        CVT{" "}
                                        {Number(
                                          item.preco_unitario
                                        ).toFixed(
                                          2
                                        )}
                                      </strong>
                                    </p>

                                    <p
                                      style={{
                                        margin:
                                          "8px 0",
                                      }}
                                    >
                                      💰 Subtotal:{" "}
                                      <strong>
                                        CVT{" "}
                                        {subtotal.toFixed(
                                          2
                                        )}
                                      </strong>
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                          )
                        ) : (
                          <p>
                            Nenhum item
                            encontrado.
                          </p>
                        )}

                        {/* TOTAL DO PEDIDO */}

                        <div
                          style={{
                            marginTop:
                              "20px",
                            paddingTop:
                              "15px",
                            borderTop:
                              "2px solid #ddd",
                            textAlign:
                              "right",
                          }}
                        >
                          <span
                            style={{
                              fontSize:
                                "18px",
                            }}
                          >
                            Total do pedido:
                          </span>

                          <strong
                            style={{
                              fontSize:
                                "22px",
                              marginLeft:
                                "8px",
                            }}
                          >
                            CVT{" "}
                            {Number(
                              pedido.total
                            ).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* =================================================
            VOLTAR PARA LOJA
        ================================================= */}

        <div
          style={{
            textAlign: "center",
            marginTop: "25px",
          }}
        >
          <button
            onClick={onVoltar}
            style={{
              padding: "12px 30px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            🛍️ Voltar para a loja
          </button>
        </div>
      </div>
    </div>
  );
}

export default MinhaConta;
