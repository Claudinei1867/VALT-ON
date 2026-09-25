import { useEffect, useState } from "react";
import SugestoesAdmin from "./pages/SugestoesAdmin";
import PedidosAdmin from "./pages/admin/PedidosAdmin";
import ProdutosAdmin from "./pages/admin/ProdutosAdmin";
import { CATEGORIAS } from "./categorias";

const API_URL = "https://valt-on.onrender.com";

function Admin({ usuario, onVoltar, onLogout }) {
  const [produtos, setProdutos] = useState([]);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [pedidos, setPedidos] = useState([]);
  const [buscaPedido, setBuscaPedido] = useState("");
  const [quantidadeClientes, setQuantidadeClientes] = useState(0);
  const [visitantesAtivos, setVisitantesAtivos] = useState(null);
  const [quantidadeProdutos, setQuantidadeProdutos] = useState(0);
  const [sugestoes, setSugestoes] = useState([]);
  const [secaoAdmin, setSecaoAdmin] = useState("inicio");

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState("Celulares");
  const [estoque, setEstoque] = useState("");
  const [prazoEntregaDias, setPrazoEntregaDias] = useState(3);

  // Imagem já salva no backend
  const [imagem, setImagem] = useState("");

  // Novo arquivo selecionado pelo computador
  const [arquivoImagem, setArquivoImagem] = useState(null);

  const [mensagem, setMensagem] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  // =====================================================
  // CARREGAR PRODUTOS
  // =====================================================

  const carregarProdutos = () => {
    fetch(`${API_URL}/produtos`)
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error("Erro ao carregar produtos");
        }

        return resposta.json();
      })
      .then((dados) => {
        setProdutos(dados);
      })
      .catch((erro) => {
        console.error(erro);
        setMensagem("❌ Erro ao carregar produtos.");
      });
  };

  const carregarPedidos = () => {
    fetch(`${API_URL}/pedidos`)
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error("Erro ao carregar pedidos");
        }

        return resposta.json();
      })
      .then((dados) => {
        setPedidos(dados);
      })
      .catch((erro) => {
        console.error(erro);
        setMensagem("❌ Erro ao carregar pedidos.");
      });
  };

  const carregarEstatisticas = () => {
    fetch(`${API_URL}/admin/estatisticas`)
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error("Erro ao carregar estatísticas");
        }

        return resposta.json();
      })
      .then((dados) => {
        setQuantidadeClientes(dados.clientes);
        setVisitantesAtivos(dados.visitantes_ativos ?? null);
        setQuantidadeProdutos(dados.produtos);
      })
      .catch((erro) => {
        console.error(erro);
        setMensagem("Erro ao carregar estatísticas.");
      });
  };

  const carregarSugestoes = () => {
    if (usuario?.admin_id === undefined) {
      return;
    }

    fetch(`${API_URL}/sugestoes?admin_id=${usuario.admin_id}`)
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error("Erro ao carregar sugestoes");
        }

        return resposta.json();
      })
      .then((dados) => {
        setSugestoes(dados);
      })
      .catch((erro) => {
        console.error(erro);
        setMensagem("Erro ao carregar sugestoes.");
      });
  };
  const alterarStatusSugestao = async (
    sugestaoId,
    novoStatus,
    respostaAdmin
  ) => {
    try {
      const resposta = await fetch(
        `${API_URL}/sugestoes/${sugestaoId}/status?status=${encodeURIComponent(
          novoStatus
        )}&admin_id=${usuario.admin_id}&resposta_admin=${encodeURIComponent(
          respostaAdmin || ""
        )}`,
        {
          method: "PUT",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail || "Erro ao alterar status da sugestão."
        );
      }

      setSugestoes((sugestoesAtuais) =>
        sugestoesAtuais.map((sugestao) =>
          sugestao.id === sugestaoId
            ? { ...sugestao, status: dados.status, resposta_admin: dados.resposta_admin }
            : sugestao
        )
      );
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao alterar status da sugestão.");
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

      setMensagem("Status do pedido atualizado com sucesso!");
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao alterar status do pedido.");
    }
  };

  useEffect(() => {const intervalo=setInterval(carregarEstatisticas,30000);return ()=>clearInterval(intervalo);},[]);

  useEffect(() => {
    carregarProdutos();
    carregarPedidos();
    carregarEstatisticas();
    carregarSugestoes();
  }, []);

  // =====================================================
  // LIMPAR FORMULÁRIO
  // =====================================================

  const produtosFiltrados = produtos.filter((produto) => {
    const texto = buscaProduto.toLowerCase().trim();

    if (!texto) return true;

    return (
      (produto.nome || "").toLowerCase().includes(texto) ||
      (produto.descricao || "").toLowerCase().includes(texto) ||
      (produto.categoria || "").toLowerCase().includes(texto)
    );
  });

  const limparFormulario = () => {
    setNome("");
    setDescricao("");
    setPreco("");
    setCategoria("Celulares");
    setEstoque("");
    setPrazoEntregaDias(3);
    setImagem("");
    setArquivoImagem(null);
    setEditandoId(null);
  };

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const texto = buscaPedido.toLowerCase().trim();

    if (!texto) return true;

    return (
      String(pedido.pedido_id || "").includes(texto) ||
      (pedido.cliente_nome || "").toLowerCase().includes(texto) ||
      (pedido.cliente_email || "").toLowerCase().includes(texto) ||
      (pedido.status || "").toLowerCase().includes(texto)
    );
  });

  // =====================================================
  // SELECIONAR IMAGEM
  // =====================================================

  const selecionarImagem = (evento) => {
    const arquivo = evento.target.files[0];

    if (!arquivo) {
      return;
    }

    // Verificar se é realmente uma imagem
    if (!arquivo.type.startsWith("image/")) {
      setMensagem("❌ Selecione um arquivo de imagem.");
      return;
    }

    setArquivoImagem(arquivo);

    // Mostra uma prévia temporária
    const imagemTemporaria = URL.createObjectURL(arquivo);
    setImagem(imagemTemporaria);

    setMensagem("");
  };

  // =====================================================
  // ENVIAR IMAGEM PARA O BACKEND
  // =====================================================

  const enviarImagem = async () => {
    if (!arquivoImagem) {
      return imagem;
    }

    const formularioImagem = new FormData();

    formularioImagem.append("file", arquivoImagem);

    const resposta = await fetch(`${API_URL}/upload-imagem`, {
      method: "POST",
      body: formularioImagem,
    });

    if (!resposta.ok) {
      throw new Error("Erro ao enviar imagem");
    }

    const dados = await resposta.json();

    console.log("Resposta do upload:", dados);
    console.log("URL DA IMAGEM:", dados.url);

    // O backend retorna:
    // /uploads/nome-da-imagem.png

    return dados.url;
  };

  // =====================================================
  // CADASTRAR OU ALTERAR PRODUTO
  // =====================================================

  const salvarProduto = async (evento) => {
    evento.preventDefault();

    try {
      setMensagem("⏳ Salvando produto...");

      // Se foi escolhida uma nova imagem,
      // primeiro enviamos para o backend.
      const imagemFinal = await enviarImagem();

      const produto = {
        nome: nome,
        descricao: descricao,
        preco: Number(preco),
        categoria: categoria,
        estoque: Number(estoque),
        prazo_entrega_dias: Number(prazoEntregaDias),
        imagem: imagemFinal || null,
      };

      let resposta;

      // =================================================
      // ALTERAR
      // =================================================

      if (editandoId !== null) {
        resposta = await fetch(
          `${API_URL}/produtos/${editandoId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(produto),
          }
        );
      }

      // =================================================
      // CADASTRAR
      // =================================================

      else {
        resposta = await fetch(`${API_URL}/produtos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(produto),
        });
      }

      if (!resposta.ok) {
        const erro = await resposta.text();

        console.error(erro);

        throw new Error("Erro ao salvar produto");
      }

      if (editandoId !== null) {
        setMensagem("✅ Produto alterado com sucesso!");
      } else {
        setMensagem("✅ Produto cadastrado com sucesso!");
      }

      limparFormulario();

      carregarProdutos();

      setTimeout(() => {
        setMensagem("");
      }, 3000);
    } catch (erro) {
      console.error(erro);

      setMensagem("❌ Erro ao salvar produto.");
    }
  };

  // =====================================================
  // EDITAR PRODUTO
  // =====================================================

  const editarProduto = (produto) => {
    setEditandoId(produto.id);

    setNome(produto.nome || "");
    setDescricao(produto.descricao || "");
    setPreco(produto.preco ?? "");
    setCategoria(produto.categoria === "Enfeites" ? "Decoração e Festas" : (produto.categoria || "Celulares"));
    setEstoque(produto.estoque ?? "");
    setPrazoEntregaDias(produto.prazo_entrega_dias ?? 3);

    // Mantém a imagem existente
    setImagem(produto.imagem || "");

    // Nenhum novo arquivo selecionado inicialmente
    setArquivoImagem(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // EXCLUIR PRODUTO
  // =====================================================

  const excluirProduto = async (id) => {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este produto?"
    );

    if (!confirmar) {
      return;
    }

    try {
      const resposta = await fetch(
        `${API_URL}/produtos/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!resposta.ok) {
        throw new Error("Erro ao excluir produto");
      }

      setMensagem("✅ Produto excluído com sucesso!");

      carregarProdutos();

      if (editandoId === id) {
        limparFormulario();
      }

      setTimeout(() => {
        setMensagem("");
      }, 3000);
    } catch (erro) {
      console.error(erro);

      setMensagem("❌ Erro ao excluir produto.");
    }
  };

  // =====================================================
  // TRANSFORMAR URL DA IMAGEM
  // =====================================================

  const obterUrlImagem = (url) => {
    if (!url) {
      return "";
    }

    // URL completa
    if (
      url.startsWith("http://") ||
      url.startsWith("https://")
    ) {
      return url;
    }

    // URL do backend
    if (url.startsWith("/")) {
      return `${API_URL}${url}`;
    }

    return `${API_URL}/${url}`;
  };

  // =====================================================
  // TELA
  // =====================================================


  if (secaoAdmin === "sugestoes") {
    return (
      <SugestoesAdmin
        usuario={usuario}
        onVoltar={() => setSecaoAdmin("inicio")}
      />
    );
  }

  if (secaoAdmin === "pedidos") {
    return (
      <PedidosAdmin
        onVoltar={() => setSecaoAdmin("inicio")}
      />
    );
  }


  if (secaoAdmin === "produtos") {
    return (
      <ProdutosAdmin
        onVoltar={() => setSecaoAdmin("inicio")}
        onEditarProduto={(produto) => {
          editarProduto(produto);
          setSecaoAdmin("inicio");
        }}
      />
    );
  }

  const semEstoque = produtos.filter((item) => Number(item.estoque) <= 0).length;
  const estoqueBaixo = produtos.filter((item) => Number(item.estoque) > 0 && Number(item.estoque) <= 5).length;
  const alertas = produtos.filter((item) => Number(item.estoque) <= 5).slice(0, 8);
  const metricas = [
    { simbolo: "◈", rotulo: "Produtos cadastrados", valor: quantidadeProdutos, tom: "gold" },
    { simbolo: "♙", rotulo: "Clientes", valor: quantidadeClientes, tom: "violet" },
    { simbolo: "●", rotulo: "Visitantes ativos (2 min)", valor: visitantesAtivos ?? "—", tom: "blue" },
    { simbolo: "▣", rotulo: "Pedidos carregados", valor: pedidos.length, tom: "blue" },
    { simbolo: "◇", rotulo: "Sem estoque", valor: semEstoque, tom: "gray" },
    { simbolo: "⚠", rotulo: "Estoque baixo (até 5)", valor: estoqueBaixo, tom: "gold" },
  ];

  return (
    <div className="valt-admin-v6">
      <aside className="valt-admin-sidebar" aria-label="Navegação administrativa">
        <div className="valt-admin-brand"><span className="valt-admin-brand-icon">▣</span><div><strong>VALT-<em>ON</em></strong><small>SIMULADOR DE COMPRAS</small></div></div>
        <div className="valt-admin-nav-label">PAINEL</div>
        <nav className="valt-admin-nav">
          <button className="active" type="button" aria-current="page" onClick={() => setSecaoAdmin("inicio")}>▦ <span>Visão geral</span></button>
          <button type="button" onClick={() => setSecaoAdmin("produtos")}>◈ <span>Produtos</span></button>
          <button type="button" onClick={() => setSecaoAdmin("pedidos")}>▣ <span>Pedidos</span></button>
          <button type="button" onClick={() => document.getElementById("valt-admin-alertas")?.scrollIntoView({behavior:"smooth"})}>⚠ <span>Estoque</span></button>
          <button type="button" className="valt-admin-suggestions-nav" onClick={() => setSecaoAdmin("sugestoes")}>♧ <span>Sugestões</span></button>
          <button type="button" onClick={() => document.getElementById("valt-admin-formulario")?.scrollIntoView({behavior:"smooth"})}>＋ <span>Cadastrar produto</span></button>
        </nav>
        <div className="valt-admin-sidebar-bottom"><button type="button" onClick={onVoltar}>↗ &nbsp; Ver loja</button><button type="button" className="valt-admin-logout" onClick={onLogout}>↪ &nbsp; Sair da conta</button><small>VALT-ON · Ambiente de simulação</small></div>
      </aside>
      <div className="valt-admin-workspace">
        <header className="valt-admin-topbar"><div className="valt-admin-topbar-search">⌕ <input aria-label="Buscar produto no painel" placeholder="Buscar produto cadastrado..." value={buscaProduto} onChange={(e)=>setBuscaProduto(e.target.value)} /></div><div className="valt-admin-user"><span className="valt-admin-avatar">♙</span><span>Administrador</span><button type="button" className="valt-admin-logout-top" onClick={onLogout}>Sair</button></div></header>
        <main className="valt-admin-content">
          <div className="valt-admin-heading"><div><span className="valt-admin-kicker">PAINEL ADMINISTRATIVO</span><h1>Visão geral <span className="valt-admin-heading-dot">●</span></h1><p>Acompanhe os dados atuais da sua loja simulada.</p></div><div className="valt-admin-heading-actions"><button type="button" className="valt-admin-suggestions-cta" onClick={() => setSecaoAdmin("sugestoes")}>♧ Abrir sugestões</button><button type="button" onClick={onVoltar} className="valt-admin-outline">↗ Ver loja</button></div></div>
          <section className="valt-admin-metrics" aria-label="Indicadores da loja">{metricas.map((item)=><div className="valt-admin-metric" key={item.rotulo}><span className={`valt-admin-metric-icon ${item.tom}`}>{item.simbolo}</span><span className="valt-admin-metric-label">{item.rotulo}</span><strong>{item.valor}</strong><small>Dados atuais da loja</small></div>)}</section>
          <div className="valt-admin-columns">
            <section className="valt-admin-panel valt-admin-alerts" id="valt-admin-alertas"><div className="valt-admin-panel-title"><div><span className="valt-admin-panel-icon">⚠</span><h2>Alertas de estoque</h2></div><button type="button" onClick={()=>setSecaoAdmin("produtos")}>Ver produtos ↗</button></div>
              {alertas.length===0?<p className="valt-admin-empty">Nenhum produto com estoque baixo no momento.</p>:<div className="valt-admin-alert-list">{alertas.map((item)=><div className="valt-admin-alert-row" key={item.id}><div className="valt-admin-alert-thumb">{item.imagem?<img src={obterUrlImagem(item.imagem)} alt="" loading="lazy"/>:"◈"}</div><div className="valt-admin-alert-info"><strong>{item.nome}</strong><small>{item.categoria||"Produto"}</small></div><div className="valt-admin-alert-stock"><strong>{Number(item.estoque)<=0?"Esgotado":`${item.estoque} restantes`}</strong><span><i style={{width:`${Math.min(100,Math.max(0,Number(item.estoque))*20)}%`}}/></span></div><button type="button" onClick={()=>editarProduto(item)}>Editar</button></div>)}</div>}
            </section>
            <section className="valt-admin-panel valt-admin-form-panel" id="valt-admin-formulario"><div className="valt-admin-panel-title"><div><span className="valt-admin-panel-icon">＋</span><h2>{editandoId!==null?"Editar produto":"Cadastrar produto"}</h2></div></div><p className="valt-admin-panel-hint">Gerencie seu catálogo sem sair do painel.</p>
              {mensagem&&<div className="valt-admin-message" role="status">{mensagem}</div>}
              <div className="valt-admin-product-form"><form onSubmit={salvarProduto}>
        {/* NOME */}

        <div style={{ marginBottom: "15px" }}>
          <label>
            <strong>Nome do produto</strong>
          </label>

          <br />

          <input
            type="text"
            value={nome}
            onChange={(evento) =>
              setNome(evento.target.value)
            }
            placeholder="Ex.: Smartphone VALT-ON"
            required
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        {/* DESCRIÇÃO */}

        <div style={{ marginBottom: "15px" }}>
          <label>
            <strong>Descrição</strong>
          </label>

          <br />

          <textarea
            value={descricao}
            onChange={(evento) =>
              setDescricao(evento.target.value)
            }
            placeholder="Descrição do produto"
            rows="4"
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        {/* PREÇO */}

        <div style={{ marginBottom: "15px" }}>
          <label>
            <strong>Preço</strong>
          </label>

          <br />

          <input
            type="number"
            step="0.01"
            min="0"
            value={preco}
            onChange={(evento) =>
              setPreco(evento.target.value)
            }
            placeholder="0.00"
            required
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        {/* CATEGORIA */}

        <div style={{ marginBottom: "15px" }}>
          <label>
            <strong>Categoria</strong>
          </label>

          <br />

          <select
            value={categoria}
            onChange={(evento) =>
              setCategoria(evento.target.value)
            }
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          >
            {CATEGORIAS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        {/* ESTOQUE */}

        <div style={{ marginBottom: "15px" }}>
          <label>
            <strong>Estoque</strong>
          </label>

          <br />

          <input
            type="number"
            min="0"
            value={estoque}
            onChange={(evento) =>
              setEstoque(evento.target.value)
            }
            placeholder="Quantidade"
            required
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        {/* PRAZO DE ENTREGA */}

        <div style={{ marginBottom: "15px" }}>
          <label>
            <strong>Prazo de entrega (dias)</strong>
          </label>

          <br />

          <input
            type="number"
            min="0"
            value={prazoEntregaDias}
            onChange={(evento) =>
              setPrazoEntregaDias(evento.target.value)
            }
            placeholder="Ex.: 3"
            required
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        {/* =====================================================
            IMAGEM
        ===================================================== */}

        <div style={{ marginBottom: "20px" }}>
          <label>
            <strong>Imagem do produto</strong>
          </label>

          <br />

          <input
            type="file"
            accept="image/*"
            onChange={selecionarImagem}
            style={{
              marginTop: "8px",
            }}
          />

          <br />

          <small>
            Selecione uma imagem do seu computador.
          </small>

          {/* PRÉVIA DA IMAGEM */}

          {imagem && (
            <div style={{ marginTop: "15px" }}>
              <p>
                <strong>Pré-visualização:</strong>
              </p>

              <img
                src={
                  arquivoImagem
                    ? imagem
                    : obterUrlImagem(imagem)
                }
                alt="Prévia"
                style={{
                  width: "200px",
                  height: "160px",
                  objectFit: "contain",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "5px",
                }}
              />
            </div>
          )}
        </div>

        {/* BOTÕES */}

        <button type="submit">
          {editandoId !== null
            ? "💾 Salvar Alterações"
            : "➕ Cadastrar Produto"}
        </button>

        {editandoId !== null && (
          <button
            type="button"
            onClick={limparFormulario}
            style={{
              marginLeft: "10px",
            }}
          >
            ❌ Cancelar
          </button>
        )}
      </form></div>
            </section>
          </div>
          <footer className="valt-admin-footer">VALT-ON · Simulador de vendas — nenhuma transação financeira real.</footer>
        </main>
      </div>
    </div>
  );
}
export default Admin;