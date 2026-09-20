import CompraProdutoUsado from "./produtos-usados/CompraProdutoUsado";
import FazerOferta from "./produtos-usados/FazerOferta";
import ListaProdutosUsados from "./produtos-usados/ListaProdutosUsados";
import OfertasRecebidas from "./produtos-usados/OfertasRecebidas";

export default function ProdutosUsados({
  usuario,
  espacos,
  produtoUsadoSelecionado,
  setProdutoUsadoSelecionado,
  espacoUsadoSelecionado,
  setEspacoUsadoSelecionado,
  espacoOfertaSelecionado,
  setEspacoOfertaSelecionado,
  produtoUsadoOfertaSelecionado,
  setProdutoUsadoOfertaSelecionado,
  valorOfertaUsado,
  setValorOfertaUsado,
  carregandoProdutosUsados,
  produtosUsados,
  ofertasRecebidasUsados,
  API_URL,
  obterUrlImagem,
  carregarProdutosUsados,
  setMostrarProdutosUsados,
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#e0e0e0",
        padding: "20px",
      }}
    >
      <h1>🛍️ Produtos Usados</h1>

      <button
        onClick={() =>
          setMostrarProdutosUsados(false)
        }
        style={{
          padding: "10px 14px",
          fontSize: "16px",
          backgroundColor: "#000",
          color: "#fff",
          border: "1px solid #000",
          borderRadius: "6px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        ← Voltar para a loja
      </button>

      <CompraProdutoUsado
        usuario={usuario}
        espacos={espacos}
        produtoUsadoSelecionado={produtoUsadoSelecionado}
        setProdutoUsadoSelecionado={setProdutoUsadoSelecionado}
        espacoUsadoSelecionado={espacoUsadoSelecionado}
        setEspacoUsadoSelecionado={setEspacoUsadoSelecionado}
        API_URL={API_URL}
        carregarProdutosUsados={carregarProdutosUsados}
      />
      <FazerOferta
        usuario={usuario}
        espacos={espacos}
        produtoUsadoOfertaSelecionado={produtoUsadoOfertaSelecionado}
        setProdutoUsadoOfertaSelecionado={setProdutoUsadoOfertaSelecionado}
        espacoOfertaSelecionado={espacoOfertaSelecionado}
        setEspacoOfertaSelecionado={setEspacoOfertaSelecionado}
        valorOfertaUsado={valorOfertaUsado}
        setValorOfertaUsado={setValorOfertaUsado}
        API_URL={API_URL}
      />
      {carregandoProdutosUsados ? (
        <p>Carregando produtos usados...</p>
      ) : (
        <ListaProdutosUsados
          usuario={usuario}
          produtosUsados={produtosUsados}
          obterUrlImagem={obterUrlImagem}
          setProdutoUsadoSelecionado={setProdutoUsadoSelecionado}
          setEspacoUsadoSelecionado={setEspacoUsadoSelecionado}
          setProdutoUsadoOfertaSelecionado={setProdutoUsadoOfertaSelecionado}
          setValorOfertaUsado={setValorOfertaUsado}
        />
      )}
      <OfertasRecebidas
        usuario={usuario}
        ofertasRecebidasUsados={ofertasRecebidasUsados}
        API_URL={API_URL}
        carregarProdutosUsados={carregarProdutosUsados}
      />
    </div>
  );
}
