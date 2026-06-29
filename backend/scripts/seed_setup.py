#!/usr/bin/env python3
"""
seed_setup.py — Reconfigura o banco com dados realistas.

Ações:
  1. Apaga pesquisas de teste (ids 15, 16, 17)
  2. Pesquisa 13 (Taxa de Ocupação): adiciona edições por evento sazonal
  3. Pesquisa 14 (Percepção do Turismo): preenche edições existentes + adiciona novas
  4. Cria 'Perfil da Demanda Turística' (publica, 6 edições)
  5. Cria 'Perfil do Visitante — Coleta in loco' (campo, 5 edições)
  6. Cria 'Avaliação dos Serviços Turísticos' (campo, 3 edições)

Uso:
  python backend/scripts/seed_setup.py [--api http://localhost:8000]
"""

import argparse
import json
import random
import sys
import urllib.error
import urllib.request
from datetime import date, timedelta

SERVIDOR = ("carlos.almeida@olimpia.sp.gov.br", "FQv_-UefzOwf")
PESQUISADORES = [
    ("ana.silva@olimpia.sp.gov.br",    "eiDOU85leNZo"),
    ("bruno.lima@olimpia.sp.gov.br",   "X3ZygfnzmyZf"),
    ("camila.nunes@olimpia.sp.gov.br", "ZYLnzE-1Py8j"),
]

CIDADES = [
    "São Paulo", "Campinas", "Ribeirão Preto", "São José do Rio Preto", "Barretos",
    "Bauru", "Sorocaba", "Santos", "Belo Horizonte", "Uberlândia", "Rio de Janeiro",
    "Curitiba", "Goiânia", "Brasília", "Olímpia", "Catanduva", "Araraquara",
    "Franca", "Marília", "Presidente Prudente", "Jundiaí", "Piracicaba",
    "São Carlos", "Limeira", "Guarulhos", "Aparecida", "Botucatu", "Araçatuba",
    "São José dos Campos", "Taubaté", "Americana", "Votuporanga",
]
HOTEIS = [
    "Thermas Park Resort", "Hot Beach Suítes", "Enjoy Olímpia Park Resort",
    "Pousada Recanto das Águas", "Hotel Central Olímpia", "Solar das Andorinhas",
    "Wyndham Olímpia", "Celebration Resort", "Pousada Sol Nascente",
    "Hotel Fazenda Bela Vista", "Royal Palm Plaza", "Comfort Olímpia",
    "Ibis Olímpia", "Gran Hotel Termas", "Pousada dos Girassóis",
    "Thermas Water Park Hotel", "Hotel Riviera", "Pousada Família Feliz",
]
NOMES = [
    "Maria", "José", "Ana", "João", "Carla", "Pedro", "Luana", "Rafael",
    "Beatriz", "Lucas", "Fernanda", "Marcos", "Patrícia", "Bruno",
    "Camila", "Eduardo", "Juliana", "Roberto", "Tatiane", "Augusto",
]
FALTA = [
    "Mais opções de estacionamento.", "Melhorar a sinalização turística.",
    "Mais atrações para crianças.", "Preços mais acessíveis na alta temporada.",
    "Transporte público mais frequente.", "Nada, gostei de tudo!",
    "Mais opções gastronômicas no centro.", "Melhor acessibilidade para PCD.",
    "Já está ótimo.", "Mais áreas verdes e sombra.",
    "Ônibus intermunicipais com horários mais frequentes.",
    "Mais parques aquáticos com preços populares.",
    "Programação cultural mais variada.",
    "Melhorar o saneamento básico perto dos atrativos.",
    "Mais guias turísticos qualificados disponíveis.",
]
ESTADOS = [
    "Acre (AC)", "Alagoas (AL)", "Amapá (AP)", "Amazonas (AM)", "Bahia (BA)",
    "Ceará (CE)", "Distrito Federal (DF)", "Espírito Santo (ES)", "Goiás (GO)",
    "Maranhão (MA)", "Mato Grosso (MT)", "Mato Grosso do Sul (MS)",
    "Minas Gerais (MG)", "Pará (PA)", "Paraíba (PB)", "Paraná (PR)",
    "Pernambuco (PE)", "Piauí (PI)", "Rio de Janeiro (RJ)",
    "Rio Grande do Norte (RN)", "Rio Grande do Sul (RS)", "Rondônia (RO)",
    "Roraima (RR)", "Santa Catarina (SC)", "São Paulo (SP)", "Sergipe (SE)",
    "Tocantins (TO)", "Residente Exterior",
]
DESTINOS = [
    "Caldas Novas", "Águas de Lindóia", "Praia Grande", "Brotas",
    "Ubatuba", "Foz do Iguaçu", "Gramado", "Florianópolis",
    "Aparecida", "Bonito",
]


