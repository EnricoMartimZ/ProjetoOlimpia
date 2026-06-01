"""
Testes de integração da funcionalidade de pesquisas de campo.

Cobrem:
- criação de pesquisa do tipo "campo" pelo servidor (e bloqueio do pesquisador);
- listagem/abertura de edições de campo restrita ao pesquisador de campo;
- envio de resposta vinculada ao pesquisador e à edição;
- bloqueio do fluxo público para pesquisas de campo.
"""

from datetime import date, timedelta

from app.models.resposta import Coletou, Resposta


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _criar_pesquisa(client, headers, nome, tipo):
    resp = client.post(
        "/pesquisas",
        headers=headers,
        json={
            "nome": nome,
            "descricao": "desc",
            "tipo": tipo,
            "campos": [
                {"texto_pergunta": "Cidade de origem", "tipo": "texto",
                 "opcoes": [], "obrigatorio": True, "ordem": 0},
                {"texto_pergunta": "Motivo da visita", "tipo": "multipla_escolha",
                 "opcoes": ["Lazer", "Negócios"], "obrigatorio": True, "ordem": 1},
            ],
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def _lancar_edicao(client, headers, pesquisa_id, abertura=None, fechamento=None):
    resp = client.post(
        f"/pesquisas/{pesquisa_id}/edicoes",
        headers=headers,
        json={
            "data_abertura": (abertura or date.today()).isoformat(),
            "data_fechamento": fechamento.isoformat() if fechamento else None,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# Criação de pesquisa de campo (admin)
# ---------------------------------------------------------------------------

def test_servidor_cria_pesquisa_de_campo(client, servidor):
    pesquisa = _criar_pesquisa(client, servidor["headers"], "Demanda Turística", "campo")
    assert pesquisa["tipo"] == "campo"

    # Aparece com o tipo correto na listagem
    listagem = client.get("/pesquisas").json()
    assert any(p["id"] == pesquisa["id"] and p["tipo"] == "campo" for p in listagem)


def test_tipo_default_publica(client, servidor):
    resp = client.post(
        "/pesquisas",
        headers=servidor["headers"],
        json={"nome": "Sem tipo", "descricao": "", "campos": []},
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["tipo"] == "publica"


def test_pesquisador_nao_pode_criar_pesquisa(client, pesquisador):
    resp = client.post(
        "/pesquisas",
        headers=pesquisador["headers"],
        json={"nome": "Tentativa", "descricao": "", "tipo": "campo", "campos": []},
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Listagem de edições de campo (pesquisador)
# ---------------------------------------------------------------------------

def test_listar_edicoes_campo_so_retorna_campo(client, servidor, pesquisador):
    campo = _criar_pesquisa(client, servidor["headers"], "Campo", "campo")
    publica = _criar_pesquisa(client, servidor["headers"], "Publica", "publica")
    ed_campo = _lancar_edicao(client, servidor["headers"], campo["id"])
    _lancar_edicao(client, servidor["headers"], publica["id"])

    resp = client.get("/pesquisador/edicoes", headers=pesquisador["headers"])
    assert resp.status_code == 200, resp.text
    ids = [e["id"] for e in resp.json()]
    assert ids == [ed_campo["id"]]  # só a edição de campo


def test_listar_edicoes_campo_ignora_encerradas(client, servidor, pesquisador):
    campo = _criar_pesquisa(client, servidor["headers"], "Campo", "campo")
    ontem = date.today() - timedelta(days=2)
    _lancar_edicao(client, servidor["headers"], campo["id"],
                   abertura=ontem, fechamento=date.today() - timedelta(days=1))

    resp = client.get("/pesquisador/edicoes", headers=pesquisador["headers"])
    assert resp.status_code == 200
    assert resp.json() == []  # edição encerrada não aparece


def test_listar_edicoes_campo_exige_pesquisador(client, servidor):
    # servidor → 403
    assert client.get("/pesquisador/edicoes", headers=servidor["headers"]).status_code == 403
    # anônimo → 401
    assert client.get("/pesquisador/edicoes").status_code == 401


# ---------------------------------------------------------------------------
# Formulário da edição de campo
# ---------------------------------------------------------------------------

def test_form_edicao_campo(client, servidor, pesquisador):
    campo = _criar_pesquisa(client, servidor["headers"], "Campo", "campo")
    ed = _lancar_edicao(client, servidor["headers"], campo["id"])

    resp = client.get(f"/pesquisador/edicoes/{ed['id']}", headers=pesquisador["headers"])
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["edicao_id"] == ed["id"]
    assert len(body["campos"]) == 2


def test_form_edicao_campo_404_para_publica(client, servidor, pesquisador):
    publica = _criar_pesquisa(client, servidor["headers"], "Publica", "publica")
    ed = _lancar_edicao(client, servidor["headers"], publica["id"])

    # Pesquisa pública não é acessível pelo fluxo de campo
    resp = client.get(f"/pesquisador/edicoes/{ed['id']}", headers=pesquisador["headers"])
    assert resp.status_code == 404


def test_publico_nao_expoe_form_de_campo(client, servidor):
    campo = _criar_pesquisa(client, servidor["headers"], "Campo", "campo")
    ed = _lancar_edicao(client, servidor["headers"], campo["id"])

    # O endpoint público trata a edição de campo como inexistente
    resp = client.get(f"/publico/edicoes/{ed['id']}")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Envio de resposta de campo — vínculo com pesquisador e edição
# ---------------------------------------------------------------------------

def test_resposta_campo_vincula_pesquisador_e_edicao(client, servidor, pesquisador, db):
    campo = _criar_pesquisa(client, servidor["headers"], "Campo", "campo")
    ed = _lancar_edicao(client, servidor["headers"], campo["id"])
    campos = client.get(f"/pesquisador/edicoes/{ed['id']}", headers=pesquisador["headers"]).json()["campos"]

    payload = {"respostas": [
        {"campo_id": campos[0]["id"], "atributo_texto": "São Paulo"},
        {"campo_id": campos[1]["id"], "atributo_texto": "Lazer"},
    ]}
    resp = client.post(
        f"/pesquisador/edicoes/{ed['id']}/respostas",
        headers=pesquisador["headers"],
        json=payload,
    )
    assert resp.status_code == 201, resp.text
    resposta_id = resp.json()["id"]

    # A resposta foi gravada vinculada ao pesquisador e à edição
    resposta = db.get(Resposta, resposta_id)
    assert resposta is not None
    assert resposta.usuario_id == pesquisador["id"]
    assert resposta.edicao_id == ed["id"]

    coletas = db.query(Coletou).filter(Coletou.resposta_id == resposta_id).all()
    assert {c.atributo_texto for c in coletas} == {"São Paulo", "Lazer"}


def test_consulta_admin_mostra_nome_de_quem_coletou(client, servidor, pesquisador):
    campo = _criar_pesquisa(client, servidor["headers"], "Campo", "campo")
    ed = _lancar_edicao(client, servidor["headers"], campo["id"])
    campos = client.get(f"/pesquisador/edicoes/{ed['id']}", headers=pesquisador["headers"]).json()["campos"]
    client.post(
        f"/pesquisador/edicoes/{ed['id']}/respostas",
        headers=pesquisador["headers"],
        json={"respostas": [{"campo_id": campos[0]["id"], "atributo_texto": "São Paulo"}]},
    )

    # O admin, ao consultar, vê o nome do pesquisador que coletou
    tabela = client.get(f"/edicoes/{ed['id']}/respostas", headers=servidor["headers"]).json()
    assert tabela["dados"][0]["usuario_nome"] == "Pesq Campo"
    assert tabela["dados"][0]["usuario_id"] == pesquisador["id"]


def test_consulta_admin_resposta_publica_sem_nome(client, servidor, db):
    publica = _criar_pesquisa(client, servidor["headers"], "Publica", "publica")
    ed = _lancar_edicao(client, servidor["headers"], publica["id"])
    campos = client.get(f"/publico/edicoes/{ed['id']}").json()["campos"]
    client.post(f"/edicoes/{ed['id']}/respostas",
                json={"respostas": [{"campo_id": campos[0]["id"], "atributo_texto": "x"}]})

    tabela = client.get(f"/edicoes/{ed['id']}/respostas", headers=servidor["headers"]).json()
    assert tabela["dados"][0]["usuario_nome"] is None


def test_resposta_campo_exige_pesquisador(client, servidor):
    campo = _criar_pesquisa(client, servidor["headers"], "Campo", "campo")
    ed = _lancar_edicao(client, servidor["headers"], campo["id"])
    campos = client.get(f"/pesquisador/edicoes/{ed['id']}", headers=servidor["headers"])
    # servidor nem consegue ver o form (403)
    assert campos.status_code == 403

    body = {"respostas": [{"campo_id": 1, "atributo_texto": "x"}]}
    # servidor → 403
    assert client.post(f"/pesquisador/edicoes/{ed['id']}/respostas",
                       headers=servidor["headers"], json=body).status_code == 403
    # anônimo → 401
    assert client.post(f"/pesquisador/edicoes/{ed['id']}/respostas", json=body).status_code == 401


def test_resposta_campo_edicao_encerrada_409(client, servidor, pesquisador):
    campo = _criar_pesquisa(client, servidor["headers"], "Campo", "campo")
    ed = _lancar_edicao(
        client, servidor["headers"], campo["id"],
        abertura=date.today() - timedelta(days=3),
        fechamento=date.today() - timedelta(days=1),
    )
    # Pega ids dos campos pela pesquisa (form de campo retorna mesmo encerrado)
    campos = client.get(f"/pesquisador/edicoes/{ed['id']}", headers=pesquisador["headers"]).json()["campos"]
    body = {"respostas": [{"campo_id": campos[0]["id"], "atributo_texto": "x"}]}
    resp = client.post(f"/pesquisador/edicoes/{ed['id']}/respostas",
                       headers=pesquisador["headers"], json=body)
    assert resp.status_code == 409


def test_resposta_campo_campo_invalido_422(client, servidor, pesquisador):
    campo = _criar_pesquisa(client, servidor["headers"], "Campo", "campo")
    ed = _lancar_edicao(client, servidor["headers"], campo["id"])
    body = {"respostas": [{"campo_id": 99999, "atributo_texto": "x"}]}
    resp = client.post(f"/pesquisador/edicoes/{ed['id']}/respostas",
                       headers=pesquisador["headers"], json=body)
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Fluxo público vs. campo
# ---------------------------------------------------------------------------

def test_publico_nao_responde_pesquisa_de_campo(client, servidor):
    campo = _criar_pesquisa(client, servidor["headers"], "Campo", "campo")
    ed = _lancar_edicao(client, servidor["headers"], campo["id"])
    body = {"respostas": [{"campo_id": 1, "atributo_texto": "x"}]}
    # endpoint público recusa pesquisa de campo
    resp = client.post(f"/edicoes/{ed['id']}/respostas", json=body)
    assert resp.status_code == 403


def test_publico_responde_pesquisa_publica(client, servidor, db):
    publica = _criar_pesquisa(client, servidor["headers"], "Publica", "publica")
    ed = _lancar_edicao(client, servidor["headers"], publica["id"])
    campos = client.get(f"/publico/edicoes/{ed['id']}").json()["campos"]
    body = {"respostas": [{"campo_id": campos[0]["id"], "atributo_texto": "Campinas"}]}
    resp = client.post(f"/edicoes/{ed['id']}/respostas", json=body)
    assert resp.status_code == 201, resp.text

    # resposta pública anônima → sem usuario_id
    resposta = db.get(Resposta, resp.json()["id"])
    assert resposta.usuario_id is None
