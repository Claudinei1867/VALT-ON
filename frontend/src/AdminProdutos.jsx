import { useState } from "react";

function AdminProdutos({ adicionarProduto }) {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");

  function cadastrarProduto(e) {
    e.preventDefault();

    if (!nome || !preco || !estoque || !categoria) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const novoProduto = {
      id: Date.now(),
      nome: nome,
      descricao: descricao || "Produto disponível no VALT-ON",
      preco: Number(preco),
      estoque: Number(estoque),
      categoria: categoria,
      imagem: "📦",
    };

    adicionarProduto(novoProduto);

    setNome("");
    setPreco("");
    setEstoque("");
    setCategoria("");
    setDescricao("");

    alert("Produto cadastrado com sucesso!");
  }

  return (
    <div className="admin-produtos">

      <h1>📦 Administração de Produtos</h1>

      <p>
        Cadastre os produtos que serão vendidos no VALT-ON.
      </p>

      <form
        className="formulario-produto"
        onSubmit={cadastrarProduto}
      >

        <div className="campo">
          <label>Nome do produto *</label>

          <input
            type="text"
            placeholder="Ex: TV Samsung"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div className="campo">
          <label>Preço *</label>

          <input
            type="number"
            step="0.01"
            placeholder="Ex: 2499.90"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
          />
        </div>

        <div className="campo">
          <label>Estoque *</label>

          <input
            type="number"
            placeholder="Ex: 10"
            value={estoque}
            onChange={(e) => setEstoque(e.target.value)}
          />
        </div>

        <div className="campo">
          <label>Categoria *</label>

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">
              Selecione uma categoria
            </option>

            <option value="Eletrônicos">
              Eletrônicos
            </option>

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

        <div className="campo campo-descricao">
          <label>Descrição</label>

          <textarea
            placeholder="Descrição do produto"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="botao-adicionar"
        >
          ➕ Adicionar Produto
        </button>

      </form>

    </div>
  );
}

export default AdminProdutos;