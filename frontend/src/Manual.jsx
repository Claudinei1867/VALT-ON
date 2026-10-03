import React from "react";

export default function Manual({ onVoltar }) {
  return (
    <main className="valt-manual">
      <div className="valt-manual-header">
        <button type="button" onClick={onVoltar}>
          ← Voltar à loja
        </button>
        <h1>📖 Manual VALT-ON</h1>
      </div>

      <section>
        <h2>👋 Bem-vindo ao VALT-ON</h2>
        <p>
          O VALT-ON é uma experiência virtual de compras e interação.
          Explore os produtos, organize suas casas, acompanhe suas compras
          e aproveite todos os recursos da plataforma.
        </p>
      </section>

      <section>
        <h2>💳 Créditos CVT</h2>
        <p>
          O CVT é o crédito utilizado dentro do VALT-ON.
        </p>
        <ul>
          <li>Ao se cadastrar, você recebe 1.000 CVT.</li>
          <li>Todo domingo, você recebe um bônus semanal de 500 CVT.</li>
          <li>Também é possível adquirir pacotes de CVT.</li>
        </ul>
      </section>

      <section>
        <h2>🛍️ Produtos</h2>
        <p>
          Os produtos do VALT-ON são virtuais e podem ser pesquisados,
          filtrados e adquiridos utilizando seus créditos CVT.
        </p>

        <h3>🔎 Categorias</h3>
        <p>Você pode encontrar produtos nas seguintes categorias:</p>

        <ul>
          <li>Celulares</li>
          <li>Informática</li>
          <li>Casa</li>
          <li>Moda</li>
          <li>Esportes</li>
          <li>Pet</li>
          <li>Infantil</li>
          <li>Decoração e Festas</li>
          <li>Tecnologia</li>
          <li>Instrumentos Musicais</li>
          <li>Automóveis e motos</li>
          <li>Cosméticos/Cuidados Pessoais</li>
          <li>Cama/Banho</li>
          <li>Eletroportáteis</li>
          <li>Bebidas</li>
          <li>Alimentos</li>
          <li>Escritório</li>
          <li>Ferramentas</li>
        </ul>
      </section>

      <section>
        <h2>🏠 Casas e espaço</h2>
        <p>
          Cada cliente possui uma casa para organizar seus produtos.
          É possível adquirir outras casas e ter quantas casas quiser.
        </p>

        <ul>
          <li><strong>Casa Pequena:</strong> gratuita — capacidade para 30 itens.</li>
          <li><strong>Casa Média:</strong> 3.000 CVT — capacidade para 80 itens.</li>
          <li><strong>Casa Grande:</strong> 5.000 CVT — capacidade para 150 itens.</li>
          <li><strong>Mansão Pro:</strong> 10.000 CVT — capacidade para 500 itens.</li>
        </ul>
      </section>

      <section>
        <h2>♻️ Produtos usados</h2>
        <p>
          Você pode colocar produtos usados à venda dentro da plataforma.
        </p>
        <ul>
          <li>O preço anunciado pode ser de até 80% do valor original.</li>
          <li>O vendedor escolhe o preço dentro desse limite.</li>
          <li>O vendedor recebe 60% do valor da venda.</li>
          <li>O VALT-ON fica com 40%.</li>
        </ul>
      </section>

      <section>
        <h2>🤝 Ofertas e propostas</h2>
        <p>
          Em produtos usados, o comprador pode comprar pelo preço anunciado
          ou fazer uma proposta ao vendedor.
        </p>
        <ul>
          <li>O vendedor pode aceitar a proposta.</li>
          <li>O vendedor pode rejeitar a proposta.</li>
        </ul>
      </section>

      <section>
        <h2>🎁 Indique um amigo</h2>
        <p>
          Ao se cadastrar, o novo cliente pode informar o número de cliente
          de quem o indicou.
        </p>
        <p>
          Depois que o novo cliente confirmar o cadastro, quem fez a indicação
          recebe 300 CVT.
        </p>
      </section>

      <section>
        <h2>🎁 Presentes</h2>
        <p>
          Você pode comprar produtos para presentear outro cliente do
          VALT-ON.
        </p>
        <ul>
          <li>O comprador escolhe o cliente que receberá o presente.</li>
          <li>O presente é destinado à casa do cliente que irá recebê-lo.</li>
          <li>É possível escolher uma embalagem para o presente.</li>
          <li>O comprador pode adicionar uma mensagem para o destinatário.</li>
          <li>O presente fica vinculado ao destinatário para que ele possa recebê-lo.</li>
        </ul>
      </section>

      <section>
        <h2>⭐ Figurinhas Exclusivas</h2>
        <p>
          As Figurinhas Exclusivas são itens especiais do VALT-ON,
          identificados como exclusivos e disponibilizados em quantidade
          limitada.
        </p>
        <ul>
          <li>Uma figurinha exclusiva possui estoque limitado.</li>
          <li>O valor original da figurinha é mantido para referência.</li>
          <li>Quando adquirida, a figurinha passa a fazer parte da casa do comprador.</li>
          <li>O proprietário pode receber propostas para transferência da figurinha.</li>
          <li>O proprietário pode aceitar ou rejeitar uma proposta.</li>
          <li>O crédito semanal corresponde a 3% do valor original da figurinha.</li>
          <li>Esse crédito é calculado às quartas-feiras, às 00h00.</li>
        </ul>
      </section>


      <section>
        <h2>📦 Acompanhamento das compras</h2>
        <p>As compras podem passar pelos seguintes status:</p>
        <ol>
          <li>Pago</li>
          <li>Preparando</li>
          <li>Enviado</li>
          <li>A caminho</li>
          <li>Entregue</li>
        </ol>
      </section>

      <section>
        <h2>💡 Sugestões</h2>
        <p>
          Utilize a área de sugestões para enviar ideias, informar problemas
          ou compartilhar opiniões sobre a plataforma.
        </p>
      </section>

      <section>
        <h2>👤 Minha conta</h2>
        <p>
          Na área Minha Conta você pode consultar suas informações,
          créditos, casas, produtos e outras funcionalidades disponíveis
          para o cliente.
        </p>
      </section>

      <section className="valt-manual-final">
        <h2>🎮 O VALT-ON é uma experiência virtual</h2>
        <p>
          O VALT-ON foi desenvolvido como uma <strong>experiência de compras
          virtuais e interativas</strong>.
        </p>
        <p>
          Os produtos, compras, figurinhas, casas, créditos CVT e entregas
          fazem parte do funcionamento do simulador e são utilizados dentro
          da plataforma.
        </p>
        <p>
          <strong>
            Divirta-se, explore os produtos, organize suas casas e aproveite
            sua experiência no VALT-ON!
          </strong>
        </p>
        <h3>💙 VALT-ON</h3>
        <p>
          <strong>Sua experiência de compras virtuais, do seu jeito!</strong>
        </p>
      </section>
    </main>
  );
}
