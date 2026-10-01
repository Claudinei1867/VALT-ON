import React from "react";

const formatarPreco = (valor) => {
  return `CVT ${Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// =====================================================
// PÁGINA DE DETALHES DO PRODUTO
// =====================================================

function ProdutoDetalhes({
  produto,
  usuario,
  espacos = [],
  API_URL,
  quantidade,
  setQuantidade,
  onVoltar,
  onComprar,
  obterUrlImagem,
  relacionados = [],
  onVerRelacionado,
  favorito = false,
  onAlternarFavorito,
}) {
  const [exclusivaAtual, setExclusivaAtual] = React.useState(null);
  const [valorOferta, setValorOferta] = React.useState("");
  const [casaOferta, setCasaOferta] = React.useState("");
  const [enviandoOferta, setEnviandoOferta] = React.useState(false);

  React.useEffect(() => {
    setExclusivaAtual(null); setValorOferta(""); setCasaOferta("");
    if (!produto?.exclusiva || !API_URL) return;
    fetch(`${API_URL}/figurinhas-exclusivas/produto/${produto.id}`, { cache: "no-store" }).then(async r => { if (!r.ok) throw new Error((await r.json().catch(()=>({}))).detail || "Proprietário não encontrado"); return r.json(); }).then(setExclusivaAtual).catch(() => setExclusivaAtual(null));
  }, [produto?.id, produto?.exclusiva, API_URL]);

  const enviarOfertaExclusiva = async () => {
    if (!usuario) return alert("Entre na sua conta para fazer uma oferta.");
    if (!exclusivaAtual) return alert("Proprietário atual não encontrado.");
    if (Number(exclusivaAtual.dono_id) === Number(usuario.id)) return alert("Esta figurinha já é sua.");
    if (!casaOferta || Number(valorOferta) <= 0) return alert("Informe o valor da oferta e a casa de destino.");
    setEnviandoOferta(true);
    try { const r=await fetch(`${API_URL}/figurinhas-exclusivas/ofertar`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({comprador_id:usuario.id,item_espaco_id:exclusivaAtual.item_id,valor_oferta:Number(valorOferta),espaco_id:Number(casaOferta)})}); const d=await r.json(); if(!r.ok) throw new Error(d.detail||"Não foi possível enviar a oferta."); alert("Oferta enviada ao proprietário!"); setValorOferta(""); setCasaOferta(""); } catch(e){ alert(e.message); } finally { setEnviandoOferta(false); }
  };

  // =====================================================
  // VERIFICAR PRODUTO
  // =====================================================

  if (!produto) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          background: "#f5f5f5",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "16px",
            textAlign: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h2>Produto não encontrado.</h2>

          <button
            onClick={onVoltar}
            style={{
              marginTop: "20px",
              padding: "12px 22px",
              cursor: "pointer",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "white",
              fontWeight: "bold",
            }}
          >
            ← Voltar para a loja
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // AUMENTAR QUANTIDADE
  // =====================================================

  const aumentarQuantidade = () => {
    if (quantidade < produto.estoque) {
      setQuantidade(quantidade + 1);
    }
  };

  // =====================================================
  // DIMINUIR QUANTIDADE
  // =====================================================

  const diminuirQuantidade = () => {
    if (quantidade > 1) {
      setQuantidade(quantidade - 1);
    }
  };

  // =====================================================
  // PREÇO TOTAL
  // =====================================================

  const totalProduto = Number(produto.preco) * quantidade;

  // =====================================================
  // TELA
  // =====================================================

  return (
    <div className="valt-detail-page"
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
        }}
      >
        {/* =================================================
            VOLTAR
        ================================================= */}

        <button
          onClick={onVoltar}
          style={{
            padding: "11px 20px",
            cursor: "pointer",
            marginBottom: "20px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            background: "white",
            fontWeight: "bold",
            fontSize: "15px",
          }}
        >
          ← Voltar para a loja
        </button>

        {/* =================================================
            PRODUTO
        ================================================= */}

        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "clamp(18px, 4vw, 35px)",
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) minmax(0, 1fr)",
            gap: "clamp(25px, 5vw, 50px)",
            boxShadow:
              "0 4px 18px rgba(0,0,0,0.08)",
          }}
        >
          {/* =================================================
              IMAGEM
          ================================================= */}

          <div>
            <div
              style={{
                width: "100%",
                minHeight: "420px",
                border: "1px solid #e1e1e1",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                boxSizing: "border-box",
                background: "#fff",
                overflow: "hidden",
              }}
            >
              {produto.imagem ? (
                <img
                  src={obterUrlImagem(produto.imagem)}
                  alt={produto.nome}
                  onError={(evento) => {
                    evento.currentTarget.onerror = null;
                    evento.currentTarget.src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%' height='100%' fill='%23fff8df'/><text x='50%' y='46%' text-anchor='middle' font-size='72'>⭐</text><text x='50%' y='62%' text-anchor='middle' font-family='Arial' font-size='22' fill='%235a4300'>Imagem indisponível</text></svg>`);
                  }}
                  style={{
                    width: "100%",
                    height: "390px",
                    objectFit: "contain",
                    borderRadius: "10px",
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: "100px",
                  }}
                >
                  🛍️
                </div>
              )}
            </div>

            {/* INFORMAÇÃO ABAIXO DA IMAGEM */}

            <div
              style={{
                marginTop: "15px",
                textAlign: "center",
                color: "#777",
                fontSize: "14px",
              }}
            >
              Imagem ilustrativa do produto
            </div>
          </div>

          {/* =================================================
              INFORMAÇÕES DO PRODUTO
          ================================================= */}

          <div>
            {/* CATEGORIA */}

            <p
              style={{
                color: "#666",
                marginTop: "0",
                marginBottom: "8px",
                fontSize: "15px",
              }}
            >
              🏷️ {produto.categoria}
            </p>

            {/* NOME */}

            <h1
              style={{
                marginTop: "0",
                marginBottom: "12px",
                fontSize: "clamp(26px, 4vw, 36px)",
                lineHeight: "1.2",
              }}
            >
              {produto.nome}
            </h1>

            <button className="valt-detail-favorite" onClick={onAlternarFavorito} aria-pressed={favorito}>{favorito?"♥ Salvo nos favoritos":"♡ Adicionar aos favoritos"}</button>

            {/* DESCRIÇÃO */}

            <div
              style={{
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  marginBottom: "8px",
                }}
              >
                Sobre o produto
              </h3>

              <p
                style={{
                  fontSize: "16px",
                  lineHeight: "1.6",
                  color: "#444",
                  marginTop: "0",
                }}
              >
                {produto.descricao ||
                  "Descrição não informada."}
              </p>
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #eee",
                margin: "25px 0",
              }}
            />

            {/* PREÇO */}

            <p
              style={{
                marginBottom: "5px",
                color: "#666",
              }}
            >
              Por apenas:
            </p>

            <h2
              style={{
                fontSize: "clamp(28px, 5vw, 38px)",
                marginTop: "0",
                marginBottom: "5px",
              }}
            >
              {formatarPreco(produto.preco)}
            </h2>

            {/* TOTAL */}

            {quantidade > 1 && (
              <p
                style={{
                  color: "#666",
                  marginTop: "5px",
                  marginBottom: "15px",
                }}
              >
                Total de {quantidade} unidades:{" "}
                <strong>
                  {formatarPreco(totalProduto)}
                </strong>
              </p>
            )}

            {/* ESTOQUE */}

            <p
              style={{
                fontWeight: "bold",
                marginBottom: "20px",
                color:
                  produto.estoque > 0
                    ? "green"
                    : "red",
              }}
            >
              {produto.estoque > 0
                ? `📦 Estoque disponível: ${produto.estoque}`
                : "❌ Produto sem estoque"}
            </p>

            {/* =================================================
                QUANTIDADE
            ================================================= */}

            {produto.estoque > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "25px",
                  flexWrap: "wrap",
                }}
              >
                <strong>Quantidade:</strong>

                <button
                  onClick={diminuirQuantidade}
                  disabled={quantidade <= 1}
                  style={{
                    width: "42px",
                    height: "42px",
                    fontSize: "22px",
                    cursor:
                      quantidade > 1
                        ? "pointer"
                        : "not-allowed",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    background:
                      quantidade > 1
                        ? "white"
                        : "#eee",
                  }}
                >
                  −
                </button>

                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    minWidth: "35px",
                    textAlign: "center",
                  }}
                >
                  {quantidade}
                </span>

                <button
                  onClick={aumentarQuantidade}
                  disabled={
                    quantidade >= produto.estoque
                  }
                  style={{
                    width: "42px",
                    height: "42px",
                    fontSize: "22px",
                    cursor:
                      quantidade <
                      produto.estoque
                        ? "pointer"
                        : "not-allowed",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    background:
                      quantidade <
                      produto.estoque
                        ? "white"
                        : "#eee",
                  }}
                >
                  +
                </button>
              </div>
            )}

            {/* =================================================
                COMPRAR
            ================================================= */}

            {produto.exclusiva && produto.estoque <= 0 ? (
              <div style={{margin:"20px 0",padding:"18px",background:"#fff8df",border:"2px solid #e4bd38",borderRadius:"10px"}}>
                <h3 style={{marginTop:0}}>⭐ Figurinha exclusiva</h3>
                {exclusivaAtual ? <><p>Ela já tem dono: <strong>{exclusivaAtual.dono_nome}</strong>. Faça uma oferta para tentar comprá-la.</p>{Number(exclusivaAtual.dono_id)!==Number(usuario?.id)?<><label style={{display:"block",fontWeight:"bold",marginBottom:"6px"}}>Quanto você quer oferecer?</label><input type="number" min="0.01" step="0.01" inputMode="decimal" value={valorOferta} onChange={e=>setValorOferta(e.target.value)} placeholder="Ex.: 15,00 CVT" style={{width:"100%",padding:"14px",boxSizing:"border-box",marginBottom:"10px",fontSize:"18px"}}/><label style={{display:"block",fontWeight:"bold",marginBottom:"6px"}}>Onde receber se a oferta for aceita?</label><select value={casaOferta} onChange={e=>setCasaOferta(e.target.value)} style={{width:"100%",padding:"14px",marginBottom:"10px",fontSize:"16px"}}><option value="">Selecione sua casa</option>{espacos.map(e=><option key={e.id} value={e.id}>{e.nome}</option>)}</select><button type="button" onClick={enviarOfertaExclusiva} disabled={enviandoOferta} style={{width:"100%",padding:"15px",fontWeight:"bold",fontSize:"18px"}}>{enviandoOferta?"Enviando...":"Enviar oferta"}</button></>:<p><strong>Esta figurinha é sua.</strong> As ofertas recebidas aparecem na sua casa.</p>}</>:<p>Não foi possível localizar o dono desta exclusiva. Atualize a página; se continuar assim, o vínculo da compra precisa ser corrigido.</p>}
              </div>
            ) : <button
              onClick={onComprar}
              disabled={produto.estoque <= 0}
              style={{
                width: "100%",
                padding: "17px",
                fontSize: "19px",
                fontWeight: "bold",
                cursor:
                  produto.estoque > 0
                    ? "pointer"
                    : "not-allowed",
                borderRadius: "10px",
                border: "none",
                background:
                  produto.estoque > 0
                    ? "#111"
                    : "#aaa",
                color: "white",
                boxShadow:
                  produto.estoque > 0
                    ? "0 4px 10px rgba(0,0,0,0.15)"
                    : "none",
              }}
            >
              {produto.estoque > 0
                ? "🛒 Comprar agora"
                : "Sem estoque"}
            </button>}

            {/* =================================================
                INFORMAÇÕES EXTRAS
            ================================================= */}

            <div
              style={{
                marginTop: "25px",
                padding: "20px",
                background: "#f8f8f8",
                borderRadius: "12px",
                fontSize: "15px",
                color: "#444",
                border: "1px solid #eee",
              }}
            >
              <p
                style={{
                  marginTop: "0",
                }}
              >
                🚚{" "}
                <strong>
                  Prazo de entrega:
                </strong>{" "}
                {produto.prazo_entrega_dias
                  ? `${produto.prazo_entrega_dias} dias`
                  : "A consultar"}
              </p>

              <p>
                📦{" "}
                <strong>
                  Disponibilidade:
                </strong>{" "}
                {produto.estoque > 0
                  ? "Produto disponível em estoque"
                  : "Produto sem estoque"}
              </p>

              <p>
                🔒{" "}
                <strong>
                  Compra segura
                </strong>
              </p>

              <p
                style={{
                  marginBottom: "0",
                }}
              >
                🛍️{" "}
                <strong>
                  Produto vendido pela VALT-ON
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            RODAPÉ DA PÁGINA
        ================================================= */}

        <div
          style={{
            textAlign: "center",
            padding: "25px 10px",
            color: "#777",
            fontSize: "14px",
          }}
        >
          VALT-ON • Sua loja online
        </div>
      </div>
      {relacionados.length>0&&<section className="valt-related"><h2>Você também pode gostar</h2><div className="valt-related-grid">{relacionados.map((item)=><button key={item.id} onClick={()=>onVerRelacionado?.(item)}><span>{item.imagem?<img src={obterUrlImagem(item.imagem)} alt="" loading="lazy"/>:"🛍️"}</span><strong>{item.nome}</strong><small>{formatarPreco(item.preco)}</small></button>)}</div></section>}
    </div>
  );
}

export default ProdutoDetalhes;