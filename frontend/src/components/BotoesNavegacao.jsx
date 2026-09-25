import React from "react";

export default function BotoesNavegacao({
  usuario,
  setMostrarConta,
  onLogout,
  setMostrarLogin,
  setMostrarCadastro,
  setMostrarAdmin,
  mostrarProdutosUsados,
  setMostrarProdutosUsados,
  carregarProdutosUsados,
  setMostrarSugestoes,
  mostrarCarrinho,
  setMostrarCarrinho,
  quantidadeCarrinho,
  categoria,
  setCategoria,
}) {
  const [mostrarCategorias, setMostrarCategorias] = React.useState(false);
  const [mostrarPerfil, setMostrarPerfil] = React.useState(false);
  const [mostrarMenuMobile, setMostrarMenuMobile] = React.useState(false);
  const fecharMenus = () => { setMostrarPerfil(false); setMostrarCategorias(false); setMostrarMenuMobile(false); };
  const abrirConta = () => { fecharMenus(); setMostrarConta(true); };
  const abrirAdmin = () => { fecharMenus(); setMostrarAdmin(true); };
  const sair = () => { fecharMenus(); onLogout(); };

  const categorias = [
    "Todos",
    "Celulares",
    "Informática",
    "Casa",
    "Moda",
    "Esportes",
    "Pet",
    "Infantil",
    "Enfeites",
    "Bebidas",
    "Alimentos",
    "Escritório",
    "Ferramentas",
  ];

  return (
    <>
    <button type="button" className="valt-mobile-menu-toggle" aria-expanded={mostrarMenuMobile} aria-controls="valt-mobile-navigation" onClick={() => setMostrarMenuMobile((valor) => !valor)}>{mostrarMenuMobile ? "✕ Fechar menu" : "☰ Menu"}</button>
    <nav id="valt-mobile-navigation" className={`valt-actions ${mostrarMenuMobile ? "valt-actions-open" : ""}`} aria-label="Navegação principal">
      <button
        aria-expanded={mostrarCategorias}
        onClick={() => setMostrarCategorias(!mostrarCategorias)}
        style={{
          padding: "7px 10px",
          fontSize: "12px",
          backgroundColor: "#000",
          color: "#fff",
          border: "1px solid #000",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        📂 Categorias
      </button>

      {mostrarCategorias && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "0",
            zIndex: 1000,
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(130px, 1fr))",
            gap: "6px",
            minWidth: "280px",
          }}
        >
          {categorias.map((nomeCategoria) => (
            <button
              key={nomeCategoria}
              onClick={() => {
                setCategoria(nomeCategoria);
                setMostrarCategorias(false);
              }}
              style={{
                padding: "8px 10px",
                fontSize: "14px",
                textAlign: "left",
                backgroundColor:
                  categoria === nomeCategoria ? "#000" : "#f5f5f5",
                color:
                  categoria === nomeCategoria ? "#fff" : "#222",
                border: "1px solid #ddd",
                borderRadius: "7px",
                cursor: "pointer",
              }}
            >
              {nomeCategoria}
            </button>
          ))}
        </div>
      )}

      {/* Perfil acessível no desktop e no celular, com saída explícita. */}
      {usuario ? (
        <div className="valt-profile-wrap">
          <button type="button" className="valt-profile-trigger" aria-haspopup="true" aria-expanded={mostrarPerfil} aria-controls="valt-profile-menu" onClick={() => setMostrarPerfil((valor) => !valor)}>
            👤 {usuario.nome || "Minha conta"} <span aria-hidden="true">▾</span>
          </button>
          {mostrarPerfil && (
            <div id="valt-profile-menu" className="valt-profile-menu" role="group" aria-label="Opções da conta">
              <button type="button" onClick={abrirConta}>👤 Minha conta</button>
              {usuario.admin && <button type="button" onClick={abrirAdmin}>⚙️ Painel administrativo</button>}
              <button type="button" onClick={fecharMenus}>🛍️ Continuar na loja</button>
              <button type="button" className="valt-logout-button" onClick={sair}>↪ Sair da conta</button>
            </div>
          )}
        </div>
      ) : (
        <>
          <button type="button" onClick={() => { fecharMenus(); setMostrarLogin(true); }}>👤 Entrar</button>
          <button type="button" onClick={() => { fecharMenus(); setMostrarCadastro(true); }}>📋 Criar conta</button>
        </>
      )}

      {/* PRODUTOS USADOS */}

      <button
        onClick={() => {
          const novoEstado = !mostrarProdutosUsados;

          fecharMenus();
          setMostrarProdutosUsados(novoEstado);

          if (novoEstado) {
            carregarProdutosUsados();
          }
        }}
        style={{
          padding: "7px 10px",
          fontSize: "12px",
          backgroundColor: "#000",
          color: "#fff",
          border: "1px solid #000",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        🛒 Produtos Usados
      </button>

      {/* SUGESTÕES */}

      <button
        onClick={() => { fecharMenus(); setMostrarSugestoes(true); }}
        style={{
          padding: "7px 10px",
          fontSize: "12px",
          backgroundColor: "#000",
          color: "#fff",
          border: "1px solid #000",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        💡 Sugestões
      </button>

      {/* CARRINHO */}

      <button
        aria-expanded={mostrarCarrinho}
        onClick={() => { fecharMenus(); setMostrarCarrinho(!mostrarCarrinho); }}
        style={{
          padding: "7px 10px",
          fontSize: "12px",
          backgroundColor: "#000",
          color: "#fff",
          border: "1px solid #000",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        🛒 Carrinho ({quantidadeCarrinho})
      </button>
    </nav>
  </>
  );
}