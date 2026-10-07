import { useState } from "react";

import pacote1 from "./pacote-presente-1.jpeg";
import pacote2 from "./pacote-presente-2.jpeg";
import pacote3 from "./pacote-presente-3.jpeg";

const API_URL = "https://api.valt-on.com";

const imagensEmbalagens = {
  pacote1,
  pacote2,
  pacote3,
};

export default function PresenteRecebido({
  pedidoId,
  destinatarioId,
  embalagemPresente,
  presenteAberto = false,
  itens = [],
  mensagemPresente,
  remetenteNome,
  onPresenteAberto,
}) {
  const [aberto, setAberto] = useState(Boolean(presenteAberto));
  const [itensAtuais, setItensAtuais] = useState(itens);
  const [mensagemAtual, setMensagemAtual] = useState(mensagemPresente);
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState("");

  const imagemEmbalagem = imagensEmbalagens[embalagemPresente];

  const abrirPresente = async () => {
    if (aberto || abrindo) {
      return;
    }

    setAbrindo(true);
    setErro("");

    try {
      const resposta = await fetch(
        `${API_URL}/presentes/${pedidoId}/abrir?destinatario_id=${destinatarioId}`,
        {
          method: "POST",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail || "Nao foi possivel abrir o presente."
        );
      }

      setItensAtuais(dados.itens || []);
      setMensagemAtual(dados.mensagem_presente || null);
      setAberto(true);

      if (onPresenteAberto) {
        onPresenteAberto(dados);
      }
    } catch (erroAbrir) {
      setErro(
        erroAbrir.message || "Nao foi possivel abrir o presente."
      );
    } finally {
      setAbrindo(false);
    }
  };

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
      {!aberto ? (
        <button
          type="button"
          onClick={abrirPresente}
          disabled={abrindo}
          style={{
            border: "none",
            background: "transparent",
            cursor: abrindo ? "wait" : "pointer",
            padding: "10px",
            width: "100%",
          }}
        >
          {imagemEmbalagem ? (
            <img
              src={imagemEmbalagem}
              alt="Presente fechado"
              style={{
                width: "180px",
                height: "180px",
                objectFit: "contain",
                display: "block",
                margin: "0 auto 10px",
              }}
            />
          ) : (
            <div
              style={{
                fontSize: "90px",
                marginBottom: "10px",
              }}
            >
              🎁
            </div>
          )}

          <strong>
            {abrindo
              ? "Abrindo presente..."
              : "Clique para abrir seu presente"}
          </strong>
        </button>
      ) : (
        <div>
          <h3>🎁 Presente de {remetenteNome || "alguém especial"}</h3>

          <p>
            <strong>Seu presente chegou!</strong>
          </p>

          {itensAtuais.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                alignItems: "center",
              }}
            >
              {itensAtuais.map((item, indice) => (
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
                      alt={
                        item.nome ||
                        item.produto_nome ||
                        "Item do presente"
                      }
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
            <p>O presente foi aberto, mas os itens nao foram encontrados.</p>
          )}

          {mensagemAtual && (
            <div
              style={{
                marginTop: "15px",
                padding: "12px",
                borderRadius: "10px",
                backgroundColor: "#f5f5f5",
              }}
            >
              <strong>Mensagem de {remetenteNome || "quem enviou"}:</strong>
              <p>{mensagemAtual}</p>
            </div>
          )}

          <p
            style={{
              marginTop: "15px",
              fontWeight: "bold",
            }}
          >
            🎁 Este item foi recebido como presente.
          </p>
        </div>
      )}

      {erro && (
        <p
          style={{
            marginTop: "10px",
            color: "red",
          }}
        >
          {erro}
        </p>
      )}
    </div>
  );
}
