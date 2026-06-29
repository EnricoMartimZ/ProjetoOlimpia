#!/usr/bin/env python3
"""
seed_db.py — Seed direto no banco (via SQLAlchemy / Neon).

Bypassa a verificação de edição aberta, permitindo inserir respostas em
edições já encerradas para dados históricos realistas.

Ações:
  1. Limpeza: remove edições duplicadas de survey 14, corrige status de survey 13
  2. Cria pesquisa de campo 'Perfil do Visitante — Coleta in loco'
  3. Cria pesquisa de campo 'Avaliação dos Serviços Turísticos'
  4. Semeia respostas históricas em todas as edições encerradas

Uso:
  cd backend && python scripts/seed_db.py
"""

import random
import sys
import os
from datetime import date, datetime, timedelta

# Garante que o módulo app/ seja encontrado
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from sqlalchemy import create_engine, select, text, func
from sqlalchemy.orm import Session, selectinload

DATABASE_URL = os.environ["DATABASE_URL"].replace("&channel_binding=require", "").replace("?channel_binding=require", "?")
engine = create_engine(DATABASE_URL)

import hashlib

from app.models.pesquisa import Campo, Pesquisa
from app.models.edicao import Edicao
from app.models.resposta import Coletou, Resposta
from app.models.usuario import Usuario
from app.services.edicao import status_edicao


def _hash_campo(pesquisa_id: int, texto: str) -> str:
    return hashlib.sha256(f"p{pesquisa_id}:{texto}".encode()).hexdigest()

random.seed(2026)

# ─── constantes de dados ─────────────────────────────────────────────────────

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
    "Hotel Fazenda Bela Vista", "Ibis Olímpia", "Gran Hotel Termas",
    "Pousada dos Girassóis", "Thermas Water Park Hotel", "Hotel Riviera",
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


# ─── geração de respostas ─────────────────────────────────────────────────────

def valor_para_campo(campo: Campo, estado: dict) -> str:
    q   = campo.texto_pergunta.lower()
    tip = campo.tipo

    if tip == "multipla_escolha":
        opts = campo.opcoes or []
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


def gerar_resposta_itens(campos: list, usuario_id=None) -> tuple:
    """Retorna (usuario_id, lista de {campo_id, atributo_texto})."""
    estado = {}
    itens  = []
    for c in campos:
        q           = c.texto_pergunta.lower()
        condicional = any(k in q for k in ("se respondeu", "caso tenha", "se a resposta"))
        opcional    = not c.obrigatorio
        if (condicional or opcional) and random.random() < 0.5:
            continue
        itens.append({
            "campo_id":       c.id,
            "atributo_texto": valor_para_campo(c, estado),
        })
    if not itens and campos:
        c = campos[0]
        itens.append({"campo_id": c.id, "atributo_texto": valor_para_campo(c, {})})
    return usuario_id, itens


def seed_edicao_db(db: Session, edicao: Edicao, n: int,
                   pesquisadores: list, tipo: str) -> int:
    """Insere n respostas diretamente no banco para uma edição."""
    # Carrega campos: fixos (pesquisa) + extras (edição), ordenados
    campos = sorted(list(edicao.pesquisa.campos) + list(edicao.campos),
                    key=lambda c: c.ordem)
    if not campos:
        print(f"      ✗ sem campos — pulando")
        return 0

    ok = 0
    for i in range(n):
        uid = None
        if tipo == "campo" and pesquisadores:
            uid = pesquisadores[i % len(pesquisadores)].id

        _, itens = gerar_resposta_itens(campos, uid)
        if not itens:
            continue

        r = Resposta(edicao_id=edicao.id, usuario_id=uid)
        db.add(r)
        db.flush()  # pega r.id sem commitar

        for item in itens:
            db.add(Coletou(
                campo_id=item["campo_id"],
                resposta_id=r.id,
                atributo_texto=item["atributo_texto"],
            ))
        ok += 1

    db.commit()
    return ok