# ─── helpers de HTTP ─────────────────────────────────────────────────────────

def api(method, url, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw or b"null")
        except Exception:
            return e.code, {"_raw": raw.decode("utf-8", errors="replace")[:300]}


def login(api_url, email, senha):
    st, body = api("POST", f"{api_url}/auth/login", {"email": email, "senha": senha})
    if st != 200:
        sys.exit(f"Falha no login de {email} ({st}): {body}")
    return body["access_token"]


# ─── geração de respostas ────────────────────────────────────────────────────

def valor_para_campo(campo, estado):
    q   = campo["texto_pergunta"].lower()
    tip = campo["tipo"]

    if tip == "multipla_escolha":
        opts = campo.get("opcoes") or []
        if not opts:
            return ""
        positivos = {"excelente", "ótimo", "sim", "concordo totalmente",
                     "muito satisfeito", "sim, com certeza", "sim, com certeza!",
                     "sim, definitivamente"}
        if opts[0].lower() in positivos:
            weights = ([5, 4, 3, 2, 1] + [1] * max(0, len(opts) - 5))[:len(opts)]
        else:
            weights = None
        return random.choices(opts, weights=weights)[0]

    if tip == "data":
        if "partida" in q and estado.get("chegada"):
            d = estado["chegada"] + timedelta(days=random.randint(1, 7))
        else:
            d = date.today() - timedelta(days=random.randint(1, 50))
            estado["chegada"] = d
        return d.isoformat()

    if tip in ("texto", "texto_longo"):
        if "nome fantasia" in q or ("hospedagem" in q and "meio" in q):
            return random.choice(HOTEIS)
        if "cidade" in q:
            return random.choice(CIDADES)
        if "mail" in q:
            return f"{random.choice(NOMES).lower()}{random.randint(1,99)}@exemplo.com"
        if "destino" in q or "concorrente" in q:
            return ", ".join(random.sample(DESTINOS, random.randint(1, 3)))
        if any(k in q for k in ("falta", "melhor", "sugestão", "comentário", "melhoria")):
            return random.choice(FALTA)
        if "nome" in q:
            sobrenomes = ["Silva", "Santos", "Oliveira", "Souza", "Ferreira", "Lima"]
            return f"{random.choice(NOMES)} {random.choice(sobrenomes)}"
        return random.choice(FALTA)

    if tip == "numero":
        if any(k in q for k in ("escala de 0 a 10", "nota", "recomendaria", "avaliação", "satisfação")):
            return str(random.choices([7, 8, 9, 10, 6, 5], weights=[3, 4, 4, 5, 2, 1])[0])
        if "idade" in q:
            return str(random.randint(18, 75))
        if "percentual" in q or "taxa de ocupação" in q:
            base = estado.get("ocup_base") or random.randint(55, 100)
            estado["ocup_base"] = base
            return str(base)
        if "permanente" in q or ("vagas" in q and "fixo" in q):
            return str(random.randint(5, 35))
        if "temporário" in q:
            return str(random.randint(2, 25))
        if "noites" in q or "pernoite" in q:
            return str(random.randint(1, 7))
        if "grupo" in q or "pessoas" in q:
            return str(random.randint(1, 6))
        if "gasto" in q or "valor" in q:
            return str(random.choice([150, 250, 400, 600, 900, 1300, 2000]))
        if "renda" in q:
            return str(random.choice([1800, 2500, 3500, 5000, 7000, 9000, 12000]))
        if "dependem" in q or "dependentes" in q:
            return str(random.randint(1, 5))
        return str(random.randint(1, 10))

    return random.choice(FALTA)


