import { useEffect, useRef, useState } from "react";

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
  onAtualizarUsuario,
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
  // MONITORAMENTO DE ALTERAÇÃO DE STATUS
  // =====================================================


  const statusPedidosAnterior = useRef({});

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

  const [espacoAberto, setEspacoAberto] =
    useState(null);

  const [figurinhaSelecionada, setFigurinhaSelecionada] =
    useState(null);

  const [mostrarCompraCasa, setMostrarCompraCasa] =
    useState(false);

  const [comprandoCasa, setComprandoCasa] =
    useState(false);

  // =====================================================
  // COMPRA DE CRÉDITOS CVT
  // =====================================================

  const [mostrarCompraCVT, setMostrarCompraCVT] =
    useState(false);

  const [quantidadeCVT, setQuantidadeCVT] =
    useState(1000);

  const [comprandoCVT, setComprandoCVT] =
    useState(false);

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
  // COMPRAR CRÉDITOS CVT
  // =====================================================

  const comprarCVT = async (quantidadeSelecionada = quantidadeCVT) => {
    if (!usuario || !usuario.id) {
      return;
    }

    const quantidade = Number(quantidadeSelecionada);

    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      alert("Informe uma quantidade válida de CVT.");
      return;
    }

    setComprandoCVT(true);

    try {
      const resposta = await fetch(
        `${API_URL}/pagamentos/cvt/criar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cliente_id: usuario.id,
            quantidade_cvt: quantidade,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            "Não foi possível criar o pagamento."
        );
      }

      if (!dados.init_point) {
        throw new Error(
          "O Mercado Pago não retornou o endereço do pagamento."
        );
      }

      window.location.href = dados.init_point;
    } catch (error) {
      console.error(
        "ERRO AO COMPRAR CVT:",
        error
      );

      alert(
        error.message ||
          "Não foi possível iniciar a compra de CVT."
      );
    } finally {
      setComprandoCVT(false);
    }
  };

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

      // Verificar alteração de status
      if (Object.keys(statusPedidosAnterior.current).length > 0) {

        dados.forEach((pedido) => {

          const statusAnterior =
            statusPedidosAnterior.current[pedido.pedido_id];

          if (
            statusAnterior !== undefined &&
            statusAnterior !== pedido.status
          ) {

            console.log(
              "ALTERAÇÃO DE STATUS DETECTADA:",
              pedido.pedido_id,
              statusAnterior,
              "->",
              pedido.status
            );

            try {

              const contextoAudio =
                new (window.AudioContext ||
                  window.webkitAudioContext)();

              const oscilador =
                contextoAudio.createOscillator();

              const ganho =
                contextoAudio.createGain();

              oscilador.connect(ganho);
              ganho.connect(contextoAudio.destination);

              oscilador.frequency.value = 880;
              oscilador.type = "sine";

              ganho.gain.setValueAtTime(
                0.3,
                contextoAudio.currentTime
              );

              ganho.gain.exponentialRampToValueAtTime(
                0.01,
                contextoAudio.currentTime + 0.5
              );

              oscilador.start();

              oscilador.stop(
                contextoAudio.currentTime + 0.5
              );

            } catch (erroAudio) {

              console.error(
                "Não foi possível reproduzir o som:",
                erroAudio
              );

            }
          }
        });
      }

      // Guardar os status atuais
      const novosStatus = {};

      dados.forEach((pedido) => {
        novosStatus[pedido.pedido_id] =
          pedido.status;
      });

      statusPedidosAnterior.current =
        novosStatus;

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
  // VERIFICAR AUTOMATICAMENTE ALTERAÇÕES NOS PEDIDOS
  // =====================================================

  useEffect(() => {

    if (!mostrarPedidos || !usuario || !usuario.id) {
      return;
    }

    const intervalo = setInterval(() => {
      carregarPedidos();
    }, 15000);

    return () => {
      clearInterval(intervalo);
    };

  }, [mostrarPedidos, usuario]);

  // =====================================================
  // BUSCAR ESPAÇOS DO CLIENTE
  // =====================================================

  const excluirFigurinha = async () => {
    if (!usuario || !usuario.id || !figurinhaSelecionada) {
      return;
    }

    try {
      const resposta = await fetch(
        `${API_URL}/clientes/${usuario.id}/espacos/itens/${figurinhaSelecionada.id}`,
        {
          method: "DELETE",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail || "Não foi possível excluir a figurinha."
        );
      }

      alert("Figurinha excluída com sucesso.");

      setFigurinhaSelecionada(null);
      await carregarEspacos();

      setEspacoAberto((atual) => {
        if (!atual) {
          return atual;
        }

        return {
          ...atual,
          figurinhas: atual.figurinhas.filter(
            (figurinha) =>
              figurinha.id !== figurinhaSelecionada.id
          ),
        };
      });

    } catch (error) {
      console.error(
        "ERRO AO EXCLUIR FIGURINHA:",
        error
      );

      alert(
        error.message ||
        "Não foi possível excluir a figurinha."
      );
    }
  };

  const colocarFigurinhaAVenda = async () => {
    if (!usuario || !usuario.id || !figurinhaSelecionada) {
      return;
    }

    const precoOriginal = Number(
      figurinhaSelecionada.preco || 0
    );

    const precoMaximo = Number(
      (precoOriginal * 0.8).toFixed(2)
    );

    const preco = window.prompt(
      `Preço original: ${precoOriginal.toFixed(2)} CVT\n` +
      `Preço máximo para venda: ${precoMaximo.toFixed(2)} CVT\n\n` +
      "Digite o preço de venda da figurinha em CVT:"
    );

    if (preco === null) {
      return;
    }

    const precoVenda = Number(
      preco.replace(",", ".")
    );

    if (!Number.isFinite(precoVenda) || precoVenda <= 0) {
      alert("Informe um preço de venda válido.");
      return;
    }

    try {
      const resposta = await fetch(
        `${API_URL}/clientes/${usuario.id}/espacos/itens/${figurinhaSelecionada.id}/vender`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cliente_id: usuario.id,
            item_id: figurinhaSelecionada.id,
            preco_venda: precoVenda,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
          "Não foi possível colocar a figurinha à venda."
        );
      }

      alert(
        "Figurinha colocada à venda com sucesso."
      );

      setFigurinhaSelecionada(null);
      await carregarEspacos();

      setEspacoAberto((atual) => {
        if (!atual) {
          return atual;
        }

        return {
          ...atual,
          figurinhas: atual.figurinhas.map(
            (figurinha) =>
              figurinha.id ===
                figurinhaSelecionada.id
                ? {
                  ...figurinha,
                  status: "VENDA",
                  preco_venda: precoVenda,
                }
                : figurinha
          ),
        };
      });
    } catch (error) {
      console.error(
        "ERRO AO COLOCAR FIGURINHA À VENDA:",
        error
      );

      alert(
        error.message ||
        "Não foi possível colocar a figurinha à venda."
      );
    }
  };

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

  const comprarCasa = async (tipo) => {
    if (!usuario || !usuario.id) {
      return;
    }

    setComprandoCasa(true);
    setErroEspacos("");

    try {
      const resposta = await fetch(
        `${API_URL}/clientes/${usuario.id}/espacos/comprar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cliente_id: usuario.id,
            tipo: tipo,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail || "Não foi possível comprar a casa."
        );
      }

      alert(
        `${dados.mensagem}\nSaldo restante: ${Number(
          dados.saldo_cvt
        ).toFixed(2)} CVT`
      );

      setMostrarCompraCasa(false);

      onAtualizarUsuario(dados.saldo_cvt);

      await carregarEspacos();
    } catch (error) {
      console.error(
        "ERRO AO COMPRAR CASA:",
        error
      );

      alert(
        error.message ||
        "Não foi possível comprar a casa."
      );
    } finally {
      setComprandoCasa(false);
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
  // VERIFICAR USUÁRIO
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
        background: "#e0e0e0",
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
            {/* COMPRAR CRÉDITOS CVT */}

            <button
              onClick={() =>
                setMostrarCompraCVT(!mostrarCompraCVT)
              }
              style={{
                padding: "12px 20px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ?? Comprar créditos CVT
            </button>

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
                ? "⏳ Carregando..."
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
                ? "⏳ Carregando..."
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

          {mostrarCompraCVT && (
            <div
              style={{
                marginTop: "20px",
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "12px",
                background: "#f8f9fa",
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                ?? Comprar créditos CVT
              </h3>

              <p>
                Escolha a quantidade de créditos CVT que deseja comprar:
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                  marginTop: "15px",
                }}
              >
                {[
                  { quantidade: 1000, valor: 5 },
                  { quantidade: 2500, valor: 12 },
                  { quantidade: 5000, valor: 35 },
                  { quantidade: 10000, valor: 80 },
                ].map((pacote) => (
                  <button
                    key={pacote.quantidade}
                    onClick={() => comprarCVT(pacote.quantidade)}
                    disabled={comprandoCVT}
                    style={{
                      padding: "18px 14px",
                      cursor: comprandoCVT
                        ? "not-allowed"
                        : "pointer",
                      borderRadius: "10px",
                      border: "1px solid #ccc",
                      background: "white",
                      fontWeight: "bold",
                      fontSize: "16px",
                    }}
                  >
                    <div style={{ fontSize: "20px", marginBottom: "8px" }}>
                      {pacote.quantidade.toLocaleString("pt-BR")} CVT
                    </div>

                    <div
                      style={{
                        fontSize: "18px",
                        color: "#198754",
                        marginBottom: "10px",
                      }}
                    >
                      R$ {pacote.valor.toFixed(2).replace(".", ",")}
                    </div>

                    <div style={{ fontSize: "14px" }}>
                      {comprandoCVT
                        ? "Aguarde..."
                        : "Comprar"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
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

        {mostrarEspacos && !espacoAberto && (
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

            <button
              onClick={() => setMostrarCompraCasa(true)}
              style={{
                padding: "12px 20px",
                marginBottom: "20px",
                cursor: "pointer",
                borderRadius: "8px",
                border: "none",
                background: "#198754",
                color: "white",
                fontWeight: "bold",
              }}
            >
              🏠 Comprar nova casa
            </button>

            {mostrarCompraCasa && (
              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "20px",
                  marginBottom: "20px",
                  background: "#f8f9fa",
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  🏠 Escolha sua nova casa
                </h3>

                <p>
                  Selecione uma casa para comprar:
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <button
                    onClick={() => comprarCasa("media")}
                    disabled={comprandoCasa}
                    style={{
                      padding: "19px 18px",
                      cursor: comprandoCasa ? "not-allowed" : "pointer",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      background: "white",
                      fontWeight: "bold",
                    }}
                  >
                    <img
                      src="/casas/casa-media.png"
                      alt="Casa Média"
                      style={{
                        width: "110px",
                        height: "110px",
                        objectFit: "contain",
                        display: "block",
                        margin: "0 auto 6px",
                      }}
                    />
                    🏠 Casa Média
                    <br />
                    3.000,00 CVT
                  </button>

                  <button
                    onClick={() => comprarCasa("grande")}
                    disabled={comprandoCasa}
                    style={{
                      padding: "19px 18px",
                      cursor: comprandoCasa ? "not-allowed" : "pointer",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      background: "white",
                      fontWeight: "bold",
                    }}
                  >
                    <img
                      src="/casas/casa-grande.png"
                      alt="Casa Grande"
                      style={{
                        width: "110px",
                        height: "110px",
                        objectFit: "contain",
                        display: "block",
                        margin: "0 auto 6px",
                      }}
                    />
                    🏠 Casa Grande
                    <br />
                    5.000,00 CVT
                  </button>

                  <button
                    onClick={() => comprarCasa("mansao")}
                    disabled={comprandoCasa}
                    style={{
                      padding: "19px 18px",
                      cursor: comprandoCasa
                        ? "not-allowed"
                        : "pointer",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      background: "white",
                      fontWeight: "bold",
                    }}
                  >
                    <img
                      src="/casas/mansao.png"
                      alt="Mansão"
                      style={{
                        width: "110px",
                        height: "110px",
                        objectFit: "contain",
                        display: "block",
                        margin: "0 auto 6px",
                      }}
                    />
                    🏠 Mansão
                    <br />
                    10.000,00 CVT
                  </button>

                  <button
                    onClick={() => setMostrarCompraCasa(false)}
                    disabled={comprandoCasa}
                    style={{
                      padding: "12px 18px",
                      cursor: comprandoCasa
                        ? "not-allowed"
                        : "pointer",
                      borderRadius: "8px",
                      border: "none",
                      background: "#6c757d",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

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
                  <button
                    onClick={() => {
                      setEspacoAberto(espaco);
                    }}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#343a40",
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer",
                      marginBottom: "15px",
                    }}
                  >
                    🏠 Entrar na casa
                  </button>
                  <img
                    src={
                      espaco.tipo === "pequena"
                        ? "/casas/casa-pequena.png"
                        : espaco.tipo === "media"
                          ? "/casas/casa-media.png"
                          : espaco.tipo === "grande"
                            ? "/casas/casa-grande.png"
                            : espaco.tipo === "mansao"
                              ? "/casas/mansao.png"
                              : ""
                    }
                    alt={espaco.nome}
                    style={{
                      width: "100%",
                      maxWidth: "500px",
                      height: "250px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      marginBottom: "15px",
                    }}
                  />

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
                  {false && espaco.figurinhas &&
                    espaco.figurinhas.length > 0 && (
                      <div
                        style={{
                          marginTop: "20px",
                        }}
                      >
                        <h4
                          style={{
                            marginBottom: "15px",
                          }}
                        >
                          🎁 Figurinhas
                        </h4>

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "15px",
                          }}
                        >
                          {espaco.figurinhas.map((figurinha) => (
                            <div
                              key={figurinha.id}
                              style={{
                                width: "180px",
                                border: "1px solid #ddd",
                                borderRadius: "14px",
                                padding: "10px",
                                background: "white",
                                textAlign: "center",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                              }}
                            >
                              {figurinha.imagem && (
                                <img
                                  src={figurinha.imagem}
                                  alt={figurinha.nome}
                                  style={{
                                    width: "100%",
                                    height: "160px",
                                    objectFit: "contain",
                                    borderRadius: "8px",
                                    marginBottom: "8px",
                                  }}
                                />
                              )}

                              <strong>
                                {figurinha.nome}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ))
            )}
          </div>
        )}

        {espacoAberto && (
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
            <button
              onClick={() => setEspacoAberto(null)}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                background: "#6c757d",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                marginBottom: "20px",
              }}
            >
              ← Voltar para Meus Espaços
            </button>

            <h2>
              🏠 {espacoAberto.nome}
            </h2>

            <div
              style={{
                textAlign: "center",
                marginBottom: "20px",
                fontSize: "20px",
                fontWeight: "bold",
                color: "#222",
              }}
            >
              🏠 Figurinhas:{" "}
              {espacoAberto.figurinhas
                ? espacoAberto.figurinhas.length
                : 0}
              {" / "}
              {espacoAberto.tipo === "pequena"
                ? 30
                : espacoAberto.tipo === "media"
                  ? 80
                  : espacoAberto.tipo === "grande"
                    ? 150
                    : espacoAberto.tipo === "mansao"
                      ? 500
                      : 0}
            </div>

            <img
              src={
                espacoAberto.tipo === "pequena"
                  ? "/casas/casa-pequena.png"
                  : espacoAberto.tipo === "media"
                    ? "/casas/casa-media.png"
                    : espacoAberto.tipo === "grande"
                      ? "/casas/casa-grande.png"
                      : espacoAberto.tipo === "mansao"
                        ? "/casas/mansao.png"
                        : ""
              }
              alt={espacoAberto.nome}
              style={{
                width: "100%",
                maxWidth: "700px",
                height: "380px",
                objectFit: "contain",
                borderRadius: "15px",
                display: "block",
                margin: "0 auto 25px",
              }}
            />
            {espacoAberto.figurinhas &&
              espacoAberto.figurinhas.length > 0 && (
                <div
                  style={{
                    marginTop: "20px",
                  }}
                >
                  <h4
                    style={{
                      marginBottom: "15px",
                    }}
                  >
                    🎁 Figurinhas das compras
                  </h4>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "15px",
                    }}
                  >
                    {espacoAberto.figurinhas.map(
                      (figurinha) => (
                        <div
                          key={figurinha.id}
                          onClick={() => setFigurinhaSelecionada(figurinha)}
                          style={{
                            width: "180px",
                            border: "1px solid #ddd",
                            borderRadius: "10px",
                            padding: "10px",
                            background: "white",
                            cursor: "pointer",
                            transition: "0.2s",
                          }}
                        >
                          {figurinha.imagem && (
                            <img
                              src={figurinha.imagem}
                              alt={figurinha.nome}
                              style={{
                                width: "100%",
                                height: "140px",
                                objectFit: "contain",
                                borderRadius: "8px",
                                marginBottom: "8px",
                              }}
                            />
                          )}

                          <strong>
                            {figurinha.nome}
                          </strong>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {figurinhaSelecionada && (
              <div
                style={{
                  marginTop: "25px",
                  padding: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  background: "#f5f5f5",
                  textAlign: "center",
                }}
              >
                <h3>
                  {figurinhaSelecionada.nome}
                </h3>

                <button
                  onClick={excluirFigurinha}
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: "300px",
                    margin: "10px auto",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  🗑️ Excluir
                </button>

                <button
                  onClick={colocarFigurinhaAVenda}
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: "300px",
                    margin: "10px auto",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  🏷️ Colocar à venda
                </button>

                <button
                  onClick={() =>
                    setFigurinhaSelecionada(null)
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: "300px",
                    margin: "10px auto",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
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
                  pedidoAberto === pedido.pedido_id;

                const etapaAtual =
                  obterEtapaPedido(
                    pedido.status
                  );

                return (
                  <div
                    key={pedido.pedido_id}
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
                          📦 Pedido #{pedido.pedido_id}
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

                                  {/* CÍRCULO */}

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
                              pedido.pedido_id
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
