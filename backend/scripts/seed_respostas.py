"""Preenche as pesquisas com respostas artificiais plausíveis.

Para cada pesquisa alvo: garante uma edição ATIVA e envia respostas até atingir
a meta (default 40). Pesquisas `campo` usam o fluxo do pesquisador (token
pesquisador_campo, coletores rotacionados); pesquisas `publica` enviam anônimo.

É seguro reexecutar: reaproveita a edição ativa e só completa o que falta.

Uso:
    python backend/scripts/seed_respostas.py [--api ...] [--meta 40] \
        [--ids 12,13,14] [--dry-run]
"""
import argparse
import json
import random
import sys
import urllib.error
import urllib.request
from datetime import date, timedelta

SERVIDOR = ("carlos.almeida@olimpia.sp.gov.br", "FQv_-UefzOwf")
# Apenas os pesquisadores efetivamente cadastrados no banco (validado via login).
PESQUISADORES = [
    ("ana.silva@olimpia.sp.gov.br", "eiDOU85leNZo"),
    ("bruno.lima@olimpia.sp.gov.br", "X3ZygfnzmyZf"),
    ("camila.nunes@olimpia.sp.gov.br", "ZYLnzE-1Py8j"),
]

CIDADES = [
    "São Paulo", "Campinas", "Ribeirão Preto", "São José do Rio Preto", "Barretos",
    "Bauru", "Sorocaba", "Santos", "Belo Horizonte", "Uberlândia", "Rio de Janeiro",
    "Curitiba", "Goiânia", "Brasília", "Olímpia", "Catanduva", "Araraquara",
    "Franca", "Marília", "Presidente Prudente", "Jundiaí", "Piracicaba",
]
HOTEIS = [
    "Thermas Park Resort", "Hot Beach Suítes", "Enjoy Olímpia Park Resort",
    "Pousada Recanto das Águas", "Hotel Central Olímpia", "Solar das Andorinhas",
    "Wyndham Olímpia", "Celebration Resort", "Pousada Sol Nascente",
    "Hotel Fazenda Bela Vista", "Royal Palm Plaza", "Comfort Olímpia",
]
NOMES = ["Maria", "José", "Ana", "João", "Carla", "Pedro", "Luana", "Rafael",
         "Beatriz", "Lucas", "Fernanda", "Marcos", "Patrícia", "Bruno"]
FALTA = [
    "Mais opções de estacionamento.", "Melhorar a sinalização turística.",
    "Mais atrações para crianças.", "Preços mais acessíveis na alta temporada.",
    "Transporte público mais frequente.", "Nada, gostei de tudo!",
    "Mais opções gastronômicas no centro.", "Melhor acessibilidade para PCD.",
    "Já está ótimo.", "Mais áreas verdes e sombra.",
]
DESTINOS = ["Caldas Novas", "Águas de Lindóia", "Praia Grande", "Brotas",
            "Ubatuba", "Foz do Iguaçu", "Gramado"]


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


def login(api_url, email, senha):
    st, body = api("POST", f"{api_url}/auth/login", {"email": email, "senha": senha})
    if st != 200:
        sys.exit(f"Falha no login de {email} ({st}): {body}")
    return body["access_token"]


def valor_para_campo(campo, estado):
    """Gera um atributo_texto plausível para um campo, conforme tipo + semântica."""
    q = campo["texto_pergunta"].lower()
    tipo = campo["tipo"]

    if tipo == "multipla_escolha":
        return random.choice(campo["opcoes"]) if campo["opcoes"] else ""

    if tipo == "data":
        if "partida" in q and estado.get("chegada"):
            d = estado["chegada"] + timedelta(days=random.randint(1, 7))
        else:
            d = date.today() - timedelta(days=random.randint(1, 50))
            estado["chegada"] = d
        return d.isoformat()

    if tipo in ("texto", "texto_longo"):
        if "nome fantasia" in q or "hospedagem" in q and "meio" in q:
            return random.choice(HOTEIS)
        if "cidade" in q:
            return random.choice(CIDADES)
        if "mail" in q:
            return f"{random.choice(NOMES).lower()}{random.randint(1,99)}@exemplo.com"
        if "destino" in q:
            return ", ".join(random.sample(DESTINOS, random.randint(1, 2)))
        if "falta" in q or "melhor" in q:
            return random.choice(FALTA)
        return random.choice(FALTA)

    if tipo == "numero":
        if "escala de 0 a 10" in q or "nota" in q or "recomendaria" in q:
            return str(random.choices([7, 8, 9, 10, 6, 5], weights=[3, 4, 4, 5, 2, 1])[0])
        if "idade" in q:
            return str(random.randint(18, 75))
        if "percentual" in q or "taxa de ocupação" in q:
            return str(random.randint(45, 100))
        if "vagas" in q or "contratação" in q:
            return str(random.randint(0, 25))
        if "0 a 12" in q or "13 a 17" in q:
            return str(random.randint(0, 2))
        if "acompanhantes" in q:
            return str(random.randint(0, 3))
        if "quantas pessoas" in q and "deficiência" in q:
            return str(random.randint(0, 1))
        if "renda familiar" in q:
            return str(random.choice([1800, 2500, 3500, 5000, 7000, 9000, 12000]))
        if "quantas pessoas" in q or "inclusas" in q or "dependem" in q:
            return str(random.randint(1, 5))
        return str(random.randint(0, 10))

    return random.choice(FALTA)