# ─── helpers de pesquisa/edição ──────────────────────────────────────────────

def criar_pesquisa_db(db: Session, nome: str, descricao: str,
                      tipo: str, campos_spec: list) -> Pesquisa:
    p = Pesquisa(nome=nome, descricao=descricao, tipo=tipo)
    db.add(p)
    db.flush()
    for i, spec in enumerate(campos_spec):
        db.add(Campo(
            pesquisa_id=p.id,
            hash_pergunta=_hash_campo(p.id, spec["texto_pergunta"]),
            texto_pergunta=spec["texto_pergunta"],
            tipo=spec["tipo"],
            opcoes=spec.get("opcoes", []),
            obrigatorio=spec.get("obrigatorio", True),
            ordem=spec.get("ordem", i),
        ))
    db.commit()
    db.refresh(p)
    return p


def criar_edicao_db(db: Session, pesquisa_id: int,
                    abertura: date, fechamento=None) -> Edicao:
    proximo = (db.scalar(
        select(func.max(Edicao.numero_edicao))
        .where(Edicao.pesquisa_id == pesquisa_id)
    ) or 0) + 1
    e = Edicao(
        pesquisa_id=pesquisa_id,
        numero_edicao=proximo,
        data_abertura=abertura,
        data_fechamento=fechamento,
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


def load_edicao(db: Session, edicao_id: int) -> Edicao:
    return db.scalars(
        select(Edicao)
        .where(Edicao.id == edicao_id)
        .options(
            selectinload(Edicao.pesquisa).selectinload(Pesquisa.campos),
            selectinload(Edicao.campos),
        )
    ).first()


# ─── main ─────────────────────────────────────────────────────────────────────

def main():
    with Session(engine) as db:
        # ── Pesquisadores de campo ────────────────────────────────────────────
        pesquisadores = db.scalars(
            select(Usuario).where(Usuario.role == "pesquisador_campo")
        ).all()
        print(f"Pesquisadores: {[p.nome for p in pesquisadores]}")

        # ── 1. Limpar edições duplicadas do survey 14 ─────────────────────────
        print("\n═══ 1. Limpando duplicatas do survey 14 ═══")
        # Manter: #1 id=13 (40 resp), #2 id=24 (40 resp), #3 id=30 (82 resp)
        # Excluir: ids 31, 32, 33, 34, 35, 37
        for eid in [31, 32, 33, 34, 35, 37]:
            ed = db.get(Edicao, eid)
            if ed:
                db.delete(ed)
                print(f"  ✓ Edição {eid} excluída")
            else:
                print(f"  - Edição {eid} não existe")
        db.commit()

        # ── 2. Corrigir status do survey 13 ───────────────────────────────────
        print("\n═══ 2. Corrigindo status do survey 13 ═══")
        # Ed #4 id=27 (Dia do Trabalhador): deve ser encerrada
        ed27 = db.get(Edicao, 27)
        if ed27 and status_edicao(ed27) == "ativa":
            ed27.data_fechamento = date(2026, 5, 4)  # fim do feriado
            print(f"  ✓ Ed #4 id=27 encerrada (fechamento=2026-05-04)")

        # Ed #6 id=29 (Festa Junina): deve ser ativa
        ed29 = db.get(Edicao, 29)
        if ed29:
            ed29.data_fechamento = None  # sem fechamento → ativa
            print(f"  ✓ Ed #6 id=29 reativada (Festa Junina 2026)")

        # Corrigir fechamento das edições passadas para refletir datas reais
        # Ed #2 id=25 (Carnaval): abertura=Feb28, fechamento=Mar5
        ed25 = db.get(Edicao, 25)
        if ed25:
            ed25.data_fechamento = date(2026, 3, 5)
            print(f"  ✓ Ed #2 id=25 fechamento=2026-03-05 (Carnaval)")
        # Ed #3 id=26 (Semana Santa): abertura=Apr14, fechamento=Apr21
        ed26 = db.get(Edicao, 26)
        if ed26:
            ed26.data_fechamento = date(2026, 4, 21)
            print(f"  ✓ Ed #3 id=26 fechamento=2026-04-21 (Semana Santa)")
        # Ed #5 id=28 (Corpus Christi): abertura=Jun17, fechamento=Jun22
        ed28 = db.get(Edicao, 28)
        if ed28:
            ed28.data_fechamento = date(2026, 6, 22)
            print(f"  ✓ Ed #5 id=28 fechamento=2026-06-22 (Corpus Christi)")

        db.commit()

        # Verificar respostas insuficientes e completar
        print("\n═══ 2b. Completando respostas faltantes no survey 13 ═══")
        for eid, label, meta in [
            (25, "Carnaval 2026",              30),
            (26, "Semana Santa / Páscoa 2026", 25),
            (27, "Dia do Trabalhador 2026",    28),
            (28, "Corpus Christi 2026",        22),
            (29, "Festa Junina 2026",          14),
        ]:
            ed = load_edicao(db, eid)
            if not ed:
                print(f"  - Ed {eid} não encontrada")
                continue
            existentes = db.scalar(
                select(func.count(Resposta.id)).where(Resposta.edicao_id == eid)
            )
            faltam = max(0, meta - existentes)
            if faltam == 0:
                print(f"  → Ed {eid} ({label}): {existentes} resp (ok)")
            else:
                ok = seed_edicao_db(db, ed, faltam, [], "publica")
                print(f"  → Ed {eid} ({label}): +{ok} resp (total ~{existentes + ok})")

        # ── 3. Completar survey 14 ────────────────────────────────────────────
        print("\n═══ 3. Completando survey 14 — Percepção do Turismo ═══")
        # Ed #3 id=30 (Alta Temporada 2025): 82 resp → ok
        # Adicionar novas edições passadas com datas corretas
        p14 = db.get(Pesquisa, 14)

        novos_14 = [
            (date(2025, 12, 1), date(2026, 2, 1),  "Verão / Réveillon 2025-2026", 38),
            (date(2026, 2, 28), date(2026, 3, 5),  "Carnaval 2026",               32),
            (date(2026, 4, 14), date(2026, 4, 21), "Semana Santa 2026",           28),
        ]
        for aber, fech, label, n in novos_14:
            ed = criar_edicao_db(db, 14, aber, fech)
            ed = load_edicao(db, ed.id)
            ok = seed_edicao_db(db, ed, n, [], "publica")
            print(f"  → Ed #{ed.numero_edicao} ({label}): +{ok} resp")

        # Edição ativa para Festa Junina 2026
        ativa14 = db.scalars(
            select(Edicao).where(Edicao.pesquisa_id == 14, Edicao.data_fechamento == None)
        ).first()
        if not ativa14:
            ativa14 = criar_edicao_db(db, 14, date(2026, 6, 23))
            print(f"  → Ed #{ativa14.numero_edicao} (Festa Junina 2026): criada")
        else:
            print(f"  → Ed #{ativa14.numero_edicao} (Festa Junina 2026): já existe (id={ativa14.id})")
        ativa14 = load_edicao(db, ativa14.id)
        existing = db.scalar(select(func.count(Resposta.id)).where(Resposta.edicao_id == ativa14.id))
        if existing < 18:
            ok = seed_edicao_db(db, ativa14, 18 - existing, [], "publica")
            print(f"    +{ok} resp")

        # ── 4. Survey 18 (Demanda Turística) — completar edições ─────────────
        print("\n═══ 4. Completando survey 18 — Demanda Turística ═══")
        p18 = db.get(Pesquisa, 18)
        if not p18:
            print("  ✗ survey 18 não encontrada, pulando")
        else:
            # Verificar edição existente
            eds18 = db.scalars(
                select(Edicao).where(Edicao.pesquisa_id == 18)
            ).all()
            print(f"  Edições atuais: {[(e.id, e.numero_edicao, status_edicao(e)) for e in eds18]}")

            # Apagar edições existentes (provavelmente mal configuradas)
            for e in eds18:
                db.delete(e)
            db.commit()
            print("  Edições antigas removidas")

            # Criar edições corretas
            eventos_dem = [
                (date(2025, 4, 14), date(2025, 4, 21), "Semana Santa 2025",           35),
                (date(2025, 6, 21), date(2025, 7, 13), "Festa Junina 2025",           42),
                (date(2025, 7,  1), date(2025, 8, 31), "Alta Temporada 2025",         55),
                (date(2026, 2, 28), date(2026, 3,  5), "Carnaval 2026",               38),
                (date(2026, 4, 14), date(2026, 4, 21), "Semana Santa / Páscoa 2026",  32),
                (date(2026, 6, 23), None,               "Festa Junina 2026",           20),
            ]
            for aber, fech, label, n in eventos_dem:
                ed = criar_edicao_db(db, 18, aber, fech)
                ed = load_edicao(db, ed.id)
                ok = seed_edicao_db(db, ed, n, [], "publica")
                print(f"  → Ed #{ed.numero_edicao} ({label}): +{ok} resp")

        # ── 5. Nova pesquisa campo: Perfil do Visitante ───────────────────────
        print("\n═══ 5. Criando 'Perfil do Visitante — Coleta in loco' (campo) ═══")
        # Verificar se já existe
        perf_existente = db.scalars(
            select(Pesquisa).where(Pesquisa.nome == "Perfil do Visitante — Coleta in loco")
        ).first()
        if perf_existente:
            print(f"  Já existe (id={perf_existente.id}), pulando criação")
            p_perf = perf_existente
        else:
            campos_perfil = [
                {"texto_pergunta": "Em qual Estado você nasceu?",
                 "tipo": "multipla_escolha", "opcoes": ESTADOS, "obrigatorio": True, "ordem": 0},
                {"texto_pergunta": "Em qual cidade você mora atualmente?",
                 "tipo": "texto", "opcoes": [], "obrigatorio": True, "ordem": 1},
                {"texto_pergunta": "Qual o principal motivo da visita?",
                 "tipo": "multipla_escolha",
                 "opcoes": ["Termas e parques aquáticos", "Lazer familiar", "Lua de mel / viagem romântica",
                            "Visita a amigos ou família", "Evento / Show", "Negócios", "Turismo religioso"],
                 "obrigatorio": True, "ordem": 2},
                {"texto_pergunta": "Como chegou a Olímpia?",
                 "tipo": "multipla_escolha",
                 "opcoes": ["Carro próprio", "Ônibus regular", "Ônibus fretado / excursão",
                            "Moto", "Aplicativo / táxi"],
                 "obrigatorio": True, "ordem": 3},
                {"texto_pergunta": "Quantas noites ficará em Olímpia?",
                 "tipo": "numero", "opcoes": [], "obrigatorio": True, "ordem": 4},
                {"texto_pergunta": "Quantas pessoas viajam em seu grupo (incluindo você)?",
                 "tipo": "numero", "opcoes": [], "obrigatorio": True, "ordem": 5},
                {"texto_pergunta": "Qual o tipo de hospedagem?",
                 "tipo": "multipla_escolha",
                 "opcoes": ["Resort / hotel com parque aquático", "Hotel (sem parque)", "Pousada",
                            "Casa de aluguel (temporada)", "Casa de parente / amigo", "Não vou pernoitar"],
                 "obrigatorio": True, "ordem": 6},
                {"texto_pergunta": "Com qual gênero se identifica?",
                 "tipo": "multipla_escolha",
                 "opcoes": ["Feminino", "Masculino", "Outros", "Prefiro não me identificar"],
                 "obrigatorio": False, "ordem": 7},
                {"texto_pergunta": "Qual a sua faixa etária?",
                 "tipo": "multipla_escolha",
                 "opcoes": ["Até 17 anos", "18 a 25 anos", "26 a 35 anos",
                            "36 a 50 anos", "51 a 65 anos", "Acima de 65 anos"],
                 "obrigatorio": False, "ordem": 8},
                {"texto_pergunta": "Em uma escala de 0 a 10, qual a sua satisfação geral com Olímpia até agora?",
                 "tipo": "numero", "opcoes": [], "obrigatorio": True, "ordem": 9},
                {"texto_pergunta": "Você voltaria a Olímpia?",
                 "tipo": "multipla_escolha",
                 "opcoes": ["Sim, com certeza", "Provavelmente sim", "Talvez", "Não"],
                 "obrigatorio": True, "ordem": 10},
                {"texto_pergunta": "Algum comentário ou sugestão para melhorar o turismo em Olímpia?",
                 "tipo": "texto_longo", "opcoes": [], "obrigatorio": False, "ordem": 11},
            ]
            p_perf = criar_pesquisa_db(
                db,
                "Perfil do Visitante — Coleta in loco",
                ("Pesquisa de campo aplicada presencialmente por pesquisadores do OTO nos "
                 "principais pontos turísticos de Olímpia. Objetivo: traçar o perfil dos "
                 "visitantes com dados coletados diretamente durante eventos e alta temporada."),
                "campo",
                campos_perfil,
            )
            print(f"  ✓ Criada (id={p_perf.id})")

        eventos_perf = [
            (date(2026, 2, 28), date(2026, 3,  5), "Carnaval 2026",              30),
            (date(2026, 4, 14), date(2026, 4, 21), "Semana Santa / Páscoa 2026", 25),
            (date(2026, 4, 29), date(2026, 5,  4), "Dia do Trabalhador 2026",    22),
            (date(2026, 6, 17), date(2026, 6, 22), "Corpus Christi 2026",        18),
            (date(2026, 6, 23), None,               "Festa Junina 2026",          15),
        ]
        for aber, fech, label, n in eventos_perf:
            # Apaga edições existentes desta pesquisa primeiro
            pass
        # Remove edições existentes
        eds_perf = db.scalars(select(Edicao).where(Edicao.pesquisa_id == p_perf.id)).all()
        for e in eds_perf:
            db.delete(e)
        db.commit()

        for aber, fech, label, n in eventos_perf:
            ed = criar_edicao_db(db, p_perf.id, aber, fech)
            ed = load_edicao(db, ed.id)
            ok = seed_edicao_db(db, ed, n, pesquisadores, "campo")
            print(f"  → Ed #{ed.numero_edicao} ({label}): +{ok} resp")

        # ── 6. Nova pesquisa campo: Avaliação dos Serviços ───────────────────
        print("\n═══ 6. Criando 'Avaliação dos Serviços Turísticos' (campo) ═══")
        aval_existente = db.scalars(
            select(Pesquisa).where(Pesquisa.nome == "Avaliação dos Serviços Turísticos")
        ).first()
        if aval_existente:
            print(f"  Já existe (id={aval_existente.id}), pulando criação")
            p_aval = aval_existente
        else:
            campos_aval = [
                {"texto_pergunta": "Qual atrativo ou serviço está sendo avaliado?",
                 "tipo": "multipla_escolha",
                 "opcoes": ["Hot Beach Olímpia", "Thermas Park Resort", "Enjoy Olímpia Park",
                            "Celebration Resort", "Hot Springs", "Centreventos Olímpia",
                            "Pousada / Hotel (outro)", "Restaurante / Alimentação",
                            "Transporte local", "Comércio turístico"],
                 "obrigatorio": True, "ordem": 0},
                {"texto_pergunta": "Como você avalia o atendimento dos funcionários?",
                 "tipo": "multipla_escolha",
                 "opcoes": ["Excelente", "Bom", "Regular", "Ruim", "Péssimo"],
                 "obrigatorio": True, "ordem": 1},
                {"texto_pergunta": "Como você avalia a infraestrutura do local?",
                 "tipo": "multipla_escolha",
                 "opcoes": ["Excelente", "Boa", "Regular", "Ruim", "Péssima"],
                 "obrigatorio": True, "ordem": 2},
                {"texto_pergunta": "Como você avalia a limpeza e conservação do espaço?",
                 "tipo": "multipla_escolha",
                 "opcoes": ["Excelente", "Boa", "Regular", "Ruim", "Péssima"],
                 "obrigatorio": True, "ordem": 3},
                {"texto_pergunta": "A relação preço-qualidade é satisfatória?",
                 "tipo": "multipla_escolha",
                 "opcoes": ["Sim, muito satisfatória", "Sim, razoavelmente satisfatória",
                            "Indiferente", "Não, poderia ser melhor", "Não, está cara"],
                 "obrigatorio": True, "ordem": 4},
                {"texto_pergunta": "O local oferece acessibilidade adequada para PCD?",
                 "tipo": "multipla_escolha",
                 "opcoes": ["Sim, completamente", "Parcialmente", "Não", "Não sei informar"],
                 "obrigatorio": False, "ordem": 5},
                {"texto_pergunta": "Em uma escala de 0 a 10, qual nota você dá a este atrativo ou serviço?",
                 "tipo": "numero", "opcoes": [], "obrigatorio": True, "ordem": 6},
                {"texto_pergunta": "Você recomendaria este atrativo ou serviço?",
                 "tipo": "multipla_escolha",
                 "opcoes": ["Sim, definitivamente", "Sim, provavelmente", "Talvez", "Não"],
                 "obrigatorio": True, "ordem": 7},
                {"texto_pergunta": "Comentários e sugestões:",
                 "tipo": "texto_longo", "opcoes": [], "obrigatorio": False, "ordem": 8},
            ]
            p_aval = criar_pesquisa_db(
                db,
                "Avaliação dos Serviços Turísticos",
                ("Pesquisa de campo aplicada nos principais atrativos e serviços turísticos de "
                 "Olímpia para avaliar qualidade do atendimento, infraestrutura, limpeza e "
                 "satisfação geral do visitante. Coleta realizada in loco por pesquisadores do OTO."),
                "campo",
                campos_aval,
            )
            print(f"  ✓ Criada (id={p_aval.id})")

        eds_aval = db.scalars(select(Edicao).where(Edicao.pesquisa_id == p_aval.id)).all()
        for e in eds_aval:
            db.delete(e)
        db.commit()

        eventos_aval = [
            (date(2026, 1,  1), date(2026, 3, 31), "1º Trimestre 2026",  35),
            (date(2026, 4,  1), date(2026, 6, 22), "2º Trimestre 2026",  30),
            (date(2026, 6, 23), None,               "Festa Junina 2026",  18),
        ]
        for aber, fech, label, n in eventos_aval:
            ed = criar_edicao_db(db, p_aval.id, aber, fech)
            ed = load_edicao(db, ed.id)
            ok = seed_edicao_db(db, ed, n, pesquisadores, "campo")
            print(f"  → Ed #{ed.numero_edicao} ({label}): +{ok} resp")

        # ── Resumo final ──────────────────────────────────────────────────────
        print("\n═══ Resumo final ═══")
        pesquisas = db.scalars(select(Pesquisa)).all()
        for p in sorted(pesquisas, key=lambda x: x.id):
            eds = db.scalars(select(Edicao).where(Edicao.pesquisa_id == p.id)).all()
            total = sum(
                db.scalar(select(func.count(Resposta.id)).where(Resposta.edicao_id == e.id))
                for e in eds
            )
            print(f"  [{p.tipo:8}] id={p.id:3d}  eds={len(eds)}  resps={total:4d}  {p.nome[:60]}")


if __name__ == "__main__":
    main()
