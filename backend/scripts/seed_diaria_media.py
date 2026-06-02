"""
Seed de DEMONSTRAÇÃO para a Diária Média (REQ 6).

⚠️  Dados de demonstração — NÃO é cadastro oficial:
    - Nomes de hotéis são reais (polo turístico de Olímpia/SP), mas
    - CNPJs são FICTÍCIOS (apenas no formato válido),
    - preços são ILUSTRATIVOS,
    - fotos são placeholders determinísticos (picsum.photos).

Idempotente: hospedagem/diária que já existir é pulada.
Uso:  cd backend && python scripts/seed_diaria_media.py
"""

import sys
from datetime import date, timedelta
from pathlib import Path

# Permite rodar como script direto (adiciona a raiz do backend ao path)
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal  # noqa: E402
from app.models.hospedagem import Hospedagem  # noqa: E402
from app.models.diaria_media import DiariaMedia  # noqa: E402


def _foto(slug: str) -> str:
    return f"https://picsum.photos/seed/{slug}/600/400"


def _booking(nome: str) -> str:
    return "https://www.booking.com/searchresults.html?ss=" + nome.replace(" ", "+")


# (cnpj FICTÍCIO, nome, local, categoria, estrelas, quartos, slug_foto)
HOSPEDAGENS = [
    ("11.111.111/0001-11", "Hot Beach Olímpia",            "Av. dos Expedicionários, Olímpia/SP", "Resort",  4, 430, "hotbeach"),
    ("22.222.222/0001-22", "Celebration Resort Olímpia",   "Rod. Assis Chateaubriand, Olímpia/SP", "Resort", 5, 380, "celebration"),
    ("33.333.333/0001-33", "Thermas Park Resort & Spa",    "Av. Luiz Lopes Bisneto, Olímpia/SP",   "Resort",  4, 250, "thermaspark"),
    ("44.444.444/0001-44", "Enjoy Olímpia Park Resort",    "Rod. Assis Chateaubriand, Olímpia/SP", "Resort", 5, 410, "enjoy"),
    ("55.555.555/0001-55", "Solar das Águas Park Resort",  "Av. Princesa do Oeste, Olímpia/SP",    "Resort",  4, 300, "solar"),
    ("66.666.666/0001-66", "Ilhas do Lago Eco Resort",     "Rod. Olímpia–Guapiaçu, Olímpia/SP",    "Resort",  4, 180, "ilhasdolago"),
    ("77.777.777/0001-77", "Wyndham Gran Olímpia",         "Av. dos Expedicionários, Olímpia/SP",  "Hotel",   4, 220, "wyndham"),
    ("88.888.888/0001-88", "Pousada Recanto da Cachoeira", "Centro, Olímpia/SP",                   "Pousada", 3,  28, "recanto"),
]

# Preço ilustrativo (R$) por hotel para datas recentes. Alguns ficam SEM registro
# de hoje de propósito, para a aba "Pendentes de hoje" ter o que mostrar.
PRECOS_HOJE = {
    "11.111.111/0001-11": 689.90,
    "22.222.222/0001-22": 845.00,
    "33.333.333/0001-33": 520.00,
    "44.444.444/0001-44": 910.50,
    "55.555.555/0001-55": 470.00,
    # 66 / 77 / 88 ficam pendentes de hoje
}
PRECOS_ONTEM = {
    "11.111.111/0001-11": 659.00,
    "22.222.222/0001-22": 820.00,
    "66.666.666/0001-66": 540.00,
    "77.777.777/0001-77": 399.00,
}


def main() -> None:
    db = SessionLocal()
    novas_hosp = novas_diarias = 0
    try:
        for cnpj, nome, local, categoria, estrelas, quartos, slug in HOSPEDAGENS:
            if db.get(Hospedagem, cnpj):
                continue
            db.add(Hospedagem(
                cnpj=cnpj, nome_fantasia=nome, local=local, categoria=categoria,
                estrelas=estrelas, quartos=quartos,
                url_booking=_booking(nome), foto_url=_foto(slug),
            ))
            novas_hosp += 1
        db.commit()

        hoje = date.today()
        ontem = hoje - timedelta(days=1)
        for cnpj, preco in PRECOS_HOJE.items():
            novas_diarias += _add_diaria(db, cnpj, hoje, preco)
        for cnpj, preco in PRECOS_ONTEM.items():
            novas_diarias += _add_diaria(db, cnpj, ontem, preco)
        db.commit()

        print(f"OK — {novas_hosp} hospedagens novas, {novas_diarias} diárias novas inseridas.")
        print(f"Total no banco: {db.query(Hospedagem).count()} hospedagens, "
              f"{db.query(DiariaMedia).count()} diárias.")
    finally:
        db.close()


def _add_diaria(db, cnpj: str, dia: date, preco: float) -> int:
    existe = (
        db.query(DiariaMedia)
        .filter(DiariaMedia.hospedagem_cnpj == cnpj, DiariaMedia.data == dia)
        .first()
    )
    if existe:
        return 0
    db.add(DiariaMedia(hospedagem_cnpj=cnpj, data=dia, preco=preco))
    return 1


if __name__ == "__main__":
    main()
