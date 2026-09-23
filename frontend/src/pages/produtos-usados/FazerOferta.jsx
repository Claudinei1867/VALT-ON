export default function FazerOferta({
  usuario,
  espacos,
  produtoUsadoOfertaSelecionado,
  setProdutoUsadoOfertaSelecionado,
  espacoOfertaSelecionado,
  setEspacoOfertaSelecionado,
  valorOfertaUsado,
  setValorOfertaUsado,
  API_URL,
}) {
  if (!produtoUsadoOfertaSelecionado) {
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
        Produto:{" "}
        <strong>
          {produtoUsadoOfertaSelecionado.nome}
        </strong>
      </p>

      <p>
        Preço anunciado:{" "}
        <strong>
          {Number(
            produtoUsadoOfertaSelecionado.preco_venda
          ).toFixed(2)}{" "}
          CVT
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
        value={valorOfertaUsado}
        onChange={(e) =>
          setValorOfertaUsado(e.target.value)
        }
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
              setEspacoOfertaSelecionado(String(espaco.id))
            }
            style={{
              padding: "10px",
              textAlign: "left",
              backgroundColor:
                String(espaco.id) ===
                  String(espacoOfertaSelecionado)
                  ? "#d0ffd0"
                  : "#f5f5f5",
              border:
                String(espaco.id) ===
                  String(espacoOfertaSelecionado)
                  ? "2px solid #008000"
                  : "1px solid #ccc",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            🏠 {espaco.nome}
          </button>
        ))}
      </div>

      <button
        onClick={async () => {
          try {
            const valor = Number(valorOfertaUsado);

            if (!valor || valor <= 0) {
              alert("Digite um valor de oferta válido.");
              return;
            }

            if (!espacoOfertaSelecionado) {
              alert("Selecione a casa de destino para a oferta.");
              return;
            }

            if (
              valor >
              Number(
                produtoUsadoOfertaSelecionado.preco_venda
              )
            ) {
              alert(
                "A oferta não pode ultrapassar o preço anunciado."
              );
              return;
            }

            const resposta = await fetch(
              `${API_URL}/produtos-usados/ofertar`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  comprador_id: usuario.id,
                  venda_id:
                    produtoUsadoOfertaSelecionado.venda_id,
                  valor_oferta: valor,
                  espaco_id: Number(espacoOfertaSelecionado),
                }),
              }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
              throw new Error(
                dados.detail ||
                  "Erro ao enviar oferta."
              );
            }

            alert("Oferta enviada com sucesso!");

            setProdutoUsadoOfertaSelecionado(null);
            setValorOfertaUsado("");
          } catch (error) {
            console.error(
              "ERRO AO ENVIAR OFERTA:",
              error
            );

            alert(
              error.message ||
                "Não foi possível enviar a oferta."
            );
          }
        }}
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
        onClick={() => {
          setProdutoUsadoOfertaSelecionado(null);
          setValorOfertaUsado("");
        }}
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