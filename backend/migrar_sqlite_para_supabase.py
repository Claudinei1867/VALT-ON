import sqlite3
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


# ============================================================
# CONFIGURAÇÃO
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
SQLITE_DB = BASE_DIR / "valt_on.db"

load_dotenv(BASE_DIR / ".env")

import os

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL não encontrada no arquivo .env")


# ============================================================
# CONEXÕES
# ============================================================

sqlite_conn = sqlite3.connect(SQLITE_DB)
sqlite_conn.row_factory = sqlite3.Row

engine = create_engine(DATABASE_URL)


# ============================================================
# MAPAS DE IDs
# ============================================================

cliente_map = {}
produto_map = {}
pedido_map = {}


# ============================================================
# FUNÇÃO AUXILIAR
# ============================================================

def obter_prazo_pedido(sqlite_cur, pedido_id):
    """
    Obtém o prazo de entrega do primeiro produto do pedido.
    Se não houver item, usa 3 dias.
    """

    row = sqlite_cur.execute(
        """
        SELECT p.prazo_entrega_dias
        FROM itens_pedido i
        JOIN produtos p ON p.id = i.produto_id
        WHERE i.pedido_id = ?
        ORDER BY i.id
        LIMIT 1
        """,
        (pedido_id,),
    ).fetchone()

    if row and row["prazo_entrega_dias"] is not None:
        return int(row["prazo_entrega_dias"])

    return 3


# ============================================================
# MIGRAÇÃO
# ============================================================

print()
print("=" * 60)
print("ATENÇÃO: MIGRAÇÃO SQLITE → SUPABASE")
print("=" * 60)
print()
print("Esta operação irá INSERIR os dados do SQLite no Supabase.")
print("Os registros que já existem no Supabase serão preservados.")
print()

confirmacao = input(
    "Digite MIGRAR para confirmar ou qualquer outra coisa para cancelar: "
)

if confirmacao.strip() != "MIGRAR":
    print()
    print("Migração cancelada pelo usuário.")
    sqlite_conn.close()
    raise SystemExit(0)

print()
print("Confirmação recebida. Iniciando migração...")
print()

