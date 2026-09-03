import { useState } from "react";
import "./App.css";

function App() {
  const [texto, setTexto] = useState("");

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>VALT-ON - TESTE</h1>

      <input
        type="text"
        placeholder="Digite alguma coisa"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        style={{
          padding: "12px",
          width: "300px",
          fontSize: "18px",
        }}
      />

      <h2>Você digitou: {texto}</h2>
    </div>
  );
}

export default App;