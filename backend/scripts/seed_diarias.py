"""Preenche a Diária Média (REQ 6) com uma série temporal artificial dos últimos
N dias (default 100) para cada hospedagem JÁ cadastrada.

Para cada hotel gera um preço-base conforme categoria/estrelas, com acréscimo de
fim de semana e ruído diário, e faz POST /diarias por dia. Registros já existentes
(409, mesma hospedagem+data) são pulados — seguro reexecutar.

Uso:
    python backend/scripts/seed_diarias.py [--api ...] [--dias 100] [--workers 8] [--dry-run]
"""
import argparse
import json
import random
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta

SERVIDOR = ("carlos.almeida@olimpia.sp.gov.br", "FQv_-UefzOwf")

# Preço-base de diária por hotel (R$), por CNPJ. Fallback calculado por categoria/estrelas.
BASE_POR_CNPJ = {
    "22.222.222/0001-22": 820,  # Celebration Resort 5*
    "44.444.444/0001-44": 890,  # Enjoy Olímpia Park Resort 5*
    "11.111.111/0001-11": 610,  # Hot Beach Olímpia 4*
    "00.000.000/0001-01": 780,  # Hot Beach Resort 5*
    "66.666.666/0001-66": 540,  # Ilhas do Lago Eco Resort 4*
    "88.888.888/0001-88": 290,  # Pousada Recanto da Cachoeira 3*
    "55.555.555/0001-55": 560,  # Solar das Águas Park Resort 4*
    "33.333.333/0001-33": 590,  # Thermas Park Resort & Spa 4*
    "77.777.777/0001-77": 520,  # Wyndham Gran Olímpia (Hotel) 4*
    "03.523.898/0001-70": 760,  # Wyndham Olímpia Royal Hotels 5*
}


def api(method, url, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read() or "null")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or "null")


def base_preco(h):
    if h["cnpj"] in BASE_POR_CNPJ:
        return BASE_POR_CNPJ[h["cnpj"]]
    bonus = {"Resort": 220, "Hotel": 120, "Pousada": 40}.get(h["categoria"], 100)
    return 120 + h["estrelas"] * 110 + bonus


def preco_do_dia(base, d, rng):
    fator = 1.0
    wd = d.weekday()  # 0=seg ... 6=dom
    if wd in (4, 5):       # sex/sáb
        fator *= rng.uniform(1.25, 1.42)
    elif wd == 6:          # dom
        fator *= rng.uniform(1.05, 1.15)
    fator *= rng.uniform(0.92, 1.08)  # ruído diário
    return round(base * fator, 2)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="http://localhost:8000")
    ap.add_argument("--dias", type=int, default=100)
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    st, body = api("POST", f"{args.api}/auth/login", {"email": SERVIDOR[0], "senha": SERVIDOR[1]})
    if st != 200:
        sys.exit(f"Falha no login ({st}): {body}")
    token = body["access_token"]

    st, hoteis = api("GET", f"{args.api}/hospedagens", token=token)
    if st != 200:
        sys.exit(f"Falha ao listar hospedagens ({st}): {hoteis}")

    hoje = date.today()
    dias = [hoje - timedelta(days=i) for i in range(args.dias)]
    print(f"{len(hoteis)} hotéis × {args.dias} dias = {len(hoteis) * args.dias} diárias")
    print(f"Período: {dias[-1].isoformat()} a {dias[0].isoformat()}")

    # Monta o plano de registros (um rng por hotel para séries reproduzíveis).
    plano = []
    for h in hoteis:
        rng = random.Random(f"{args.seed}-{h['cnpj']}")
        base = base_preco(h)
        precos = [preco_do_dia(base, d, rng) for d in dias]
        plano.append((h, base, precos))
        print(f"  {h['nome_fantasia']:<32} base R${base:>6.0f}  "
              f"(min {min(precos):.0f} / max {max(precos):.0f})")

    if args.dry_run:
        print("\n--dry-run: nada enviado.")
        return

    tarefas = []
    for h, base, precos in plano:
        for d, p in zip(dias, precos):
            tarefas.append((h["cnpj"], d.isoformat(), p))

    criados = pulados = erros = 0

    def enviar(t):
        cnpj, data, preco = t
        st, r = api("POST", f"{args.api}/diarias",
                    {"hospedagem_cnpj": cnpj, "data": data, "preco": preco}, token=token)
        return st, r

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        for st, r in ex.map(enviar, tarefas):
            if st == 201:
                criados += 1
            elif st == 409:
                pulados += 1
            else:
                erros += 1
                if erros <= 5:
                    print(f"  ✗ erro {st}: {r}")

    print(f"\nConcluído: {criados} criados, {pulados} já existiam, {erros} erros.")


if __name__ == "__main__":
    main()
