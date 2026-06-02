"""
Integração: Hospedagem (CRUD) + Diária Média (REQ 6).

Cobre authz (servidor vs pesquisador vs anônimo), validações, unicidade
(hospedagem+data), cascata na remoção da hospedagem e o cálculo de pendentes.
"""

from datetime import date


HOSP = {
    "cnpj": "12.345.678/0001-90",
    "nome_fantasia": "Hotel Termas",
    "local": "Olímpia/SP",
    "categoria": "Resort",
    "estrelas": 5,
    "quartos": 120,
    "url_booking": "https://booking.com/hotel-termas",
    "foto_url": "https://img/termas.jpg",
}


def _criar_hospedagem(client, headers, **over):
    payload = {**HOSP, **over}
    return client.post("/hospedagens", json=payload, headers=headers)


# ---------------------------------------------------------------------------
# Hospedagem — CRUD e authz
# ---------------------------------------------------------------------------

def test_criar_hospedagem_servidor(client, servidor):
    resp = _criar_hospedagem(client, servidor["headers"])
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["cnpj"] == HOSP["cnpj"]
    assert body["nome_fantasia"] == "Hotel Termas"
    assert body["url_booking"] == "https://booking.com/hotel-termas"


def test_criar_hospedagem_exige_servidor(client, pesquisador):
    # pesquisador de campo → 403
    resp = _criar_hospedagem(client, pesquisador["headers"])
    assert resp.status_code == 403
    # anônimo → 401
    resp = _criar_hospedagem(client, {})
    assert resp.status_code == 401


def test_criar_hospedagem_cnpj_duplicado(client, servidor):
    _criar_hospedagem(client, servidor["headers"])
    resp = _criar_hospedagem(client, servidor["headers"])
    assert resp.status_code == 409


def test_estrelas_invalidas(client, servidor):
    resp = _criar_hospedagem(client, servidor["headers"], estrelas=9)
    assert resp.status_code == 422


def test_cnpj_formato_invalido(client, servidor):
    # sem máscara / formato errado → 422
    for cnpj in ["12345678000190", "abc", "12.345.678/0001-9", "12.345.678/0001-901"]:
        resp = _criar_hospedagem(client, servidor["headers"], cnpj=cnpj)
        assert resp.status_code == 422, f"esperava 422 para {cnpj!r}"
    # formato correto → 201
    resp = _criar_hospedagem(client, servidor["headers"], cnpj="98.765.432/0001-10")
    assert resp.status_code == 201, resp.text


def test_listar_e_detalhar_hospedagem(client, servidor):
    _criar_hospedagem(client, servidor["headers"])
    lista = client.get("/hospedagens", headers=servidor["headers"])
    assert lista.status_code == 200
    assert len(lista.json()) == 1

    detalhe = client.get(f"/hospedagens/{HOSP['cnpj']}", headers=servidor["headers"])
    assert detalhe.status_code == 200
    assert detalhe.json()["nome_fantasia"] == "Hotel Termas"


