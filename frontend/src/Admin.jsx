import { useEffect, useState } from "react";

const API_URL = "https://valt-on.onrender.com";

function Admin() {
  const [produtos, setProdutos] = useState([]);

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

  useEffect(() => {
    carregarProdutos();
  }, []);

  // =====================================================
  // LIMPAR FORMULÁRIO
  // =====================================================

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
    setCategoria(produto.categoria || "Celulares");
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

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <h1>⚙️ Administrador</h1>

      <h2>
        {editandoId !== null
          ? "✏️ Alterar Produto"
          : "➕ Cadastrar Produto"}
      </h2>

      {mensagem && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            background: "#e8f5e9",
            borderRadius: "8px",
          }}
        >
          {mensagem}
        </div>
      )}

      {/* =====================================================
          FORMULÁRIO
      ===================================================== */}

      <form onSubmit={salvarProduto}>
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
            <option value="Celulares">
              Celulares
            </option>

            <option value="Informática">
              Informática
            </option>

            <option value="Casa">
              Casa
            </option>

            <option value="Moda">
              Moda
            </option>

            <option value="Esportes">
              Esportes
            </option>
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
            min="1"
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
      </form>

      <hr
        style={{
          margin: "35px 0",
        }}
      />

      {/* =====================================================
          LISTA DE PRODUTOS
      ===================================================== */}

      <h2>📦 Produtos cadastrados</h2>

      {produtos.length === 0 ? (
        <p>Nenhum produto cadastrado.</p>
      ) : (
        produtos.map((produto) => (
          <div
            key={produto.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "15px",
            }}
          >
            {/* IMAGEM */}

            {produto.imagem ? (
              <img
                src={obterUrlImagem(produto.imagem)}
                alt={produto.nome}
                style={{
                  width: "150px",
                  height: "120px",
                  objectFit: "contain",
                  display: "block",
                  marginBottom: "10px",
                }}
              />
            ) : (
              <div
                style={{
                  width: "150px",
                  height: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f5f5f5",
                  fontSize: "40px",
                  marginBottom: "10px",
                }}
              >
                🛍️
              </div>
            )}

            <h3>{produto.nome}</h3>

            <p>{produto.descricao}</p>

            <strong>
              CVT {Number(produto.preco).toFixed(2)}
            </strong>

            <p>
              Categoria: {produto.categoria}
              <br />
              Estoque: {produto.estoque}
              <br />
              ID: {produto.id}
            </p>

            <button
              onClick={() => editarProduto(produto)}
            >
              ✏️ Editar
            </button>

            <button
              onClick={() =>
                excluirProduto(produto.id)
              }
              style={{
                marginLeft: "10px",
              }}
            >
              🗑️ Excluir
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Admin;