def gerar_resposta(campos):
    estado = {}
    itens = []
    for c in campos:
        q = c["texto_pergunta"].lower()
        # Perguntas condicionais ("Se a resposta anterior...", "Pular se...") e
        # opcionais: preenche só às vezes, para não ficar tudo respondido.
        condicional = ("se a resposta anterior" in q or "caso tenha respondido" in q
                       or "pular se" in q)
        if (condicional or not c["obrigatorio"]) and random.random() < 0.6:
            continue
        itens.append({"campo_id": c["id"], "atributo_texto": valor_para_campo(c, estado)})
    if not itens:  # garante ao menos um campo
        c = campos[0]
        itens.append({"campo_id": c["id"], "atributo_texto": valor_para_campo(c, {})})
    return {"respostas": itens}


def garantir_edicao_ativa(api_url, token, pesquisa_id):
    st, edicoes = api("GET", f"{api_url}/pesquisas/{pesquisa_id}/edicoes")
    for e in edicoes or []:
        if e["status"] == "ativa":
            return e
    abertura = (date.today() - timedelta(days=30)).isoformat()
    st, e = api("POST", f"{api_url}/pesquisas/{pesquisa_id}/edicoes",
                {"data_abertura": abertura, "data_fechamento": None}, token=token)
    if st != 201:
        sys.exit(f"Falha ao lançar edição da pesquisa {pesquisa_id} ({st}): {e}")
    return e


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="http://localhost:8000")
    ap.add_argument("--meta", type=int, default=40)
    ap.add_argument("--ids", default="12,13,14")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()
    random.seed(args.seed)

    ids = [int(x) for x in args.ids.split(",")]
    serv_token = login(args.api, *SERVIDOR)
    pesq_tokens = [login(args.api, *p) for p in PESQUISADORES] if not args.dry_run else []

    st, todas = api("GET", f"{args.api}/pesquisas")
    by_id = {p["id"]: p for p in todas}

    for pid in ids:
        p = by_id.get(pid)
        if not p:
            print(f"  ✗ pesquisa {pid} não encontrada"); continue
        edicao = garantir_edicao_ativa(args.api, serv_token, pid)
        eid = edicao["id"]
        existentes = edicao.get("total_respostas", 0)
        faltam = max(0, args.meta - existentes)
        print(f"Pesquisa {pid} [{p['tipo']}] '{p['nome']}': edição {eid} "
              f"({existentes} respostas, enviando {faltam})")

        st, campos = api("GET", f"{args.api}/edicoes/{eid}/campos")
        if args.dry_run:
            ex = gerar_resposta(campos)
            print(f"    exemplo: {len(ex['respostas'])} campos preenchidos")
            continue

        ok = 0
        for i in range(faltam):
            corpo = gerar_resposta(campos)
            if p["tipo"] == "campo":
                tok = pesq_tokens[i % len(pesq_tokens)]
                st, r = api("POST", f"{args.api}/pesquisador/edicoes/{eid}/respostas",
                            corpo, token=tok)
            else:
                st, r = api("POST", f"{args.api}/edicoes/{eid}/respostas", corpo)
            if st == 201:
                ok += 1
            else:
                print(f"    ✗ resposta {i} erro {st}: {r}")
        print(f"    ✓ {ok}/{faltam} respostas enviadas")


if __name__ == "__main__":
    main()
