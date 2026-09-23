export default function OfertasRecebidas({
  usuario,
  ofertasRecebidasUsados,
  API_URL,
  carregarProdutosUsados,
}) {
  if (!usuario || ofertasRecebidasUsados.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: "30px",
        marginBottom: "20px",
      }}
    >
      <h2>Ofertas recebidas</h2>

      {ofertasRecebidasUsados.map((oferta) => (
        <div
          key={oferta.oferta_id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "15px",
            marginTop: "10px",
            backgroundColor: "#fff",
          }}
        >
          <p>
            <strong>Produto:</strong>{" "}
            {oferta.produto_nome}
          </p>

          <p>
            <strong>Comprador:</strong>{" "}
            {oferta.comprador_nome}
          </p>

          <p>
            <strong>Valor da oferta:</strong>{" "}
            {Number(oferta.valor_oferta).toFixed(2)} CVT
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {oferta.status}
          </p>

          {oferta.status === "PENDENTE" && (
            <button
              onClick={async () => {
                try {
                  const resposta = await fetch(
                    `${API_URL}/produtos-usados/ofertas/aceitar?oferta_id=${oferta.oferta_id}&vendedor_id=${usuario.id}`,
                    {
                      method: "POST",
                    }
                  );

                  const dados = await resposta.json();

                  if (!resposta.ok) {
                    throw new Error(
                      (typeof dados.detail === "object" ? JSON.stringify(dados.detail) : dados.detail) || "Não foi possível aceitar a oferta."
                    );
                  }

                  alert(
                    dados.mensagem || "Oferta aceita com sucesso."
                  );

                  if (carregarProdutosUsados) {
                    await carregarProdutosUsados();
                  }
                } catch (erro) {
                  alert(
                    erro.message || "Erro ao aceitar a oferta."
                  );
                }
              }}
              style={{
                marginTop: "10px",
                padding: "10px 16px",
                backgroundColor: "#000",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Aceitar oferta
            </button>
          )}
        </div>
      ))}
    </div>
  );
}