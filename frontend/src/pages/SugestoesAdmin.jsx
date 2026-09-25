import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://valt-on.onrender.com";

export default function SugestoesAdmin({ usuario }) {
  const [sugestoes, setSugestoes] = useState([]);

  const carregarSugestoes = async () => {
    try {
      const resposta = await fetch(
        `${API_URL}/sugestoes?admin_id=${usuario.admin_id}`
      );

      if (!resposta.ok) {
        throw new Error("Erro ao carregar sugestões.");
      }

      const dados = await resposta.json();
      setSugestoes(dados);
    } catch (erro) {
      console.error("ERRO AO CARREGAR SUGESTÕES:", erro);
    }
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

      if (!resposta.ok) {
        throw new Error("Erro ao atualizar sugestão.");
      }

      setSugestoes((anteriores) =>
        anteriores.map((sugestao) =>
          sugestao.id === sugestaoId
            ? {
                ...sugestao,
                status: novoStatus,
                resposta_admin: respostaAdmin,
              }
            : sugestao
        )
      );
    } catch (erro) {
      console.error("ERRO AO ALTERAR STATUS DA SUGESTÃO:", erro);
      alert("Não foi possível atualizar a sugestão.");
    }
  };

  useEffect(() => {
    carregarSugestoes();
  }, []);

  return (
    <div className="valt-admin-subpage valt-admin-suggestions" style={{ padding: "30px" }}>
      <h1>💡 Sugestões dos usuários</h1>

      {sugestoes.length === 0 ? (
        <p>Nenhuma sugestão recebida.</p>
      ) : (
        sugestoes.map((sugestao) => (
          <div
            key={sugestao.id}
            style={{
              background: "#fff",
              padding: "20px",
              marginBottom: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <p>
              <strong>Nome:</strong> {sugestao.nome}
            </p>

            <p>
              <strong>E-mail:</strong> {sugestao.email}
            </p>

            <p>
              <strong>Tipo:</strong> {sugestao.tipo}
            </p>

            <p>
              <strong>Mensagem:</strong> {sugestao.mensagem}
            </p>

            <p>
              <strong>Data:</strong> {sugestao.data_criacao}
            </p>

            <p>
              <strong>Resposta do administrador:</strong>
            </p>

            <textarea
              value={sugestao.resposta_admin || ""}
              onChange={(evento) => {
                const valor = evento.target.value;

                setSugestoes((anteriores) =>
                  anteriores.map((item) =>
                    item.id === sugestao.id
                      ? { ...item, resposta_admin: valor }
                      : item
                  )
                );
              }}
              placeholder="Digite aqui a resposta para o usuário..."
              rows={4}
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginBottom: "15px",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />

            <p>
              <strong>Status:</strong>
            </p>

            <select
              value={sugestao.status}
              onChange={(evento) => {
                alterarStatusSugestao(
                  sugestao.id,
                  evento.target.value,
                  sugestao.resposta_admin
                );
              }}
              style={{
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            >
              <option value="Pendente">Pendente</option>
              <option value="Em análise">Em análise</option>
              <option value="Respondida">Respondida</option>
              <option value="Arquivada">Arquivada</option>
            </select>
          </div>
        ))
      )}
    </div>
  );
}