def gerar_resposta(campos):
    estado = {}
    itens  = []
    for c in campos:
        q = c["texto_pergunta"].lower()
        condicional = any(k in q for k in ("se respondeu", "caso tenha", "se a resposta"))
        opcional    = not c.get("obrigatorio", True)
        if (condicional or opcional) and random.random() < 0.5:
            continue
        itens.append({
            "campo_id":       c["id"],
            "atributo_texto": valor_para_campo(c, estado),
        })
    if not itens and campos:
        c = campos[0]
        itens.append({"campo_id": c["id"], "atributo_texto": valor_para_campo(c, {})})
    return {"respostas": itens}


# ─── helpers de CRUD ─────────────────────────────────────────────────────────

def get_campos(api_url, edicao_id):
    _, campos = api("GET", f"{api_url}/edicoes/{edicao_id}/campos")
    return campos or []


def criar_edicao(api_url, token, pesquisa_id, abertura, fechamento=None):
    body = {"data_abertura": abertura, "campos_extras": []}
    if fechamento:
        body["data_fechamento"] = fechamento
    st, e = api("POST", f"{api_url}/pesquisas/{pesquisa_id}/edicoes", body, token=token)
    if st != 201:
        sys.exit(f"✗ Falha ao criar edição de pesquisa {pesquisa_id} ({st}): {e}")
    return e


def criar_pesquisa(api_url, token, nome, descricao, tipo, campos):
    body = {"nome": nome, "descricao": descricao, "tipo": tipo, "campos": campos}
    st, p = api("POST", f"{api_url}/pesquisas", body, token=token)
    if st != 201:
        sys.exit(f"✗ Falha ao criar pesquisa '{nome}' ({st}): {p}")
    return p


def ativar(api_url, tok_serv, edicao_id):
    """Ativa uma edição (remove data_fechamento, fecha outras ativas da mesma pesquisa)."""
    st, r = api("POST", f"{api_url}/edicoes/{edicao_id}/status", {"acao": "ativar"}, token=tok_serv)
    if st != 200:
        print(f"      ✗ ativar ed {edicao_id} erro {st}: {r}")
    return st == 200


def encerrar(api_url, tok_serv, edicao_id):
    """Encerra uma edição (data_fechamento = ontem)."""
    st, r = api("POST", f"{api_url}/edicoes/{edicao_id}/status", {"acao": "encerrar"}, token=tok_serv)
    if st != 200:
        print(f"      ✗ encerrar ed {edicao_id} erro {st}: {r}")
    return st == 200


def seed_edicao(api_url, tok_serv, pesq_tokens, tipo, edicao_id, n, label="",
               precisa_ativar=False, ativa_depois=None):
    """
    Envia n respostas para uma edição.
    - precisa_ativar: se True, ativa a edição antes de sedar e encerra depois.
    - ativa_depois: id de edição a reativar após encerrar esta (para não perder a ativa atual).
    """
    if precisa_ativar:
        if not ativar(api_url, tok_serv, edicao_id):
            return 0

    campos = get_campos(api_url, edicao_id)
    ok = 0
    for i in range(n):
        corpo = gerar_resposta(campos)
        if tipo == "campo":
            tok = pesq_tokens[i % len(pesq_tokens)]
            endpoint = f"{api_url}/pesquisador/edicoes/{edicao_id}/respostas"
            st, r = api("POST", endpoint, corpo, token=tok)
        else:
            st, r = api("POST", f"{api_url}/edicoes/{edicao_id}/respostas", corpo)
        if st == 201:
            ok += 1
        else:
            print(f"        ✗ resp {i+1} erro {st}: {r}")

    if precisa_ativar:
        encerrar(api_url, tok_serv, edicao_id)
        if ativa_depois is not None:
            ativar(api_url, tok_serv, ativa_depois)

    tag = f"({label}) " if label else ""
    print(f"      ✓ {ok}/{n} respostas {tag}enviadas")
    return ok


