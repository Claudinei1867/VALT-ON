import { useEffect, useRef, useState } from "react";

import "./App.css";
import "./modernizacao.css";
import "./ajustes-visuais-seguros.css";
import "./tema-v6-commerce.css";
import "./correcoes-v6-contraste.css";
import "./tema-v7-pastel.css";

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
  const [favoritos,setFavoritos]=useState([]);
  const [favoritosCarregados,setFavoritosCarregados]=useState(false);
  const [usuarioFavoritos,setUsuarioFavoritos]=useState(null);
  // Favoritos ficam isolados por conta neste navegador. Sincronização remota exige sessão autenticada.
  useEffect(()=>{
    const chave=usuarioFavoritos ? `valt-favoritos-cliente-${usuarioFavoritos}` : "valt-favoritos-anonimos";
    try {const dados=JSON.parse(localStorage.getItem(chave)||"[]");setFavoritos(Array.isArray(dados)?dados:[]);}catch{setFavoritos([]);}
    setFavoritosCarregados(true);
  },[usuarioFavoritos]);
  useEffect(()=>{
    if(!favoritosCarregados)return;
    const chave=usuarioFavoritos ? `valt-favoritos-cliente-${usuarioFavoritos}` : "valt-favoritos-anonimos";
    try{localStorage.setItem(chave,JSON.stringify(favoritos));}catch(erro){console.warn("Favoritos não salvos",erro);}
  },[favoritos,favoritosCarregados,usuarioFavoritos]);
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);
  const [ordenacao, setOrdenacao] = useState("destaques");
  const [precoMinimo,setPrecoMinimo]=useState("");
  const [precoMaximo,setPrecoMaximo]=useState("");
  const [apenasDisponiveis,setApenasDisponiveis]=useState(false);
  const formatarCVT = (valor) => `CVT ${Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const categoriasDisponiveis = ["Todos", ...new Set(produtos.map((produto) => produto.categoria).filter(Boolean))];
  const alternarFavorito = (id) => setFavoritos((atual) => atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id]);

  const [carrinho, setCarrinho] = useState([]);

  const [mostrarCarrinho, setMostrarCarrinho] =
    useState(false);

  const posicaoScrollVitrine = useRef(null);
  // Congela a vitrine sob o drawer e restaura a posição no fechamento.
  useEffect(() => {
    if (!mostrarCarrinho) return;
    const y = window.scrollY;
    const body = document.body;
    const anterior = {position:body.style.position,top:body.style.top,left:body.style.left,right:body.style.right,width:body.style.width};
    Object.assign(body.style,{position:"fixed",top:`-${y}px`,left:"0",right:"0",width:"100%"});
    return () => {Object.assign(body.style,anterior);window.scrollTo({top:y,behavior:"instant"});};
  },[mostrarCarrinho]);

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

  useEffect(() => {
    if (produtoSelecionado || mostrarConta || mostrarAdmin || mostrarLogin || mostrarCadastro || mostrarProdutosUsados) return;
    if (posicaoScrollVitrine.current !== null) {const y=posicaoScrollVitrine.current;posicaoScrollVitrine.current=null;requestAnimationFrame(()=>window.scrollTo({top:y,behavior:"instant"}));}
  },[produtoSelecionado,mostrarConta,mostrarAdmin,mostrarLogin,mostrarCadastro,mostrarProdutosUsados]);

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
        setFavoritosCarregados(false);
        setUsuarioFavoritos(dados.id || null);

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
    setFavoritosCarregados(false);
    setUsuarioFavoritos(dadosUsuario.id || null);

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
    setFavoritosCarregados(false);
    setUsuarioFavoritos(null);

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

      return correspondeCategoria && correspondePesquisa && (!mostrarFavoritos || favoritos.includes(produto.id)) && (precoMinimo==="" || Number(produto.preco)>=Number(precoMinimo)) && (precoMaximo==="" || Number(produto.preco)<=Number(precoMaximo)) && (!apenasDisponiveis || Number(produto.estoque)>0);
    }
  );

  const produtosOrdenados = [...produtosFiltrados].sort((a, b) => {
    if (ordenacao === "menor-preco") return Number(a.preco) - Number(b.preco);
    if (ordenacao === "maior-preco") return Number(b.preco) - Number(a.preco);
    if (ordenacao === "nome") return a.nome.localeCompare(b.nome, "pt-BR");
    return 0;
  });

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

    setMostrarCarrinho(true);
  };

  // =====================================================
  // ABRIR DETALHES DO PRODUTO
  // =====================================================

  const abrirDetalhesProduto = (produto) => {
    if (!produtoSelecionado) posicaoScrollVitrine.current = window.scrollY;
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

  const [finalizandoCompra, setFinalizandoCompra] = useState(false);
  const finalizarCompra = async () => {
    if (finalizandoCompra) return;
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

    setFinalizandoCompra(true);
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
        `💰 Total: ${formatarCVT(dados.total)}`
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
    } finally {setFinalizandoCompra(false);}
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
              backgroundColor: "#e0e0e0",
              color: "#000000",
              border: "2px solid #000000",
              borderRadius: "8px",
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
        produtosFavoritos={produtos.filter((item)=>favoritos.includes(item.id))}
        onAbrirProduto={(produto)=>{setMostrarConta(false);abrirDetalhesProduto(produto);}}
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
          const quantidade=Math.min(Math.max(1,quantidadeDetalhes),Number(produtoSelecionado.estoque));
          if(quantidade<=0)return;
          setCarrinho((atual)=>{const existente=atual.find((item)=>item.id===produtoSelecionado.id);const total=Math.min(Number(produtoSelecionado.estoque),(existente?.quantidade||0)+quantidade);return existente?atual.map((item)=>item.id===produtoSelecionado.id?{...item,quantidade:total}:item):[...atual,{...produtoSelecionado,quantidade:total}];});
          setProdutoSelecionado(null);setQuantidadeDetalhes(1);setMostrarCarrinho(true);
        }}
        relacionados={produtos.filter((item)=>item.id!==produtoSelecionado.id&&item.categoria===produtoSelecionado.categoria).slice(0,4)}
        onVerRelacionado={(produto)=>{setProdutoSelecionado(produto);setQuantidadeDetalhes(1);window.scrollTo({top:0,behavior:"smooth"});}}
        favorito={favoritos.includes(produtoSelecionado.id)}
        onAlternarFavorito={()=>alternarFavorito(produtoSelecionado.id)}
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
    <div className="valt-store">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="valt-header"
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
            className="valt-search"
            aria-label="Pesquisar produtos"
            type="search"
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
        <div className="valt-suggestion-screen"
          style={{
            padding: "30px 20px",
            backgroundColor: "#e0e0e0",
            minHeight: "400px",
          }}
        >
          <div className="valt-suggestion-card"
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



      <div className="valt-benefits" aria-label="Diferenciais da loja">
        <span>✦ Curadoria de produtos</span><span>◈ Compra com créditos CVT</span><span>♡ Seus favoritos em um só lugar</span>
      </div>

      {/* =================================================
          BANNER
      ================================================= */}

      <section className="valt-hero"
        style={{
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <div className="valt-hero-content"><span className="valt-eyebrow">VALT-ON · SUA VITRINE DIGITAL</span><h2
          style={{
            color: "#222",
            fontSize: "30px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          Descubra o que combina com você
        </h2>

        <p
          style={{
            color: "#444",
            fontSize: "18px",
            fontWeight: "500",
          }}
        >
          Uma seleção especial para explorar, favoritar e comprar com seus créditos CVT.
        </p>

        <button
          onClick={() => {
            window.scrollTo({
              top: document.getElementById("produtos")?.getBoundingClientRect().top + window.scrollY,
              behavior: "smooth",
            });
          }}
        >
          Explorar produtos <span aria-hidden="true">→</span>
        </button></div>
        {produtos.find((produto) => produto.imagem) && (
          <div className="valt-hero-visual" aria-hidden="true"><img src={obterUrlImagem(produtos.find((produto) => produto.imagem).imagem)} alt="" /><span>ESCOLHAS PARA VOCÊ</span></div>
        )}
      </section >

      {/* =================================================
          PRODUTOS
      ================================================= */}

      <main className="valt-main" id="produtos"
        style={{
          padding: "20px",
        }}
      >
        <div className="valt-section-heading"><div><span className="valt-kicker">EXPLORE A VALT-ON</span><h2>{mostrarFavoritos ? "Seus favoritos" : categoria === "Todos" ? "Produtos em destaque" : categoria}</h2><p>Encontre sua próxima escolha entre nossos produtos.</p></div><span className="valt-product-count">{produtosOrdenados.length} produtos</span></div>
        <div className="valt-category-strip" aria-label="Filtrar por categoria">{categoriasDisponiveis.map((nome) => <button key={nome} className={categoria === nome && !mostrarFavoritos ? "active" : ""} onClick={() => { setCategoria(nome); setMostrarFavoritos(false); }} aria-pressed={categoria === nome && !mostrarFavoritos}>{nome}</button>)}<button className={mostrarFavoritos ? "active" : ""} onClick={() => setMostrarFavoritos((atual) => !atual)} aria-pressed={mostrarFavoritos}>♡ Favoritos ({favoritos.length})</button></div>
        <section className="valt-advanced-filters" aria-label="Filtros de produtos"><div className="valt-filter-heading"><strong>Refine sua busca</strong><button type="button" onClick={()=>{setPrecoMinimo("");setPrecoMaximo("");setApenasDisponiveis(false);setCategoria("Todos");setPesquisa("");setMostrarFavoritos(false);}}>Limpar filtros</button></div><div className="valt-filter-fields"><label>Preço mínimo (CVT)<input type="number" min="0" inputMode="decimal" placeholder="0" value={precoMinimo} onChange={e=>setPrecoMinimo(e.target.value)}/></label><label>Preço máximo (CVT)<input type="number" min="0" inputMode="decimal" placeholder="Sem limite" value={precoMaximo} onChange={e=>setPrecoMaximo(e.target.value)}/></label><label className="valt-filter-check"><input type="checkbox" checked={apenasDisponiveis} onChange={e=>setApenasDisponiveis(e.target.checked)}/> Somente em estoque</label></div></section>
        <div className="valt-toolbar"><span>{pesquisa ? `Resultados para “${pesquisa}”` : "Escolha seus favoritos"}</span><label>Ordenar por <select value={ordenacao} onChange={(evento) => setOrdenacao(evento.target.value)}><option value="destaques">Destaques</option><option value="menor-preco">Menor preço</option><option value="maior-preco">Maior preço</option><option value="nome">Nome A–Z</option></select></label></div>

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
              Nenhum produto corresponde aos filtros. Tente limpar a busca ou ampliar a faixa de preço.
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
          {produtosOrdenados.map(
            (produto) => (
              <div
                className="valt-product-card"
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
                <div className="valt-card-badges"><span>{produto.estoque > 0 ? "DISPONÍVEL" : "ESGOTADO"}</span><button type="button" className={favoritos.includes(produto.id) ? "valt-favorite active" : "valt-favorite"} aria-label={favoritos.includes(produto.id) ? `Remover ${produto.nome} dos favoritos` : `Favoritar ${produto.nome}`} aria-pressed={favoritos.includes(produto.id)} onClick={(evento) => { evento.stopPropagation(); alternarFavorito(produto.id); }}>{favoritos.includes(produto.id) ? "♥" : "♡"}</button></div>
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
                      className="valt-product-image"
                      loading="lazy"
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
                  {formatarCVT(produto.preco)}
                </h3>

                {/* COMPRAR */}

                <button
                  className="valt-buy-button"
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
                    ? "Adicionar ao carrinho"
                    : "Sem estoque"}
                </button>
              </div>
            )
          )}
        </div>
        <section className="valt-bottom-cta"><div><span className="valt-kicker">MAIS POSSIBILIDADES</span><h2>Encontrou algo que gostou?</h2><p>Salve seus produtos favoritos e volte quando quiser.</p></div><button onClick={() => { setMostrarFavoritos(true); document.getElementById("produtos")?.scrollIntoView({behavior:"smooth"}); }}>Ver favoritos →</button></section>
      </main >
      <footer className="valt-footer"><div><strong>VALT-ON</strong><p>Sua vitrine digital para descobrir e comprar.</p></div><div><strong>Explore</strong><button onClick={() => { setMostrarFavoritos(false); setCategoria("Todos"); document.getElementById("produtos")?.scrollIntoView({behavior:"smooth"}); }}>Todos os produtos</button><button onClick={() => { setMostrarFavoritos(true); document.getElementById("produtos")?.scrollIntoView({behavior:"smooth"}); }}>Meus favoritos</button></div><div><strong>Atendimento</strong><button onClick={() => setMostrarSugestoes(true)}>Enviar sugestão</button><button onClick={() => setMostrarCarrinho(true)}>Meu carrinho</button></div><small>© {new Date().getFullYear()} VALT-ON. Todos os direitos reservados.</small></footer>

      {/* =================================================
          CARRINHO
      ================================================= */}

      {
        mostrarCarrinho && (
          <>
          <div className="valt-cart-overlay" onClick={() => setMostrarCarrinho(false)} aria-hidden="true" />
          <div className="valt-cart-drawer" role="dialog" aria-modal="true" aria-label="Meu carrinho"
            style={{
              position: "fixed",
              right: "20px",
              top: "80px",
              width: "350px",
              maxWidth: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              background: "#fff9d6",
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
            <div className="valt-cart-title"><h2>Meu carrinho <span>({quantidadeCarrinho})</span></h2><button aria-label="Fechar carrinho" onClick={()=>setMostrarCarrinho(false)}>✕</button></div>

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
                        {formatarCVT(item.preco)}
                      </p>

                      <div>
                        <button
                          onClick={() =>
                            diminuirQuantidade(
                              item.id
                            )
                          }
                          style={{
                            width: "42px",
                            height: "42px",
                            fontSize: "22px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            backgroundColor: "#e0e0e0",
                            color: "#000000",
                            border: "2px solid #000000",
                            borderRadius: "8px",
                          }}
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
                          style={{
                            width: "42px",
                            height: "42px",
                            fontSize: "22px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            backgroundColor: "#e0e0e0",
                            color: "#000000",
                            border: "2px solid #000000",
                            borderRadius: "8px",
                          }}
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
                          marginTop: "8px",
                          padding: "10px 14px",
                          fontSize: "15px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          width: "100%",
                          backgroundColor: "#e0e0e0",
                          color: "#000000",
                          border: "2px solid #000000",
                          borderRadius: "8px",
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
                      backgroundColor: "#e0e0e0",
                      color: "#000000",
                      border: "2px solid #000000",
                      borderRadius: "8px",
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
                <div className="valt-cart-summary"><strong>Resumo do pedido</strong><small>O total será debitado do saldo CVT após a confirmação.</small></div>
                <h3>
                  Total: {formatarCVT(totalCarrinho)}
                </h3>

                {/* FINALIZAR */}

                <button
                  onClick={finalizarCompra}
                  disabled={finalizandoCompra}
                  style={{
                    padding: "14px 20px",
                    cursor: "pointer",
                    marginTop: "10px",
                    fontWeight: "bold",
                    fontSize: "16px",
                    width: "100%",
                    minHeight: "48px",
                    backgroundColor: "#e0e0e0",
                    color: "#000000",
                    border: "2px solid #000000",
                    borderRadius: "8px",
                  }}
                >
                  {finalizandoCompra ? "Processando..." : "💳 Finalizar compra"}
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
                padding: "12px 20px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                minHeight: "46px",
                backgroundColor: "#e0e0e0",
                color: "#000000",
                border: "2px solid #000000",
                borderRadius: "8px",
              }}
            >
              Fechar
            </button>
          </div>
          </>
        )
      }
    </div >
  );
}

export default App;
