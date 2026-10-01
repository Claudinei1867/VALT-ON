import pacote1 from "./pacote-presente-1.jpeg";
import pacote2 from "./pacote-presente-2.jpeg";
import pacote3 from "./pacote-presente-3.jpeg";

const embalagens = [
  { id: "pacote1", imagem: pacote1 },
  { id: "pacote2", imagem: pacote2 },
  { id: "pacote3", imagem: pacote3 },
];

export default function EscolhaEmbalagemPresente({
  embalagemSelecionada,
  onSelecionar,
}) {
  return (
    <div style={{ marginTop: "15px" }}>
      <div
        style={{
          fontWeight: "bold",
          marginBottom: "10px",
        }}
      >
        Escolha a embalagem do presente:
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {embalagens.map((embalagem) => (
          <button
            key={embalagem.id}
            type="button"
            onClick={() => onSelecionar(embalagem.id)}
            style={{
              padding: "5px",
              borderRadius: "10px",
              border:
                embalagemSelecionada === embalagem.id
                  ? "3px solid #000"
                  : "2px solid #ccc",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
          >
            <img
              src={embalagem.imagem}
              alt={`Embalagem ${embalagem.id}`}
              style={{
                width: "80px",
                height: "80px",
                objectFit: "contain",
                display: "block",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
