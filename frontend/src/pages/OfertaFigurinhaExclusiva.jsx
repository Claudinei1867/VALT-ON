export default function OfertaFigurinhaExclusiva({
  usuario,
  produto,
  espacos,
  espacoSelecionado,
  setEspacoSelecionado,
  valorOferta,
  setValorOferta,
  onEnviar,
  onCancelar,
}) {
  if (!produto) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px",
        maxWidth: "500px",
      }}
    >
      <h2>Fazer oferta</h2>

      <p>
        Figurinha: <strong>{produto.nome}</strong>
      </p>

      <p>
        Valor original:{" "}
        <strong>
          {Number(produto.preco).toFixed(2)} CVT
        </strong>
      </p>

      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontWeight: "bold",
        }}
      >
        Valor da sua oferta:
      </label>

      <input
        type="number"
        min="0.01"
        step="0.01"
        value={valorOferta}
        onChange={(e) => setValorOferta(e.target.value)}
        placeholder="Digite o valor em CVT"
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "16px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          boxSizing: "border-box",
        }}
      />

      <label
        style={{
          display: "block",
          marginTop: "15px",
          marginBottom: "8px",
          fontWeight: "bold",
        }}
      >
        Casa de destino:
      </label>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {espacos.map((espaco) => (
          <button
            key={espaco.id}
            type="button"
            onClick={() =>
              setEspacoSelecionado(String(espaco.id))
            }
            style={{
              padding: "10px",
              textAlign: "left",
              backgroundColor:
                String(espaco.id) ===
                String(espacoSelecionado)
                  ? "#d0ffd0"
                  : "#f5f5f5",
              border:
                String(espaco.id) ===
                String(espacoSelecionado)
                  ? "2px solid #008000"
                  : "1px solid #ccc",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {espaco.nome}
          </button>
        ))}
      </div>

      <button
        onClick={onEnviar}
        style={{
          width: "100%",
          padding: "12px",
          marginTop: "15px",
          fontSize: "16px",
          backgroundColor: "#000",
          color: "#fff",
          border: "1px solid #000",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Enviar oferta
      </button>

      <button
        onClick={onCancelar}
        style={{
          width: "100%",
          padding: "10px",
          marginTop: "10px",
          fontSize: "16px",
          backgroundColor: "#fff",
          color: "#000",
          border: "1px solid #000",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Cancelar
      </button>
    </div>
  );
}
