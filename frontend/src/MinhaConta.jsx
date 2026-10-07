import { useEffect, useRef, useState } from "react";
import PresenteRecebido from "./presente/PresenteRecebido";

const API_URL = "https://api.valt-on.com";

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
  produtosFavoritos = [],
  onAbrirProduto,
}) {

  // =====================================================
  // PEDIDOS
  // =====================================================


  const [pedidos, setPedidos] = useState([]);
  const [carregandoPedidos, setCarregandoPedidos] =
    useState(false);
  const [mostrarPedidos, setMostrarPedidos] =
    useState(false);
  const [notificacoesPedidos,setNotificacoesPedidos]=useState([]);

  // =====================================================
  // MONITORAMENTO DE ALTERAÃ‡ÃƒO DE STATUS
  // =====================================================


  const statusPedidosAnterior = useRef({});

  // =====================================================
  // ESPAÃ‡OS
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

  const [figurinhaSelecionada, setFigurinhaSelecionada] = useState(null);
  const [ofertasExclusiva,setOfertasExclusiva]=useState([]);
  useEffect(()=>{if(!figurinhaSelecionada?.exclusiva||!usuario?.id){setOfertasExclusiva([]);return;}fetch(API_URL+"/figurinhas-exclusivas/ofertas-exclusivas/"+usuario.id).then(r=>r.ok?r.json():[]).then(d=>setOfertasExclusiva(d.filter(o=>o.produto_id===figurinhaSelecionada.produto_id))).catch(()=>setOfertasExclusiva([]));},[figurinhaSelecionada,usuario]);
  const responderExclusiva=async(o,aceitar)=>{const r=await fetch(API_URL+"/figurinhas-exclusivas/ofertas-exclusivas/"+o.oferta_id+"/responder?dono_id="+usuario.id+"&aceitar="+aceitar,{method:"POST"});const d=await r.json();if(!r.ok)return alert(d.detail||"Erro.");alert(aceitar?"Oferta aceita!":"Oferta recusada.");setOfertasExclusiva(a=>a.filter(x=>x.oferta_id!==o.oferta_id));};

  const [mostrarCompraCasa, setMostrarCompraCasa] =
    useState(false);

  const [comprandoCasa, setComprandoCasa] =
    useState(false);

  // =====================================================
  // COMPRA DE CRÃ‰DITOS CVT
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
  // COMPRAR CRÃ‰DITOS CVT
  // =====================================================

  const comprarCVT = async (quantidadeSelecionada = quantidadeCVT) => {
    if (!usuario || !usuario.id) {
      return;
    }

    const quantidade = Number(quantidadeSelecionada);

    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      alert("Informe uma quantidade vÃ¡lida de CVT.");
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
            "NÃ£o foi possÃ­vel criar o pagamento."
        );
      }

      if (!dados.init_point) {
        throw new Error(
          "O Mercado Pago nÃ£o retornou o endereÃ§o do pagamento."
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
          "NÃ£o foi possÃ­vel iniciar a compra de CVT."
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
          "NÃ£o foi possÃ­vel carregar os pedidos."
        );
      }

      const dados = await resposta.json();

      console.log(
        "PEDIDOS DO CLIENTE:",
        dados
      );

      // Verificar alteraÃ§Ã£o de status
      if (Object.keys(statusPedidosAnterior.current).length > 0) {

        dados.forEach((pedido) => {

          const statusAnterior =
            statusPedidosAnterior.current[pedido.pedido_id];

          if (
            statusAnterior !== undefined &&
            statusAnterior !== pedido.status
          ) {

            const textoNotificacao =
              pedido.status === "Entregue"
                ? pedido.eh_presente
                  ? "Você recebeu um presente! Vá até sua casa para conferir."
                  : "Sua compra chegou! Vá até sua casa para ver o que chegou."
                : `Pedido #${pedido.pedido_id}: status atualizado para ${pedido.status}.`;

            setNotificacoesPedidos(
              (atuais) => [
                {
                  id: `${pedido.pedido_id}-${pedido.status}-${Date.now()}`,
                  texto: textoNotificacao,
                },
                ...atuais,
              ].slice(0, 5)
            );
            console.log(
              "ALTERAÃ‡ÃƒO DE STATUS DETECTADA:",
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
                "NÃ£o foi possÃ­vel reproduzir o som:",
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
        "NÃ£o foi possÃ­vel carregar seus pedidos."
      );
    } finally {
      setCarregandoPedidos(false);
    }
  };

  // =====================================================
  // VERIFICAR AUTOMATICAMENTE ALTERAÃ‡Ã•ES NOS PEDIDOS
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
  // BUSCAR ESPAÃ‡OS DO CLIENTE
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
          dados.detail || "NÃ£o foi possÃ­vel excluir a figurinha."
        );
      }

      alert("Figurinha excluÃ­da com sucesso.");

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
        "NÃ£o foi possÃ­vel excluir a figurinha."
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
      `PreÃ§o original: ${precoOriginal.toFixed(2)} CVT\n` +
      `PreÃ§o mÃ¡ximo para venda: ${precoMaximo.toFixed(2)} CVT\n\n` +
      "Digite o preÃ§o de venda da figurinha em CVT:"
    );

    if (preco === null) {
      return;
    }

    const precoVenda = Number(
      preco.replace(",", ".")
    );

    if (!Number.isFinite(precoVenda) || precoVenda <= 0) {
      alert("Informe um preÃ§o de venda vÃ¡lido.");
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
          "NÃ£o foi possÃ­vel colocar a figurinha Ã  venda."
        );
      }

      alert(
        "Figurinha colocada Ã  venda com sucesso."
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
        "ERRO AO COLOCAR FIGURINHA Ã€ VENDA:",
        error
      );

      alert(
        error.message ||
        "NÃ£o foi possÃ­vel colocar a figurinha Ã  venda."
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
          "NÃ£o foi possÃ­vel carregar os espaÃ§os."
        );
      }

      const dados = await resposta.json();

      console.log(
        "ESPAÃ‡OS DO CLIENTE:",
        dados
      );

      setEspacos(dados);
      setMostrarEspacos(true);
    } catch (error) {
      console.error(
        "ERRO AO BUSCAR ESPAÃ‡OS:",
        error
      );

      setErroEspacos(
        "NÃ£o foi possÃ­vel carregar seus espaÃ§os."
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
          dados.detail || "NÃ£o foi possÃ­vel comprar a casa."
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
        "NÃ£o foi possÃ­vel comprar a casa."
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
      icone: "âœ“",
    },
    {
      numero: 2,
      nome: "Preparando",
      icone: "ðŸ“¦",
    },
    {
      numero: 3,
      nome: "Enviado",
      icone: "ðŸšš",
    },
    {
      numero: 4,
      nome: "A caminho",
      icone: "ðŸ›µ",
    },
    {
      numero: 5,
      nome: "Entregue",
      icone: "âœ“",
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
          VocÃª nÃ£o estÃ¡ logado.
        </h2>

        <button
          onClick={onVoltar}
          style={{
            padding: "12px 25px",
            cursor: "pointer",
          }}
        >
          ðŸ›ï¸ Voltar para a loja
        </button>
      </div>
    );
  }

  // =====================================================
  // TELA MINHA CONTA
  // =====================================================

  return (
    <div className="valt-account-screen"
      style={{
        minHeight: "100vh",
        background: "#e0e0e0",
        padding: "30px 20px",
      }}
    >
      <section className="valt-account-favorites"><h2>â™¡ Seus favoritos</h2><p>Produtos salvos para esta conta neste navegador. A sincronizaÃ§Ã£o entre dispositivos estarÃ¡ disponÃ­vel apÃ³s a implantaÃ§Ã£o de autenticaÃ§Ã£o segura.</p><div className="valt-account-favorites-grid">{produtosFavoritos.length?produtosFavoritos.map((produto)=><button key={produto.id} onClick={()=>onAbrirProduto?.(produto)}>{produto.imagem&&<img src={obterUrlImagem(produto.imagem)} alt=""/>}<strong>{produto.nome}</strong><span>CVT {Number(produto.preco).toLocaleString("pt-BR",{minimumFractionDigits:2})}</span></button>):<p>VocÃª ainda nÃ£o salvou nenhum produto.</p>}</div></section>
      <div
        style={{
          maxWidth: "950px",
          margin: "0 auto",
        }}
      >

        {/* =================================================
            CABEÃ‡ALHO
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
            ðŸ‘¤ Minha Conta
          </h1>

          <button
            onClick={onVoltar}
            style={{
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            ðŸ›ï¸ Voltar para a loja
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
            ðŸ‘¤ Dados da conta
          </h2>

          <p>
            <strong>Nome:</strong>{" "}
            {usuario.nome}
          </p>

          <p>
            <strong>E-mail:</strong>{" "}
            {usuario.email}
          </p>

          <p className="valt-client-number"><strong>Seu nÃºmero de cliente:</strong> #{usuario.id} <small>Compartilhe este nÃºmero para receber 300 CVT quando um novo cliente indicado confirmar o e-mail.</small></p>
          <p>
            <strong>Saldo CVT:</strong>{" "}
            {Number(usuario.saldo_cvt || 0).toFixed(2)} CVT
          </p>
        </div>

        {/* =================================================
            BOTÃ•ES DA CONTA
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
            {/* COMPRAR CRÃ‰DITOS CVT */}

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
              ?? Comprar crÃ©ditos CVT
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
                ? "â³ Carregando..."
                : "ðŸ“¦ Ver meus pedidos"}
            </button>

            {/* ESPAÃ‡OS */}

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
                : "ðŸ  Meus EspaÃ§os"}
            </button>

            {/* SAIR */}

            <button
              onClick={onLogout}
              style={{
                padding: "12px 20px",
                cursor: "pointer",
              }}
            >
              ðŸšª Sair da conta
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
                ?? Comprar crÃ©ditos CVT
              </h3>

              <p>
                Escolha a quantidade de crÃ©ditos CVT que deseja comprar:
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
                  { quantidade: 5000, valor: 20 },
                  { quantidade: 10000, valor: 35 },
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
            ERRO DOS ESPAÃ‡OS
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
            MEUS ESPAÃ‡OS
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
              ðŸ  Meus EspaÃ§os
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
              ðŸ  Comprar nova casa
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
                  ðŸ  Escolha sua nova casa
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
                      alt="Casa MÃ©dia"
                      style={{
                        width: "110px",
                        height: "110px",
                        objectFit: "contain",
                        display: "block",
                        margin: "0 auto 6px",
                      }}
                    />
                    ðŸ  Casa MÃ©dia
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
                    ðŸ  Casa Grande
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
                      alt="MansÃ£o"
                      style={{
                        width: "110px",
                        height: "110px",
                        objectFit: "contain",
                        display: "block",
                        margin: "0 auto 6px",
                      }}
                    />
                    ðŸ  MansÃ£o
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
                VocÃª ainda nÃ£o possui espaÃ§os.
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
                    ðŸ  {espaco.nome}
                  </h3>
                  <button
                    onClick={() => {
                      setEspacoAberto(espaco);
                    }}
                    className="valt-enter-house"
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
                    ðŸ  Entrar na casa
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
                      ID do espaÃ§o:
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
                          ðŸŽ Figurinhas
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
              â† Voltar para Meus EspaÃ§os
            </button>

            <h2>
              ðŸ  {espacoAberto.nome}
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
              ðŸ  Figurinhas:{" "}
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
            {espacoAberto.presentes &&
              espacoAberto.presentes.length > 0 && (
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
                    🎁 Presentes recebidos
                  </h4>

                  {espacoAberto.presentes.map((presente) => (
                    <PresenteRecebido
                      key={presente.pedido_id}
                      pedidoId={presente.pedido_id}
                      destinatarioId={usuario.id}
                      presenteAberto={presente.presente_aberto}
                      embalagemPresente={presente.embalagem_presente}
                      itens={presente.itens}
                      mensagemPresente={presente.mensagem_presente}
                      remetenteNome={presente.remetente_nome}
                      onPresenteAberto={(presenteAtualizado) => {
                        setEspacoAberto((atual) => ({
                          ...atual,
                          presentes: atual.presentes.map((item) =>
                            item.pedido_id === presenteAtualizado.pedido_id
                              ? { ...item, ...presenteAtualizado }
                              : item
                          ),
                        }));
                      }}
                    />
                  ))}
                </div>
              )}
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
                    ðŸŽ Figurinhas das compras
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
                          onClick={() => { console.log('FIGURINHA SELECIONADA:', figurinha); setFigurinhaSelecionada(figurinha); }}
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
                <h3>{figurinhaSelecionada.exclusiva ? "â­ " : ""}{figurinhaSelecionada.nome}</h3>
                {figurinhaSelecionada.exclusiva&&<div style={{padding:12,background:"#fff3bf",borderRadius:8,marginBottom:12}}><strong>â­ Exclusiva â€” rende 3% do valor original toda quarta Ã s 00:00</strong>{ofertasExclusiva.length===0?<p>Nenhuma oferta pendente.</p>:ofertasExclusiva.map(o=><div key={o.oferta_id} style={{background:"#fff",padding:10,marginTop:8}}>{o.comprador_nome} ofereceu <strong>{Number(o.valor_oferta).toFixed(2)} CVT</strong><br/><button onClick={()=>responderExclusiva(o,true)}>Aceitar</button> <button onClick={()=>responderExclusiva(o,false)}>Recusar</button></div>)}</div>}

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
                  ðŸ—‘ï¸ Excluir
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
                  ðŸ·ï¸ Colocar Ã  venda
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
                  âŒ Cancelar
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
              ðŸ“¦ Meus Pedidos
            </h2>

            {notificacoesPedidos.length>0&&<div className="valt-order-notices" role="status" aria-live="polite"><div className="valt-order-notices-head"><strong>AtualizaÃ§Ãµes recentes</strong><button type="button" onClick={()=>setNotificacoesPedidos([])}>Dispensar</button></div>{notificacoesPedidos.map(n=><p key={n.id}>{n.texto}</p>)}</div>}
            {pedidos.length === 0 ? (
              <p>
                VocÃª ainda nÃ£o possui
                pedidos.
              </p>
            ) : (
              pedidos.map((pedido) => {
                const aberto =
                  pedidoAberto === pedido.pedido_id;

                const etapaAtual = obterEtapaPedido(pedido.status);
                const etapasPedido=["Pago","Preparando","Enviado","A caminho","Entregue"];
                const etapaIndice=etapasPedido.findIndex(etapa=>etapa.toLowerCase()===String(pedido.status||"").toLowerCase());

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
                    <div className="valt-order-timeline" aria-label={`Andamento do pedido: ${pedido.status}`}>{String(pedido.status||"").toLowerCase()==="cancelado"?<strong className="valt-order-cancelled">Pedido cancelado</strong>:etapasPedido.map((etapa,i)=><div key={etapa} className={i<=etapaIndice?"done":""}><span>{i<etapaIndice?"âœ“":i+1}</span><small>{etapa}</small></div>)}</div>
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
                          ðŸ“¦ Pedido #{pedido.pedido_id}
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
                          ðŸ“¦ Acompanhamento do pedido
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
                                      VocÃª estÃ¡ aqui
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
                            ? "ðŸ”½ Ocultar detalhes"
                            : "ðŸ”Ž Ver detalhes"}
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
                            ðŸšš Entrega
                          </h4>

                          <p>
                            <strong>Prazo de entrega:</strong>{" "}
                            {pedido.prazo_entrega} dias
                          </p>

                          <p>
                            <strong>Data do pedido:</strong>{" "}
                            {pedido.data_pedido
                              ? new Date(pedido.data_pedido).toLocaleString("pt-BR")
                              : "NÃ£o informado"}
                          </p>

                          <p>
                            <strong>Entrega prevista:</strong>{" "}
                            {pedido.data_entrega_prevista
                              ? new Date(
                                pedido.data_entrega_prevista
                              ).toLocaleString("pt-BR")
                              : "NÃ£o informado"}
                          </p>
                        </div>

                        {/* PRODUTOS */}

                        <h4>
                          ðŸ›ï¸ Produtos
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
                                              "ðŸ›ï¸";

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
                                        ðŸ›ï¸
                                      </span>
                                    )}
                                  </div>

                                  {/* INFORMAÃ‡Ã•ES */}

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
                                      ðŸ”¢ Quantidade:{" "}
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
                                      ðŸ’µ PreÃ§o unitÃ¡rio:{" "}
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
                                      ðŸ’° Subtotal:{" "}
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
            ðŸ›ï¸ Voltar para a loja
          </button>
        </div>
      </div>
    </div>
  );
}

export default MinhaConta;






