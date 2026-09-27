import React from "react";
import { CATEGORIAS } from "../categorias";

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

  const categorias = ["Todos", ...CATEGORIAS];

  return (
    <>
    <button type="button" className="valt-mobile-menu-toggle" aria-expanded={mostrarMenuMobile} aria-controls="valt-mobile-navigation" onClick={() => setMostrarMenuMobile((valor) => !valor)}>{mostrarMenuMobile ? "Ã¢Å“â€¢ Fechar menu" : "Ã¢ËœÂ° Menu"}</button>
    <nav id="valt-mobile-navigation" className={`valt-actions ${mostrarMenuMobile ? "valt-actions-open" : ""}`} aria-label="NavegaÃƒÂ§ÃƒÂ£o principal">
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
        Ã°Å¸â€œâ€š Categorias
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

      {/* Perfil acessÃƒÂ­vel no desktop e no celular, com saÃƒÂ­da explÃƒÂ­cita. */}
      {usuario ? (
        <div className="valt-profile-wrap">
          <button type="button" className="valt-profile-trigger" aria-haspopup="true" aria-expanded={mostrarPerfil} aria-controls="valt-profile-menu" onClick={() => setMostrarPerfil((valor) => !valor)}>
            Ã°Å¸â€˜Â¤ {usuario.nome || "Minha conta"} <span aria-hidden="true">Ã¢â€“Â¾</span>
          </button>
          {mostrarPerfil && (
            <div id="valt-profile-menu" className="valt-profile-menu" role="group" aria-label="OpÃƒÂ§ÃƒÂµes da conta">
              <button type="button" onClick={abrirConta}>Ã°Å¸â€˜Â¤ Minha conta</button>
              {usuario.admin && <button type="button" onClick={abrirAdmin}>Ã¢Å¡â„¢Ã¯Â¸Â Painel administrativo</button>}
              <button type="button" onClick={fecharMenus}>Ã°Å¸â€ºÂÃ¯Â¸Â Continuar na loja</button>
              <button type="button" className="valt-logout-button" onClick={sair}>Ã¢â€ Âª Sair da conta</button>
            </div>
          )}
        </div>
      ) : (
        <>
          <button type="button" onClick={() => { fecharMenus(); setMostrarLogin(true); }}>Ã°Å¸â€˜Â¤ Entrar</button>
          <button type="button" onClick={() => { fecharMenus(); setMostrarCadastro(true); }}>Ã°Å¸â€œâ€¹ Criar conta</button>
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
        Ã°Å¸â€ºâ€™ Produtos Usados
      </button>

      {/* SUGESTÃƒâ€¢ES */}

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
        Ã°Å¸â€™Â¡ SugestÃƒÂµes
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
        Ã°Å¸â€ºâ€™ Carrinho ({quantidadeCarrinho})
      </button>
    </nav>
  </>
  );
}