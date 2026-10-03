import { useState } from "react";

import pacote1 from "./pacote-presente-1.jpeg";
import pacote2 from "./pacote-presente-2.jpeg";
import pacote3 from "./pacote-presente-3.jpeg";

const imagensEmbalagens = {
  pacote1,
  pacote2,
  pacote3,
};

export default function PresenteRecebido({
  embalagemPresente,
  itens = [],
  mensagemPresente,
  remetenteNome,
}) {
  const [aberto, setAberto] = useState(false);

  const imagemEmbalagem = imagensEmbalagens[embalagemPresente];

  if (!imagemEmbalagem) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        borderRadius: "12px",
        border: "2px solid #ddd",
        backgroundColor: "#fff",
        textAlign: "center",
      }}
    >
      <h3>Presente recebido</h3>

      {remetenteNome && (
        <p>
          <strong>De:</strong> {remetenteNome}
        </p>
      )}

      {!aberto ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "10px",
          }}
        >
          <img
            src={imagemEmbalagem}
            alt="Presente"
            style={{
              width: "180px",
              height: "180px",
              objectFit: "contain",
              display: "block",
              margin: "0 auto 10px",
            }}
          />

          <strong>Clique para abrir seu presente</strong>
        </button>
      ) : (
        <div>
          <p>
            <strong>Seu presente:</strong>
          </p>

          {itens.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                alignItems: "center",
              }}
            >
              {itens.map((item, indice) => (
                <div
                  key={indice}
                  style={{
                    width: "100%",
                    maxWidth: "300px",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid #ddd",
                  }}
                >
                  {item.imagem && (
                    <img
                      src={item.imagem}
                      alt={item.nome || item.produto_nome || "Item do presente"}
                      style={{
                        width: "140px",
                        height: "140px",
                        objectFit: "contain",
                      }}
                    />
                  )}

                  <div>
                    <strong>
                      {item.nome || item.produto_nome || "Produto"}
                    </strong>
                  </div>

                  {Number(item.quantidade) > 1 && (
                    <div>Quantidade: {item.quantidade}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>O presente foi entregue, mas os itens não foram encontrados.</p>
          )}

          {mensagemPresente && (
            <div
              style={{
                marginTop: "15px",
                padding: "12px",
                borderRadius: "10px",
                backgroundColor: "#f5f5f5",
              }}
            >
              <strong>Mensagem:</strong>
              <p>{mensagemPresente}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAberto(false)}
            style={{
              marginTop: "15px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
          >
            Fechar presente
          </button>
        </div>
      )}
    </div>
  );
}