def test_atualizar_hospedagem(client, servidor):
    _criar_hospedagem(client, servidor["headers"])
    resp = client.put(
        f"/hospedagens/{HOSP['cnpj']}",
        json={"quartos": 200, "url_booking": "https://booking.com/novo"},
        headers=servidor["headers"],
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["quartos"] == 200
    assert body["url_booking"] == "https://booking.com/novo"
    # campos não enviados permanecem
    assert body["nome_fantasia"] == "Hotel Termas"


def test_remover_hospedagem_cascata(client, servidor, db):
    from app.models.diaria_media import DiariaMedia

    _criar_hospedagem(client, servidor["headers"])
    client.post(
        "/diarias",
        json={"hospedagem_cnpj": HOSP["cnpj"], "data": "2026-06-01", "preco": 300},
        headers=servidor["headers"],
    )

    resp = client.delete(f"/hospedagens/{HOSP['cnpj']}", headers=servidor["headers"])
    assert resp.status_code == 204
    # diária associada foi removida em cascata
    assert db.query(DiariaMedia).count() == 0


def test_remover_hospedagem_inexistente(client, servidor):
    resp = client.delete("/hospedagens/00.000.000/0001-00", headers=servidor["headers"])
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Diária Média
# ---------------------------------------------------------------------------

def test_registrar_diaria(client, servidor):
    _criar_hospedagem(client, servidor["headers"])
    resp = client.post(
        "/diarias",
        json={"hospedagem_cnpj": HOSP["cnpj"], "data": "2026-06-01", "preco": 450.50},
        headers=servidor["headers"],
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["preco"] == 450.50
    assert body["nome_fantasia"] == "Hotel Termas"  # join exibido na tabela


def test_registrar_diaria_hospedagem_inexistente(client, servidor):
    resp = client.post(
        "/diarias",
        json={"hospedagem_cnpj": "99.999.999/0001-99", "data": "2026-06-01", "preco": 100},
        headers=servidor["headers"],
    )
    assert resp.status_code == 404


def test_registrar_diaria_duplicada(client, servidor):
    _criar_hospedagem(client, servidor["headers"])
    dados = {"hospedagem_cnpj": HOSP["cnpj"], "data": "2026-06-01", "preco": 100}
    client.post("/diarias", json=dados, headers=servidor["headers"])
    resp = client.post("/diarias", json=dados, headers=servidor["headers"])
    assert resp.status_code == 409


def test_preco_negativo(client, servidor):
    _criar_hospedagem(client, servidor["headers"])
    resp = client.post(
        "/diarias",
        json={"hospedagem_cnpj": HOSP["cnpj"], "data": "2026-06-01", "preco": -1},
        headers=servidor["headers"],
    )
    assert resp.status_code == 422


def test_listar_diarias_com_filtros(client, servidor):
    _criar_hospedagem(client, servidor["headers"])
    _criar_hospedagem(client, servidor["headers"], cnpj="11.111.111/0001-11", nome_fantasia="Pousada Sol")
    client.post("/diarias", json={"hospedagem_cnpj": HOSP["cnpj"], "data": "2026-06-01", "preco": 100}, headers=servidor["headers"])
    client.post("/diarias", json={"hospedagem_cnpj": HOSP["cnpj"], "data": "2026-06-02", "preco": 200}, headers=servidor["headers"])
    client.post("/diarias", json={"hospedagem_cnpj": "11.111.111/0001-11", "data": "2026-06-01", "preco": 80}, headers=servidor["headers"])

    todos = client.get("/diarias", headers=servidor["headers"]).json()
    assert len(todos) == 3

    por_hosp = client.get(f"/diarias?hospedagem_cnpj={HOSP['cnpj']}", headers=servidor["headers"]).json()
    assert len(por_hosp) == 2

    por_data = client.get("/diarias?data=2026-06-01", headers=servidor["headers"]).json()
    assert len(por_data) == 2


def test_remover_diaria(client, servidor):
    _criar_hospedagem(client, servidor["headers"])
    criada = client.post(
        "/diarias",
        json={"hospedagem_cnpj": HOSP["cnpj"], "data": "2026-06-01", "preco": 100},
        headers=servidor["headers"],
    ).json()
    resp = client.delete(f"/diarias/{criada['id']}", headers=servidor["headers"])
    assert resp.status_code == 204
    assert client.get("/diarias", headers=servidor["headers"]).json() == []


def test_diarias_exige_servidor(client, pesquisador):
    assert client.get("/diarias", headers=pesquisador["headers"]).status_code == 403
    assert client.get("/diarias").status_code == 401


# ---------------------------------------------------------------------------
# Pendentes
# ---------------------------------------------------------------------------

def test_pendentes_hoje(client, servidor):
    _criar_hospedagem(client, servidor["headers"])
    _criar_hospedagem(client, servidor["headers"], cnpj="11.111.111/0001-11", nome_fantasia="Pousada Sol")

    hoje = date.today().isoformat()

    # ambas pendentes inicialmente
    pendentes = client.get("/diarias/pendentes", headers=servidor["headers"]).json()
    assert len(pendentes) == 2

    # registra a diária de hoje para uma delas
    client.post(
        "/diarias",
        json={"hospedagem_cnpj": HOSP["cnpj"], "data": hoje, "preco": 100},
        headers=servidor["headers"],
    )
    pendentes = client.get("/diarias/pendentes", headers=servidor["headers"]).json()
    cnpjs = [p["cnpj"] for p in pendentes]
    assert HOSP["cnpj"] not in cnpjs
    assert "11.111.111/0001-11" in cnpjs


def test_pendentes_por_data(client, servidor):
    _criar_hospedagem(client, servidor["headers"])
    client.post(
        "/diarias",
        json={"hospedagem_cnpj": HOSP["cnpj"], "data": "2026-06-01", "preco": 100},
        headers=servidor["headers"],
    )
    # na data com registro: não pendente
    assert client.get("/diarias/pendentes?data=2026-06-01", headers=servidor["headers"]).json() == []
    # noutra data: pendente
    assert len(client.get("/diarias/pendentes?data=2026-06-02", headers=servidor["headers"]).json()) == 1
