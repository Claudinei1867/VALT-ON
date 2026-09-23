import { useEffect, useState } from "react";

import "./App.css";

import Admin from "./Admin";
import Login from "./Login";
import Cadastro from "./Cadastro";
import MinhaConta from "./MinhaConta";
import ProdutoDetalhes from "./ProdutoDetalhes";
import RedefinirSenha from "./RedefinirSenha";
import ProdutosUsados from "./pages/ProdutosUsados";
import BotoesNavegacao from "./components/BotoesNavegacao";

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
// APP
// =====================================================

function App() {
  // =====================================================
  // ESTADOS

  const [produtos, setProdutos] = useState([]);

  const [carregando, setCarregando] = useState(true);

  const [erro, setErro] = useState("");

  const [categoria, setCategoria] = useState("Todos");

  const [pesquisa, setPesquisa] = useState("");

  const [carrinho, setCarrinho] = useState([]);

  const [mostrarCarrinho, setMostrarCarrinho] =
    useState(false);

  const [mostrarProdutosUsados, setMostrarProdutosUsados] =
    useState(false);

  const [produtosUsados, setProdutosUsados] =
    useState([]);

  const [carregandoProdutosUsados, setCarregandoProdutosUsados] =
    useState(false);

  const [produtoUsadoSelecionado, setProdutoUsadoSelecionado] =
    useState(null);

  const [espacoUsadoSelecionado, setEspacoUsadoSelecionado] =
    useState("");

  const [espacoOfertaSelecionado, setEspacoOfertaSelecionado] =
    useState("");

  const [produtoUsadoOfertaSelecionado, setProdutoUsadoOfertaSelecionado] =
    useState(null);

  const [valorOfertaUsado, setValorOfertaUsado] =
    useState("");
  const [ofertasRecebidasUsados, setOfertasRecebidasUsados] =
    useState([]);




  const [mostrarAdmin, setMostrarAdmin] =
    useState(false);

  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [mostrarLogin, setMostrarLogin] =
    useState(false);

  const [mostrarConta, setMostrarConta] =
    useState(false);

  const [mostrarSugestoes, setMostrarSugestoes] =
    useState(false);

  const [sugestaoNome, setSugestaoNome] =
    useState("");

  const [sugestaoEmail, setSugestaoEmail] =
    useState("");

  const [sugestaoTipo, setSugestaoTipo] =
    useState("Sugestão");

  const [sugestaoMensagem, setSugestaoMensagem] =
    useState("");

  const [usuario, setUsuario] = useState(null)

  const [espacos, setEspacos] = useState([]);

  const [espacoSelecionado, setEspacoSelecionado] =
    useState("");

  const [produtoSelecionado, setProdutoSelecionado] =
    useState(null);

  const [quantidadeDetalhes, setQuantidadeDetalhes] =
    useState(1);

  // =====================================================
  // RECUPERAR USUARIO SALVO
  // =====================================================

  useEffect(() => {
    const usuarioSalvo =
      localStorage.getItem("usuario");

    if (usuarioSalvo) {
      try {
        const dados =
          JSON.parse(usuarioSalvo);

        setUsuario(dados);

        console.log(
          "USUÁRIO RECUPERADO:",
          dados
        );
      } catch (error) {
        console.error(
          "Erro ao recuperar usuário:",
          error
        );

        localStorage.removeItem("usuario");
      }
    }
  }, []);

  // =====================================================
  // CARREGAR ESPAÇOS DO USUÁRIO
  // =====================================================

  useEffect(() => {
    const carregarEspacos = async () => {
      if (!usuario || !usuario.id) {
        return;
      }

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
          "ESPAÇOS PARA COMPRA:",
          dados
        );

        setEspacos(dados);

        // Selecionar automaticamente o primeiro espaço
        if (dados.length > 0) {
          setEspacoSelecionado(String(dados[0].id));
        }
      } catch (error) {
        console.error(
          "ERRO AO CARREGAR ESPAÇOS:",
          error
        );

        setEspacos([]);
        setEspacoSelecionado("");
      }
    };

    carregarEspacos();
  }, [usuario]);

  // =====================================================
  // CARREGAR PRODUTOS
  // =====================================================

  const carregarProdutos = async () => {
    setCarregando(true);

    try {
      const resposta = await fetch(
        `${API_URL}/produtos`
      );

      if (!resposta.ok) {
        throw new Error(
          "Erro ao carregar produtos"
        );
      }

      const dados =
        await resposta.json();

      console.log(
        "PRODUTOS RECEBIDOS:",
        dados
      );

      setProdutos(dados);
      setErro("");
    } catch (error) {
      console.error(
        "ERRO AO CARREGAR PRODUTOS:",
        error
      );

      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setCarregando(false);
    }
  };

  // =====================================================
  // CARREGAR PRODUTOS USADOS
  // =====================================================

  const carregarProdutosUsados = async () => {
    setCarregandoProdutosUsados(true);

    try {
      const resposta = await fetch(
        `${API_URL}/produtos-usados`
      );

      if (!resposta.ok) {
        throw new Error(
          "Erro ao carregar produtos usados"
        );
      }

      const dados =
        await resposta.json();

      console.log(
        "PRODUTOS USADOS RECEBIDOS:",
        dados
      );

      setProdutosUsados(dados);
    } catch (error) {
      console.error(
        "ERRO AO CARREGAR PRODUTOS USADOS:",
        error
      );

      setProdutosUsados([]);
    } finally {
      setCarregandoProdutosUsados(false);
    }
  };

  // =====================================================
  // CARREGAR PRODUTOS AO ABRIR
  // =====================================================

  useEffect(() => {
    carregarProdutos();
  }, []);

  // =====================================================
  // CARREGAR OFERTAS RECEBIDAS DE PRODUTOS USADOS
  // =====================================================

  const carregarOfertasRecebidasUsados = async () => {
    if (!usuario || !usuario.id) {
      return;
    }

    try {
      const resposta = await fetch(
        `${API_URL}/produtos-usados/ofertas/${usuario.id}`
      );

      if (!resposta.ok) {
        throw new Error(
          "Erro ao carregar ofertas recebidas."
        );
      }

      const dados =
        await resposta.json();

      console.log(
        "OFERTAS RECEBIDAS DE PRODUTOS USADOS:",
        dados
      );

      setOfertasRecebidasUsados(dados);
    } catch (error) {
      console.error(
        "ERRO AO CARREGAR OFERTAS RECEBIDAS:",
        error
      );

      setOfertasRecebidasUsados([]);
    }
  };

  useEffect(() => {
    carregarOfertasRecebidasUsados();
  }, [usuario]);

  // LOGIN REALIZADO
  // =====================================================

  const loginRealizado = (dadosUsuario) => {
    console.log(
      "USUÁRIO LOGADO",
      dadosUsuario
    );

    setUsuario(dadosUsuario);

    localStorage.setItem(
      "usuario",
      JSON.stringify(dadosUsuario)
    );

    setMostrarLogin(false);

    setMostrarConta(true);
  };

  // =====================================================
  // SAIR DA CONTA
  // =====================================================

  const sairDaConta = () => {
    console.log(
      "SAINDO DA CONTA..."
    );

    setUsuario(null);

    setMostrarConta(false);

    setMostrarLogin(false);

    setMostrarCarrinho(false);

    localStorage.removeItem(
      "usuario"
    );

    alert(
      "Você saiu da sua conta. "
    );
  };

  // =====================================================
  // FILTRO POR CATEGORIA
  // =====================================================

  const produtosFiltrados = produtos.filter(
    (produto) => {
      const correspondeCategoria =
        categoria === "Todos" ||
        produto.categoria === categoria;

      const correspondePesquisa =
        produto.nome
          .toLowerCase()
          .includes(

            pesquisa.trim().toLowerCase()
          );

      return (
        correspondeCategoria &&
        correspondePesquisa
      );
    }
  );

  // =====================================================
  // ADICIONAR AO CARRINHO
  // =====================================================

  const adicionarCarrinho = (produto) => {
    if (produto.estoque <= 0) {
      alert(
        "Produto sem estoque."
      );

      return;
    }

    setCarrinho(
      (carrinhoAtual) => {
        const produtoExistente =
          carrinhoAtual.find(
            (item) =>
              item.id === produto.id
          );

        if (produtoExistente) {
          if (
            produtoExistente.quantidade >=
            produto.estoque
          ) {
            alert(
              `Quantidade máxima disponível: ${produto.estoque}`
            );

            return carrinhoAtual;
          }

          return carrinhoAtual.map(
            (item) =>
              item.id === produto.id
                ? {
                  ...item,
                  quantidade:
                    item.quantidade + 1,
                }
                : item
          );
        }

        return [
          ...carrinhoAtual,
          {
            ...produto,
            quantidade: 1,
          },
        ];
      }
    );

    alert("✅ Produto adicionado ao carrinho!");
  };

  // =====================================================
  // ABRIR DETALHES DO PRODUTO
  // =====================================================

  const abrirDetalhesProduto = (produto) => {
    setProdutoSelecionado(produto);
    setQuantidadeDetalhes(1);
  };

  // =====================================================
  // REMOVER DO CARRINHO
  // =====================================================

  const removerCarrinho = (id) => {
    setCarrinho(
      (carrinhoAtual) =>
        carrinhoAtual.filter(
          (item) =>
            item.id !== id
        )
    );
  };

  // =====================================================
  // AUMENTAR QUANTIDADE
  // =====================================================

  const aumentarQuantidade = (id) => {
    setCarrinho(
      (carrinhoAtual) =>
        carrinhoAtual.map(
          (item) => {
            if (item.id !== id) {
              return item;
            }

            if (
              item.quantidade >=
              item.estoque
            ) {
              alert(
                `Quantidade máxima disponível: ${item.estoque}`
              );

              return item;
            }

            return {
              ...item,
              quantidade:
                item.quantidade + 1,
            };
          }
        )
    );
  };

  // =====================================================
  // DIMINUIR QUANTIDADE
  // =====================================================

  const diminuirQuantidade = (id) => {
    setCarrinho(
      (carrinhoAtual) =>
        carrinhoAtual
          .map(
            (item) =>
              item.id === id
                ? {
                  ...item,
                  quantidade:
                    item.quantidade - 1,
                }
                : item
          )
          .filter(
            (item) =>
              item.quantidade > 0
          )
    );
  };

  // =====================================================
  // TOTAL DO CARRINHO
  // =====================================================

  const totalCarrinho =
    carrinho.reduce(
      (total, item) =>
        total +
        Number(item.preco) *
        item.quantidade,
      0
    );

  // =====================================================
  // QUANTIDADE NO CARRINHO
  // =====================================================

  const quantidadeCarrinho =
    carrinho.reduce(
      (total, item) =>
        total + item.quantidade,
      0
    );


  // =====================================================
  // FINALIZAR COMPRA
  // =====================================================

  const finalizarCompra = async () => {
    // Verificar se está logado
    if (!usuario || !usuario.id) {
      alert("❌ Você precisa estar logado para finalizar a compra.");
      return;
    }

    // Verificar carrinho
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }

    // Verificar espaço selecionado
    if (!espacoSelecionado) {
      alert("❌ Selecione um espaço para realizar a compra.");
      return;
    }

    try {
      // ---------------------------------------------------
      // PREPARAR ITENS DA COMPRA
      // ---------------------------------------------------
      const itensCompra = carrinho.map((item) => ({
        produto_id: item.id,
        quantidade: item.quantidade,
      }));

      // ---------------------------------------------------
      // ENVIAR CLIENTE + ITENS PARA O BACKEND
      // ---------------------------------------------------


      const dadosCompra = {
        cliente_id: usuario.id,
        espaco_id: espacoSelecionado,
        itens: itensCompra,
      };

      console.log("USUÁRIO DA COMPRA:", usuario);
      console.log("ENVIANDO COMPRA:", dadosCompra);

      const resposta = await fetch(
        `${API_URL}/finalizar-compra`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dadosCompra),
        }
      );

      const dados = await resposta.json();

      console.log("RESPOSTA DA COMPRA:", dados);

      // ---------------------------------------------------
      // VERIFICAR ERRO DO BACKEND
      // ---------------------------------------------------
      if (!resposta.ok) {
        throw new Error(
          dados.detail || "Erro ao finalizar compra."
        );
      }

      // ATUALIZAR SALDO DO USUÁRIO APÓS A COMPRA
      const usuarioAtualizado = {
        ...usuario,
        saldo_cvt: Number(dados.saldo_cvt),
      };

      setUsuario(usuarioAtualizado);

      localStorage.setItem(
        "usuario",
        JSON.stringify(usuarioAtualizado)
      );

      // ---------------------------------------------------
      // COMPRA REALIZADA
      // ---------------------------------------------------
      alert(
        `✅ Compra realizada com sucesso!\n\n` +
        `📦 Pedido: #${dados.pedido_id}\n` +
        `👤 Cliente: ${usuario.nome}\n` +
        `💰 Total: CVT ${Number(dados.total).toFixed(2)}`
      );

      // ---------------------------------------------------
      // LIMPAR CARRINHO
      // ---------------------------------------------------
      setCarrinho([]);

      // Fechar carrinho
      setMostrarCarrinho(false);

      // ---------------------------------------------------
      // RECARREGAR PRODUTOS
      // ---------------------------------------------------
      carregarProdutos();

    } catch (error) {
      console.error(
        "ERRO AO FINALIZAR COMPRA:",
        error
      );

      alert(
        `❌ ${error.message || "Não foi possível finalizar a compra."}`
      );
    }
  };
  // =====================================================
  // TELA ADMINISTRADOR
  // =====================================================

  if (mostrarAdmin) {
    return (
      <div>
        <Admin usuario={usuario} onVoltar={() => {
          setMostrarAdmin(false);
          carregarProdutos();
        }} />

        <div
          style={{
            textAlign: "center",
            padding: "20px",
          }}
        >
          <button
            onClick={() => {
              setMostrarAdmin(false);

              carregarProdutos();
            }}
            style={{
              padding: "12px 25px",
              cursor: "pointer",
            }}
          >
            ← Voltar para a loja
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // TELA DE RECUPERAÇÃO DE SENHA
  // =====================================================

  if (
    window.location.pathname ===
    "/recuperar-senha"
  ) {
    return (
      <RedefinirSenha
        onVoltar={() => {
          window.location.href = "/";
        }}
      />
    );
  }

  // =====================================================
  // TELA DE LOGIN
  // =====================================================

  if (mostrarLogin) {
    return (
      <Login
        onLogin={loginRealizado}
        onVoltar={() => setMostrarLogin(false)}
      />
    );
  }

  // =====================================================
  // TELA DE CADASTRO
  // =====================================================

  if (mostrarCadastro) {
    return (
      <Cadastro
        onCadastroSucesso={() => {
          setMostrarCadastro(false);
          setMostrarLogin(true);
        }}
        onVoltar={() => setMostrarCadastro(false)}
      />
    );
  }

  // =====================================================
  // TELA PRODUTOS USADOS
  // =====================================================

  if (mostrarProdutosUsados) {
    return (
      <ProdutosUsados
        usuario={usuario}
        espacos={espacos}
        produtoUsadoSelecionado={produtoUsadoSelecionado}
        setProdutoUsadoSelecionado={setProdutoUsadoSelecionado}
        espacoUsadoSelecionado={espacoUsadoSelecionado}
        setEspacoUsadoSelecionado={setEspacoUsadoSelecionado}
        espacoOfertaSelecionado={espacoOfertaSelecionado}
        setEspacoOfertaSelecionado={setEspacoOfertaSelecionado}
        produtoUsadoOfertaSelecionado={produtoUsadoOfertaSelecionado}
        setProdutoUsadoOfertaSelecionado={setProdutoUsadoOfertaSelecionado}
        valorOfertaUsado={valorOfertaUsado}
        setValorOfertaUsado={setValorOfertaUsado}
        carregandoProdutosUsados={carregandoProdutosUsados}
        produtosUsados={produtosUsados}
        ofertasRecebidasUsados={ofertasRecebidasUsados}
        API_URL={API_URL}
        obterUrlImagem={obterUrlImagem}
        carregarProdutosUsados={carregarProdutosUsados}
        setMostrarProdutosUsados={setMostrarProdutosUsados}
      />
    );
  }
  // =====================================================
  // TELA MINHA CONTA
  // =====================================================

  if (mostrarConta) {
    return (
      <MinhaConta
        usuario={usuario}
        onAtualizarUsuario={(novoSaldo) => {
          const usuarioAtualizado = {
            ...usuario,
            saldo_cvt: Number(novoSaldo),
          };

          setUsuario(usuarioAtualizado);

          localStorage.setItem(
            "usuario",
            JSON.stringify(usuarioAtualizado)
          );
        }}
        onVoltar={() => {
          setMostrarConta(false);
        }}
        onLogout={sairDaConta}
      />
    );
  }

  // =====================================================
  // TELA DETALHES DO PRODUTO
  // =====================================================

  if (produtoSelecionado) {
    return (
      <ProdutoDetalhes
        produto={produtoSelecionado}
        quantidade={quantidadeDetalhes}
        setQuantidade={setQuantidadeDetalhes}
        onVoltar={() => {
          setProdutoSelecionado(null);
          setQuantidadeDetalhes(1);
        }}
        onComprar={() => {
          for (let i = 0; i < quantidadeDetalhes; i++) {
            adicionarCarrinho(produtoSelecionado);
          }
          setProdutoSelecionado(null);
          setQuantidadeDetalhes(1);
        }}
        obterUrlImagem={obterUrlImagem}
      />
    );
  }

  // =====================================================
  // TELA DA LOJA
  // =====================================================

  if (mostrarConta) {
    return (
      <MinhaConta
        usuario={usuario}

        onVoltar={() => {
          setMostrarConta(false);
        }}

        onLogout={sairDaConta}
      />
    );
  }

  // =====================================================
  // TELA DETALHES DO PRODUTO
  // =====================================================

  if (produtoSelecionado) {
    // ...
  }

  // =====================================================
  // TELA DA LOJA
  // =====================================================

  const enviarSugestao = async () => {
    if (
      !sugestaoNome.trim() ||
      !sugestaoEmail.trim() ||
      !sugestaoMensagem.trim()
    ) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const resposta = await fetch(`${API_URL}/sugestoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente_id: usuario?.id ?? null,
          nome: sugestaoNome,
          email: sugestaoEmail,
          tipo: sugestaoTipo,
          mensagem: sugestaoMensagem,
        }),
      });

      if (!resposta.ok) {
        throw new Error("Erro ao enviar sugestão.");
      }

      alert("Sugestão enviada com sucesso!");

      setSugestaoNome("");
      setSugestaoEmail("");
      setSugestaoTipo("Sugestão");
      setSugestaoMensagem("");
      setMostrarSugestoes(false);
    } catch (erro) {
      alert("Não foi possível enviar a sugestão.");
      console.error(erro);
    }
  };

  return (
    <div>
      {/* =================================================
          HEADER
      ================================================= */}

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          padding: "8px",
          borderBottom:
            "1px solid #ddd",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <h1>
          <img
            src="/logo-valt-on.png"
            alt="VALT-ON"
            className="logo-valt-on"
          />
        </h1>

        <div
          className="navegacao-topo"
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* BUSCA */}

          <input
            type="text"
            placeholder="🔎 Pesquisar produto..."
            value={pesquisa}
            onChange={(e) =>
              setPesquisa(e.target.value)
            }
            style={{
              padding: "10px 14px",
              fontSize: "16px",
              backgroundColor: "#e0e0e0",
              border: "1px solid #000",
              color: "#000",
              borderRadius: "6px",
              width: "220px",
            }}
          />

          <BotoesNavegacao
            usuario={usuario}
            setMostrarConta={setMostrarConta}
            setMostrarLogin={setMostrarLogin}
            setMostrarCadastro={setMostrarCadastro}
            setMostrarAdmin={setMostrarAdmin}
            mostrarProdutosUsados={mostrarProdutosUsados}
            setMostrarProdutosUsados={setMostrarProdutosUsados}
            carregarProdutosUsados={carregarProdutosUsados}
            setMostrarSugestoes={setMostrarSugestoes}
            mostrarCarrinho={mostrarCarrinho}
            setMostrarCarrinho={setMostrarCarrinho}
            quantidadeCarrinho={quantidadeCarrinho}
            categoria={categoria}
            setCategoria={setCategoria}
          />
        </div>
      </header >

      {mostrarSugestoes && (
        <div
          style={{
            padding: "30px 20px",
            backgroundColor: "#e0e0e0",
            minHeight: "400px",
          }}
        >
          <div
            style={{
              maxWidth: "700px",
              margin: "0 auto",
              backgroundColor: "#fff",
              padding: "25px",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#000",
              }}
            >
              💡 Sugestões
            </h2>

            <p>
              Envie sua sugestão, informe um problema ou conte
              para nós como podemos melhorar a VALT-ON.
            </p>

            <label>Nome</label>

            <input
              type="text"
              placeholder="Seu nome"
              value={sugestaoNome}
              onChange={(e) => setSugestaoNome(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "15px",
                boxSizing: "border-box",
              }}
            />

            <label>E-mail</label>

            <input
              type="email"
              placeholder="Seu e-mail"
              value={sugestaoEmail}
              onChange={(e) => setSugestaoEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "15px",
                boxSizing: "border-box",
              }}
            />

            <label>Tipo</label>

            <select
              value={sugestaoTipo}
              onChange={(e) => setSugestaoTipo(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "15px",
                boxSizing: "border-box",
              }}
            >
              <option>Sugestão</option>
              <option>Problema/erro</option>
              <option>Melhoria</option>
              <option>Outro</option>
            </select>

            <label>Mensagem</label>

            <textarea
              placeholder="Digite sua mensagem..."
              value={sugestaoMensagem}
              onChange={(e) => setSugestaoMensagem(e.target.value)}
              rows="6"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "20px",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setMostrarSugestoes(false)}
                style={{
                  padding: "10px 18px",
                  backgroundColor: "#777",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>

              <button
                onClick={enviarSugestao}
                style={{
                  padding: "10px 18px",
                  backgroundColor: "#000",
                  color: "#fff",
                  border: "1px solid #000",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                📤 Enviar sugestão
              </button>
            </div>
          </div>
        </div>
      )}



      {/* =================================================
          BANNER
      ================================================= */}

      < section
        style={{
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            color: "#222",
            fontSize: "30px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          Bem-vindo à VALT-ON
        </h2>

        <p
          style={{
            color: "#444",
            fontSize: "18px",
            fontWeight: "500",
          }}
        >
          Encontre os melhores
          produtos em um só lugar.
        </p>

        <button
          onClick={() => {
            window.scrollTo({
              top: 500,
              behavior: "smooth",
            });
          }}
        >
          Comprar agora
        </button>
      </section >

      {/* =================================================
          PRODUTOS
      ================================================= */}

      < main
        style={{
          padding: "20px",
        }}
      >
        <h2
          style={{
            color: "#222",
            fontSize: "28px",
            fontWeight: "700",
            marginBottom: "20px",
          }}
        >
          Produtos em destaque
        </h2>

        {
          carregando && (
            <p>
              Carregando produtos...
            </p>
          )
        }

        {
          erro && (
            <p
              style={{
                color: "red",
              }}
            >
              {erro}
            </p>
          )
        }

        {
          !carregando &&
          !erro &&
          produtosFiltrados.length ===
          0 && (
            <p>
              Nenhum produto encontrado
              nesta categoria.
            </p>
          )
        }

        <div
          className="produtos-grid"
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          {produtosFiltrados.map(
            (produto) => (
              <div
                key={produto.id}
                onClick={() => abrirDetalhesProduto(produto)}
                style={{
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    "10px",
                  padding: "20px",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                {/* IMAGEM */}

                <div
                  style={{
                    textAlign:
                      "center",
                    marginBottom:
                      "5px",
                  }}
                >
                  {produto.imagem ? (
                    <img
                      src={obterUrlImagem(
                        produto.imagem
                      )}
                      alt={produto.nome}
                      onError={(
                        evento
                      ) => {
                        evento.currentTarget.style.display =
                          "none";
                      }}
                      style={{
                        width: "100%",
                        height: "90px",
                        objectFit:
                          "contain",
                        borderRadius:
                          "8px",
                        transform: "scale(1.2)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        fontSize:
                          "50px",
                        textAlign:
                          "center",
                        height:
                          "100px",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                      }}
                    >
                      🖼️
                    </div>
                  )}
                </div>

                {/* NOME */}

                <h3
                  style={{
                    fontSize: "14px",
                    margin: "8px 0",
                  }}
                >
                  {produto.nome}
                </h3>

                {/* PREÇO */}

                <h3
                  style={{
                    fontSize: "14px",
                    margin: "8px 0 12px 0",
                  }}
                >
                  CVT{" "}
                  {Number(
                    produto.preco
                  ).toFixed(2)}
                </h3>

                {/* COMPRAR */}

                <button
                  onClick={(evento) => {
                    evento.stopPropagation();

                    adicionarCarrinho(
                      produto
                    );
                  }}
                  disabled={
                    produto.estoque <=
                    0
                  }
                  style={{
                    cursor:
                      produto.estoque > 0
                        ? "pointer"
                        : "not-allowed",
                    fontSize: "24px",
                  }}
                >
                  {produto.estoque >
                    0
                    ? "🛒 Comprar"
                    : "Sem estoque"}
                </button>
              </div>
            )
          )}
        </div>
      </main >

      {/* =================================================
          CARRINHO
      ================================================= */}

      {
        mostrarCarrinho && (
          <div
            style={{
              position: "fixed",
              right: "20px",
              top: "80px",
              width: "350px",
              maxWidth: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              background: "white",
              border:
                "1px solid #ccc",
              borderRadius:
                "10px",
              padding: "20px",
              boxShadow:
                "0 4px 15px rgba(0,0,0,0.2)",
              zIndex: 1000,
            }}
          >
            <h2>
              🛒 Meu Carrinho
            </h2>

            {carrinho.length ===
              0 ? (
              <p>
                Seu carrinho está
                vazio.
              </p>
            ) : (
              <>
                {carrinho.map(
                  (item) => (
                    <div
                      key={item.id}
                      style={{
                        borderBottom:
                          "1px solid #ddd",
                        padding:
                          "10px 0",
                      }}
                    >
                      <strong>
                        {item.nome}
                      </strong>

                      <p>
                        CVT{" "}
                        {Number(
                          item.preco
                        ).toFixed(2)}
                      </p>

                      <div>
                        <button
                          onClick={() =>
                            diminuirQuantidade(
                              item.id
                            )
                          }
                        >
                          −
                        </button>

                        <span
                          style={{
                            margin:
                              "0 10px",
                          }}
                        >
                          {
                            item.quantidade
                          }
                        </span>

                        <button
                          onClick={() =>
                            aumentarQuantidade(
                              item.id
                            )
                          }
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          removerCarrinho(
                            item.id
                          )
                        }
                        style={{
                          marginTop:
                            "8px",
                        }}
                      >
                        🗑️ Remover
                      </button>
                    </div>
                  )
                )}

                {/* ESPAÇO DA COMPRA */}
                <div
                  style={{
                    marginTop: "15px",
                    marginBottom: "15px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    Escolha o espaço para esta compra:
                  </label>

                  <select
                    value={espacoSelecionado}
                    onChange={(e) =>
                      setEspacoSelecionado(e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      fontSize: "16px",
                    }}
                  >
                    <option value="">
                      Selecione um espaço
                    </option>

                    {espacos.map((espaco) => (
                      <option
                        key={espaco.id}
                        value={espaco.id}
                      >
                        {espaco.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TOTAL */}
                <h3>
                  Total: CVT{" "}
                  {totalCarrinho.toFixed(
                    2
                  )}
                </h3>

                {/* FINALIZAR */}

                <button
                  onClick={
                    finalizarCompra
                  }
                  style={{
                    padding:
                      "12px 20px",
                    cursor:
                      "pointer",
                    marginTop:
                      "10px",
                    fontWeight:
                      "bold",
                    width: "100%",
                  }}
                >
                  💳 Finalizar compra
                </button>
              </>
            )}

            {/* FECHAR */}

            <button
              onClick={() =>
                setMostrarCarrinho(
                  false
                )
              }
              style={{
                marginTop: "10px",
                width: "100%",
              }}
            >
              Fechar
            </button>
          </div>
        )
      }
    </div >
  );
}

export default App;