try:
    sqlite_cur = sqlite_conn.cursor()

    with engine.begin() as conn:

        print()
        print("=" * 60)
        print("INICIANDO MIGRAÇÃO SQLITE → SUPABASE")
        print("=" * 60)
        print()

        # ----------------------------------------------------
        # 1. CLIENTES
        # ----------------------------------------------------

        clientes = sqlite_cur.execute(
            """
            SELECT
                id,
                nome,
                email,
                senha,
                saldo_cvt,
                ultimo_credito_cvt
            FROM clientes
            ORDER BY id
            """
        ).fetchall()

        print(f"Clientes encontrados: {len(clientes)}")

        for cliente in clientes:

            result = conn.execute(
                text(
                    """
                    INSERT INTO clientes (
                        nome,
                        email,
                        senha,
                        saldo_cvt,
                        ultimo_credito_cvt
                    )
                    VALUES (
                        :nome,
                        :email,
                        :senha,
                        :saldo_cvt,
                        :ultimo_credito_cvt
                    )
                    RETURNING id
                    """
                ),
                {
                    "nome": cliente["nome"],
                    "email": cliente["email"],
                    "senha": cliente["senha"],
                    "saldo_cvt": cliente["saldo_cvt"],
                    "ultimo_credito_cvt": cliente["ultimo_credito_cvt"],
                },
            )

            novo_id = result.scalar_one()

            cliente_map[cliente["id"]] = novo_id

            print(
                f"  Cliente local {cliente['id']} "
                f"→ Supabase {novo_id}"
            )

        # ----------------------------------------------------
        # 2. PRODUTOS
        # ----------------------------------------------------

        produtos = sqlite_cur.execute(
            """
            SELECT
                id,
                nome,
                descricao,
                preco,
                categoria,
                estoque,
                imagem,
                prazo_entrega_dias
            FROM produtos
            ORDER BY id
            """
        ).fetchall()

        print()
        print(f"Produtos encontrados: {len(produtos)}")

        for produto in produtos:

            prazo = produto["prazo_entrega_dias"]

            if prazo is None:
                prazo = 3

            result = conn.execute(
                text(
                    """
                    INSERT INTO produtos (
                        nome,
                        descricao,
                        preco,
                        categoria,
                        estoque,
                        imagem,
                        prazo_entrega
                    )
                    VALUES (
                        :nome,
                        :descricao,
                        :preco,
                        :categoria,
                        :estoque,
                        :imagem,
                        :prazo_entrega
                    )
                    RETURNING id
                    """
                ),
                {
                    "nome": produto["nome"],
                    "descricao": produto["descricao"],
                    "preco": produto["preco"],
                    "categoria": produto["categoria"],
                    "estoque": produto["estoque"],
                    "imagem": produto["imagem"],
                    "prazo_entrega": prazo,
                },
            )

            novo_id = result.scalar_one()

            produto_map[produto["id"]] = novo_id

            print(
                f"  Produto local {produto['id']} "
                f"→ Supabase {novo_id}: {produto['nome']}"
            )

        # ----------------------------------------------------
        # 3. PEDIDOS
        # ----------------------------------------------------

        pedidos = sqlite_cur.execute(
            """
            SELECT
                id,
                cliente_id,
                status,
                total
            FROM pedidos
            ORDER BY id
            """
        ).fetchall()

        print()
        print(f"Pedidos encontrados: {len(pedidos)}")

        for pedido in pedidos:

            cliente_id_local = pedido["cliente_id"]

            if cliente_id_local is None:
                cliente_id_supabase = None
            else:
                if cliente_id_local not in cliente_map:
                    raise RuntimeError(
                        f"Cliente local {cliente_id_local} "
                        f"não possui mapeamento."
                    )

                cliente_id_supabase = cliente_map[cliente_id_local]

            prazo = obter_prazo_pedido(
                sqlite_cur,
                pedido["id"],
            )

            result = conn.execute(
                text(
                    """
                    INSERT INTO pedidos (
                        cliente_id,
                        status,
                        total,
                        prazo_entrega
                    )
                    VALUES (
                        :cliente_id,
                        :status,
                        :total,
                        :prazo_entrega
                    )
                    RETURNING id
                    """
                ),
                {
                    "cliente_id": cliente_id_supabase,
                    "status": pedido["status"],
                    "total": pedido["total"],
                    "prazo_entrega": prazo,
                },
            )

            novo_id = result.scalar_one()

            pedido_map[pedido["id"]] = novo_id

            print(
                f"  Pedido local {pedido['id']} "
                f"→ Supabase {novo_id}"
            )

        # ----------------------------------------------------
        # 4. ITENS DOS PEDIDOS
        # ----------------------------------------------------

        itens = sqlite_cur.execute(
            """
            SELECT
                id,
                pedido_id,
                produto_id,
                quantidade,
                preco_unitario
            FROM itens_pedido
            ORDER BY id
            """
        ).fetchall()

        print()
        print(f"Itens encontrados: {len(itens)}")

        for item in itens:

            if item["pedido_id"] not in pedido_map:
                raise RuntimeError(
                    f"Pedido local {item['pedido_id']} "
                    f"não possui mapeamento."
                )

            if item["produto_id"] not in produto_map:
                raise RuntimeError(
                    f"Produto local {item['produto_id']} "
                    f"não possui mapeamento."
                )

            conn.execute(
                text(
                    """
                    INSERT INTO itens_pedido (
                        pedido_id,
                        produto_id,
                        quantidade,
                        preco_unitario
                    )
                    VALUES (
                        :pedido_id,
                        :produto_id,
                        :quantidade,
                        :preco_unitario
                    )
                    """
                ),
                {
                    "pedido_id": pedido_map[item["pedido_id"]],
                    "produto_id": produto_map[item["produto_id"]],
                    "quantidade": item["quantidade"],
                    "preco_unitario": item["preco_unitario"],
                },
            )

            print(
                f"  Item local {item['id']} "
                f"→ pedido {pedido_map[item['pedido_id']]} "
                f"/ produto {produto_map[item['produto_id']]}"
            )

        # ----------------------------------------------------
        # 5. ESPAÇOS DOS CLIENTES
        # ----------------------------------------------------

        espacos = sqlite_cur.execute(
            """
            SELECT
                id,
                cliente_id,
                tipo,
                nome,
                valor,
                adquirido
            FROM espacos_cliente
            ORDER BY id
            """
        ).fetchall()

        print()
        print(f"Espaços encontrados: {len(espacos)}")

        for espaco in espacos:

            if espaco["cliente_id"] not in cliente_map:
                raise RuntimeError(
                    f"Cliente local {espaco['cliente_id']} "
                    f"não possui mapeamento."
                )

            conn.execute(
                text(
                    """
                    INSERT INTO espacos_clientes (
                        cliente_id,
                        tipo,
                        nome,
                        valor,
                        adquirido
                    )
                    VALUES (
                        :cliente_id,
                        :tipo,
                        :nome,
                        :valor,
                        :adquirido
                    )
                    """
                ),
                {
                    "cliente_id": cliente_map[espaco["cliente_id"]],
                    "tipo": espaco["tipo"],
                    "nome": espaco["nome"],
                    "valor": espaco["valor"],
                    "adquirido": espaco["adquirido"],
                },
            )

            print(
                f"  Espaço local {espaco['id']} "
                f"→ cliente Supabase "
                f"{cliente_map[espaco['cliente_id']]}"
            )

        # ----------------------------------------------------
        # 6. VALIDAÇÃO DENTRO DA TRANSAÇÃO
        # ----------------------------------------------------

        print()
        print("=" * 60)
        print("VALIDAÇÃO")
        print("=" * 60)

        total_clientes = conn.execute(
            text("SELECT COUNT(*) FROM clientes")
        ).scalar_one()

        total_produtos = conn.execute(
            text("SELECT COUNT(*) FROM produtos")
        ).scalar_one()

        total_pedidos = conn.execute(
            text("SELECT COUNT(*) FROM pedidos")
        ).scalar_one()

        total_itens = conn.execute(
            text("SELECT COUNT(*) FROM itens_pedido")
        ).scalar_one()

        total_espacos = conn.execute(
            text("SELECT COUNT(*) FROM espacos_clientes")
        ).scalar_one()

        print(f"Clientes no Supabase: {total_clientes}")
        print(f"Produtos no Supabase: {total_produtos}")
        print(f"Pedidos no Supabase: {total_pedidos}")
        print(f"Itens no Supabase: {total_itens}")
        print(f"Espaços no Supabase: {total_espacos}")

        print()
        print("Migração concluída dentro da transação.")
        print("A transação será confirmada agora.")


except Exception as erro:

    print()
    print("=" * 60)
    print("ERRO NA MIGRAÇÃO")
    print("=" * 60)
    print()
    print(erro)
    print()
    print("Nenhuma alteração desta execução foi confirmada.")
    raise

finally:

    sqlite_conn.close()

    print()
    print("=" * 60)
    print("FIM DO PROCESSO")
    print("=" * 60)