# ─── main ────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--api",  default="http://localhost:8000")
    ap.add_argument("--seed", type=int, default=2026)
    args = ap.parse_args()
    random.seed(args.seed)

    print("Conectando à API...")
    tok_serv  = login(args.api, *SERVIDOR)
    tok_pesqs = [login(args.api, *p) for p in PESQUISADORES]
    print(f"  ✓ Servidor + {len(tok_pesqs)} pesquisadores autenticados\n")

    # ── 1. Apagar pesquisas de teste ─────────────────────────────────────────
    print("═══ 1. Apagando pesquisas de teste ═══")
    for pid in [15, 16, 17]:
        st, _ = api("DELETE", f"{args.api}/pesquisas/{pid}", token=tok_serv)
        if st in (200, 204):
            print(f"  ✓ Pesquisa {pid} excluída")
        elif st == 404:
            print(f"  - Pesquisa {pid} não existe")
        else:
            print(f"  ✗ Erro {st} ao excluir pesquisa {pid}")
    print()

    # ── 2. Survey 13 — Taxa de Ocupação: seed nas edições já criadas ─────────
    print("═══ 2. Pesquisa 13 — Taxa de Ocupação Hoteleira ═══")
    # Estado atual após o seed parcial:
    # #1 id=12 encerrada (41 resp)  #2 id=25 encerrada (0)  #3 id=26 encerrada (0)
    # #4 id=27 encerrada (0)        #5 id=28 encerrada (0)  #6 id=29 ativa (14 resp)
    # Estratégia: ativar cada ed. passada → seed → encerrar → reativar ed. #6 (29)

    to_passadas = [
        (25, "Carnaval 2026",              30),
        (26, "Semana Santa / Páscoa 2026", 25),
        (27, "Dia do Trabalhador 2026",    28),
        (28, "Corpus Christi 2026",        22),
    ]
    for eid, label, n in to_passadas:
        print(f"  → Ed id={eid} ({label})")
        seed_edicao(args.api, tok_serv, tok_pesqs, "publica", eid, n, label,
                    precisa_ativar=True, ativa_depois=29)

    # Ed #6 (id=29, Festa Junina) já tem 14 resp e está ativa — não precisa de nada
    _, ed29 = api("GET", f"{args.api}/pesquisas/13/edicoes")
    ed29_info = next((e for e in (ed29 or []) if e["id"] == 29), None)
    if ed29_info:
        print(f"  → Ed #6 id=29 (Festa Junina 2026) status={ed29_info['status']} resp={ed29_info['total_respostas']}")
    else:
        print("  → Ed #6 id=29 não encontrada")
    print()

    # ── 3. Survey 14 — Percepção do Turismo ─────────────────────────────────
    print("═══ 3. Pesquisa 14 — Percepção do Turismo ═══")
    # Estado atual: #1 id=13 encerrada 40resp  #2 id=24 ativa 40resp  #3 id=30 encerrada 0resp
    # Ed #2 (id=24) tem fechamento=2026-06-25 (hoje) → ainda ativa, manter como está
    # Ed #3 (id=30): abertura=2025-07-01, encerrada → ativar, seed, encerrar, reativar ed #2

    print("  → Ed #1 id=13 — 40 respostas (ok)")
    print("  → Ed #2 id=24 (ativa, Semestre 1 2026) — 40 respostas (ok)")
    print("  → Ed #3 id=30 (Alta Temporada 2025) — seeding...")
    seed_edicao(args.api, tok_serv, tok_pesqs, "publica", 30, 45, "Alta Temporada 2025",
                precisa_ativar=True, ativa_depois=24)

    # Adicionar mais duas edições passadas
    e14_verao = criar_edicao(args.api, tok_serv, 14, "2025-12-01", "2026-02-01")
    print(f"  → Ed #{e14_verao['numero_edicao']} (Verão / Réveillon 2025-2026) status={e14_verao['status']}")
    seed_edicao(args.api, tok_serv, tok_pesqs, "publica", e14_verao["id"], 38,
                "Verão 2025-2026", precisa_ativar=True, ativa_depois=24)

    e14_carnaval = criar_edicao(args.api, tok_serv, 14, "2026-02-28", "2026-03-05")
    print(f"  → Ed #{e14_carnaval['numero_edicao']} (Carnaval 2026) status={e14_carnaval['status']}")
    seed_edicao(args.api, tok_serv, tok_pesqs, "publica", e14_carnaval["id"], 32,
                "Carnaval 2026", precisa_ativar=True, ativa_depois=24)
    print()

    # ── 4. Nova pesquisa pública — Perfil da Demanda Turística ───────────────
    print("═══ 4. Criando 'Perfil da Demanda Turística' (publica) ═══")
    campos_demanda = [
        {
            "texto_pergunta": "Em qual Estado você nasceu?",
            "tipo": "multipla_escolha", "opcoes": ESTADOS,
            "obrigatorio": True, "ordem": 0,
        },
        {
            "texto_pergunta": "Em qual cidade você mora atualmente?",
            "tipo": "texto", "opcoes": [],
            "obrigatorio": True, "ordem": 1,
        },
        {
            "texto_pergunta": "Como você viajou até Olímpia?",
            "tipo": "multipla_escolha",
            "opcoes": ["Carro próprio", "Ônibus de turismo / excursão", "Ônibus regular",
                       "Moto", "Van fretada", "Táxi / aplicativo", "Carona"],
            "obrigatorio": True, "ordem": 2,
        },
        {
            "texto_pergunta": "Qual o principal motivo da sua visita a Olímpia?",
            "tipo": "multipla_escolha",
            "opcoes": ["Lazer / Turismo", "Termas / parques aquáticos", "Visita a familiares ou amigos",
                       "Trabalho ou negócios", "Evento / Show", "Tratamento de saúde / bem-estar"],
            "obrigatorio": True, "ordem": 3,
        },
        {
            "texto_pergunta": "É a sua primeira visita a Olímpia?",
            "tipo": "multipla_escolha",
            "opcoes": ["Sim, primeira vez", "Não, já vim antes"],
            "obrigatorio": True, "ordem": 4,
        },
        {
            "texto_pergunta": "Com quem você está viajando?",
            "tipo": "multipla_escolha",
            "opcoes": ["Sozinho(a)", "Com cônjuge / companheiro(a)", "Com família (com filhos)",
                       "Com amigos", "Grupo organizado / excursão"],
            "obrigatorio": True, "ordem": 5,
        },
        {
            "texto_pergunta": "Quantas noites ficará (ou ficou) em Olímpia?",
            "tipo": "numero", "opcoes": [],
            "obrigatorio": True, "ordem": 6,
        },
        {
            "texto_pergunta": "Qual o tipo de hospedagem utilizado?",
            "tipo": "multipla_escolha",
            "opcoes": ["Hotel", "Pousada", "Resort com parque aquático",
                       "Casa de aluguel (temporada)", "Casa de familiar / amigo", "Não pernoitei"],
            "obrigatorio": True, "ordem": 7,
        },
        {
            "texto_pergunta": "Qual foi o seu gasto estimado nesta visita, por pessoa (em R$)?",
            "tipo": "numero", "opcoes": [],
            "obrigatorio": False, "ordem": 8,
        },
        {
            "texto_pergunta": "Como ficou sabendo de Olímpia como destino turístico?",
            "tipo": "multipla_escolha",
            "opcoes": ["Redes sociais (Instagram, TikTok, YouTube)", "Indicação de amigos ou família",
                       "TV / Rádio", "Já conhecia / Sou de Olímpia", "Agência de viagens",
                       "Site ou blog de turismo"],
            "obrigatorio": False, "ordem": 9,
        },
        {
            "texto_pergunta": "Em uma escala de 0 a 10, qual nota você dá para Olímpia como destino turístico?",
            "tipo": "numero", "opcoes": [],
            "obrigatorio": True, "ordem": 10,
        },
        {
            "texto_pergunta": "Você recomendaria Olímpia para amigos ou familiares?",
            "tipo": "multipla_escolha",
            "opcoes": ["Sim, com certeza!", "Sim, provavelmente", "Talvez", "Não"],
            "obrigatorio": True, "ordem": 11,
        },
        {
            "texto_pergunta": "Quais outros destinos turísticos você considera concorrentes de Olímpia?",
            "tipo": "texto", "opcoes": [],
            "obrigatorio": False, "ordem": 12,
        },
    ]
    p_dem = criar_pesquisa(
        args.api, tok_serv,
        "Perfil da Demanda Turística",
        ("Pesquisa destinada a identificar o perfil dos visitantes que chegam à Estância "
         "Turística de Olímpia, suas origens, motivações, padrão de gasto e grau de "
         "satisfação com o destino. Iniciativa do OTO — Observatório de Turismo de Olímpia, "
         "em parceria com a Secretaria Municipal de Turismo."),
        "publica",
        campos_demanda,
    )
    pid_dem = p_dem["id"]
    print(f"  ✓ Pesquisa criada (id={pid_dem})")

    # Para novas pesquisas: criar edição passada → ativar → seed → encerrar (sem ativa_depois)
    eventos_dem = [
        ("2025-04-14", "2025-04-21", "Semana Santa 2025",           35),
        ("2025-06-21", "2025-07-13", "Festa Junina 2025",           42),
        ("2025-07-01", "2025-08-31", "Alta Temporada 2025",         55),
        ("2026-02-28", "2026-03-05", "Carnaval 2026",               38),
        ("2026-04-14", "2026-04-21", "Semana Santa / Páscoa 2026",  32),
    ]
    for abertura, fechamento, label, n in eventos_dem:
        e = criar_edicao(args.api, tok_serv, pid_dem, abertura, fechamento)
        print(f"  → Ed #{e['numero_edicao']} ({label}) status={e['status']}")
        seed_edicao(args.api, tok_serv, tok_pesqs, "publica", e["id"], n, label,
                    precisa_ativar=True)

    e_dem_atual = criar_edicao(args.api, tok_serv, pid_dem, "2026-06-23", None)
    print(f"  → Ed #{e_dem_atual['numero_edicao']} (Festa Junina 2026) status={e_dem_atual['status']}")
    seed_edicao(args.api, tok_serv, tok_pesqs, "publica", e_dem_atual["id"], 20, "Festa Junina 2026")
    print()

    # ── 5. Nova pesquisa de campo — Perfil do Visitante ──────────────────────
    print("═══ 5. Criando 'Perfil do Visitante — Coleta in loco' (campo) ═══")
    campos_perfil = [
        {
            "texto_pergunta": "Em qual Estado você nasceu?",
            "tipo": "multipla_escolha", "opcoes": ESTADOS,
            "obrigatorio": True, "ordem": 0,
        },
        {
            "texto_pergunta": "Em qual cidade você mora atualmente?",
            "tipo": "texto", "opcoes": [],
            "obrigatorio": True, "ordem": 1,
        },
        {
            "texto_pergunta": "Qual o principal motivo da visita?",
            "tipo": "multipla_escolha",
            "opcoes": ["Termas e parques aquáticos", "Lazer familiar", "Lua de mel / viagem romântica",
                       "Visita a amigos ou família", "Evento / Show", "Negócios", "Turismo religioso"],
            "obrigatorio": True, "ordem": 2,
        },
        {
            "texto_pergunta": "Como chegou a Olímpia?",
            "tipo": "multipla_escolha",
            "opcoes": ["Carro próprio", "Ônibus regular", "Ônibus fretado / excursão",
                       "Moto", "Aplicativo / táxi"],
            "obrigatorio": True, "ordem": 3,
        },
        {
            "texto_pergunta": "Quantas noites ficará em Olímpia?",
            "tipo": "numero", "opcoes": [],
            "obrigatorio": True, "ordem": 4,
        },
        {
            "texto_pergunta": "Quantas pessoas viajam em seu grupo (incluindo você)?",
            "tipo": "numero", "opcoes": [],
            "obrigatorio": True, "ordem": 5,
        },
        {
            "texto_pergunta": "Qual o tipo de hospedagem?",
            "tipo": "multipla_escolha",
            "opcoes": ["Resort / hotel com parque aquático", "Hotel (sem parque)", "Pousada",
                       "Casa de aluguel (temporada)", "Casa de parente / amigo", "Não vou pernoitar"],
            "obrigatorio": True, "ordem": 6,
        },
        {
            "texto_pergunta": "Com qual gênero se identifica?",
            "tipo": "multipla_escolha",
            "opcoes": ["Feminino", "Masculino", "Outros", "Prefiro não me identificar"],
            "obrigatorio": False, "ordem": 7,
        },
        {
            "texto_pergunta": "Qual a sua faixa etária?",
            "tipo": "multipla_escolha",
            "opcoes": ["Até 17 anos", "18 a 25 anos", "26 a 35 anos",
                       "36 a 50 anos", "51 a 65 anos", "Acima de 65 anos"],
            "obrigatorio": False, "ordem": 8,
        },
        {
            "texto_pergunta": "Em uma escala de 0 a 10, qual a sua satisfação geral com Olímpia até agora?",
            "tipo": "numero", "opcoes": [],
            "obrigatorio": True, "ordem": 9,
        },
        {
            "texto_pergunta": "Você voltaria a Olímpia?",
            "tipo": "multipla_escolha",
            "opcoes": ["Sim, com certeza", "Provavelmente sim", "Talvez", "Não"],
            "obrigatorio": True, "ordem": 10,
        },
        {
            "texto_pergunta": "Algum comentário ou sugestão para melhorar o turismo em Olímpia?",
            "tipo": "texto_longo", "opcoes": [],
            "obrigatorio": False, "ordem": 11,
        },
    ]
    p_perf = criar_pesquisa(
        args.api, tok_serv,
        "Perfil do Visitante — Coleta in loco",
        ("Pesquisa de campo aplicada presencialmente por pesquisadores do OTO nos "
         "principais pontos turísticos de Olímpia. Objetivo: traçar o perfil dos "
         "visitantes com dados coletados diretamente durante eventos e alta temporada."),
        "campo",
        campos_perfil,
    )
    pid_perf = p_perf["id"]
    print(f"  ✓ Pesquisa criada (id={pid_perf})")

    eventos_perf = [
        ("2026-02-28", "2026-03-05", "Carnaval 2026",              30),
        ("2026-04-14", "2026-04-21", "Semana Santa / Páscoa 2026", 25),
        ("2026-04-29", "2026-05-04", "Dia do Trabalhador 2026",    22),
        ("2026-06-17", "2026-06-22", "Corpus Christi 2026",        18),
    ]
    for abertura, fechamento, label, n in eventos_perf:
        e = criar_edicao(args.api, tok_serv, pid_perf, abertura, fechamento)
        print(f"  → Ed #{e['numero_edicao']} ({label}) status={e['status']}")
        seed_edicao(args.api, tok_serv, tok_pesqs, "campo", e["id"], n, label,
                    precisa_ativar=True)

    e_perf_atual = criar_edicao(args.api, tok_serv, pid_perf, "2026-06-23", None)
    print(f"  → Ed #{e_perf_atual['numero_edicao']} (Festa Junina 2026) status={e_perf_atual['status']}")
    seed_edicao(args.api, tok_serv, tok_pesqs, "campo", e_perf_atual["id"], 15, "Festa Junina 2026")
    print()

    # ── 6. Nova pesquisa de campo — Avaliação dos Serviços ───────────────────
    print("═══ 6. Criando 'Avaliação dos Serviços Turísticos' (campo) ═══")
    campos_aval = [
        {
            "texto_pergunta": "Qual atrativo ou serviço está sendo avaliado?",
            "tipo": "multipla_escolha",
            "opcoes": ["Hot Beach Olímpia", "Thermas Park Resort", "Enjoy Olímpia Park",
                       "Celebration Resort", "Hot Springs", "Centreventos Olímpia",
                       "Pousada / Hotel (outro)", "Restaurante / Alimentação",
                       "Transporte local", "Comércio turístico"],
            "obrigatorio": True, "ordem": 0,
        },
        {
            "texto_pergunta": "Como você avalia o atendimento dos funcionários?",
            "tipo": "multipla_escolha",
            "opcoes": ["Excelente", "Bom", "Regular", "Ruim", "Péssimo"],
            "obrigatorio": True, "ordem": 1,
        },
        {
            "texto_pergunta": "Como você avalia a infraestrutura do local?",
            "tipo": "multipla_escolha",
            "opcoes": ["Excelente", "Boa", "Regular", "Ruim", "Péssima"],
            "obrigatorio": True, "ordem": 2,
        },
        {
            "texto_pergunta": "Como você avalia a limpeza e conservação do espaço?",
            "tipo": "multipla_escolha",
            "opcoes": ["Excelente", "Boa", "Regular", "Ruim", "Péssima"],
            "obrigatorio": True, "ordem": 3,
        },
        {
            "texto_pergunta": "A relação preço-qualidade é satisfatória?",
            "tipo": "multipla_escolha",
            "opcoes": ["Sim, muito satisfatória", "Sim, razoavelmente satisfatória",
                       "Indiferente", "Não, poderia ser melhor", "Não, está cara"],
            "obrigatorio": True, "ordem": 4,
        },
        {
            "texto_pergunta": "O local oferece acessibilidade adequada para PCD?",
            "tipo": "multipla_escolha",
            "opcoes": ["Sim, completamente", "Parcialmente", "Não", "Não sei informar"],
            "obrigatorio": False, "ordem": 5,
        },
        {
            "texto_pergunta": "Em uma escala de 0 a 10, qual nota você dá a este atrativo ou serviço?",
            "tipo": "numero", "opcoes": [],
            "obrigatorio": True, "ordem": 6,
        },
        {
            "texto_pergunta": "Você recomendaria este atrativo ou serviço?",
            "tipo": "multipla_escolha",
            "opcoes": ["Sim, definitivamente", "Sim, provavelmente", "Talvez", "Não"],
            "obrigatorio": True, "ordem": 7,
        },
        {
            "texto_pergunta": "Comentários e sugestões:",
            "tipo": "texto_longo", "opcoes": [],
            "obrigatorio": False, "ordem": 8,
        },
    ]
    p_aval = criar_pesquisa(
        args.api, tok_serv,
        "Avaliação dos Serviços Turísticos",
        ("Pesquisa de campo aplicada nos principais atrativos e serviços turísticos de "
         "Olímpia para avaliar qualidade do atendimento, infraestrutura, limpeza e "
         "satisfação geral do visitante. Coleta realizada in loco por pesquisadores do OTO."),
        "campo",
        campos_aval,
    )
    pid_aval = p_aval["id"]
    print(f"  ✓ Pesquisa criada (id={pid_aval})")

    eventos_aval = [
        ("2026-01-01", "2026-03-31", "1º Trim 2026",               35),
        ("2026-04-01", "2026-06-22", "2º Trim 2026",               30),
    ]
    for abertura, fechamento, label, n in eventos_aval:
        e = criar_edicao(args.api, tok_serv, pid_aval, abertura, fechamento)
        print(f"  → Ed #{e['numero_edicao']} ({label}) status={e['status']}")
        seed_edicao(args.api, tok_serv, tok_pesqs, "campo", e["id"], n, label,
                    precisa_ativar=True)

    e_aval_atual = criar_edicao(args.api, tok_serv, pid_aval, "2026-06-23", None)
    print(f"  → Ed #{e_aval_atual['numero_edicao']} (Festa Junina 2026) status={e_aval_atual['status']}")
    seed_edicao(args.api, tok_serv, tok_pesqs, "campo", e_aval_atual["id"], 18, "Festa Junina 2026")
    print()

    # ── Resumo ───────────────────────────────────────────────────────────────
    print("═══ Concluído ═══")
    _, todas = api("GET", f"{args.api}/pesquisas")
    for p in (todas or []):
        _, eds = api("GET", f"{args.api}/pesquisas/{p['id']}/edicoes")
        total_resp = sum(e.get("total_respostas", 0) for e in (eds or []))
        print(f"  [{p['tipo']:8}] id={p['id']:3d}  eds={p['total_edicoes']}  "
              f"resps={total_resp:4d}  {p['nome'][:60]}")


if __name__ == "__main__":
    main()
