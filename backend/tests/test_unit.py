"""Testes unitários — validações de schema, helpers de serviço e dependências de acesso."""

from datetime import date, timedelta

import pytest
from fastapi import HTTPException
from jose import jwt
from pydantic import ValidationError

from app.dependencies import require_pesquisador, require_servidor
from app.models.edicao import Edicao
from app.models.pesquisa import Pesquisa, TipoPesquisaEnum
from app.models.usuario import Usuario
from app.schemas.pesquisa import PesquisaCreate
from app.services.auth import ALGORITHM, SECRET_KEY, gerar_token
from app.services.edicao import edicao_aberta, edicao_de_campo, status_edicao


# ---------------------------------------------------------------------------
# Schema PesquisaCreate — tipo
# ---------------------------------------------------------------------------

def test_pesquisa_create_tipo_default_publica():
    p = PesquisaCreate(nome="X")
    assert p.tipo == TipoPesquisaEnum.publica


def test_pesquisa_create_aceita_tipo_campo():
    p = PesquisaCreate(nome="Demanda", tipo="campo")
    assert p.tipo == TipoPesquisaEnum.campo


def test_pesquisa_create_rejeita_tipo_invalido():
    with pytest.raises(ValidationError):
        PesquisaCreate(nome="X", tipo="presencial")


# ---------------------------------------------------------------------------
# Helpers de status/tipo de edição
# ---------------------------------------------------------------------------

def _edicao(abertura, fechamento, tipo="campo"):
    return Edicao(
        data_abertura=abertura,
        data_fechamento=fechamento,
        pesquisa=Pesquisa(nome="P", tipo=tipo),
    )


def test_status_edicao_ativa():
    hoje = date(2026, 6, 1)
    ed = _edicao(hoje - timedelta(days=1), hoje + timedelta(days=1))
    assert status_edicao(ed, hoje) == "ativa"
    assert edicao_aberta(ed, hoje) is True


def test_status_edicao_agendada():
    hoje = date(2026, 6, 1)
    ed = _edicao(hoje + timedelta(days=2), None)
    assert status_edicao(ed, hoje) == "agendada"
    assert edicao_aberta(ed, hoje) is False


def test_status_edicao_encerrada():
    hoje = date(2026, 6, 1)
    ed = _edicao(hoje - timedelta(days=5), hoje - timedelta(days=1))
    assert status_edicao(ed, hoje) == "encerrada"
    assert edicao_aberta(ed, hoje) is False


def test_edicao_de_campo():
    assert edicao_de_campo(_edicao(date.today(), None, tipo="campo")) is True
    assert edicao_de_campo(_edicao(date.today(), None, tipo="publica")) is False


# ---------------------------------------------------------------------------
# Dependências de autorização
# ---------------------------------------------------------------------------

def test_require_pesquisador_aceita_pesquisador():
    u = Usuario(nome="P", role="pesquisador_campo")
    assert require_pesquisador(u) is u


def test_require_pesquisador_rejeita_servidor():
    u = Usuario(nome="S", role="servidor")
    with pytest.raises(HTTPException) as exc:
        require_pesquisador(u)
    assert exc.value.status_code == 403


def test_require_servidor_rejeita_pesquisador():
    u = Usuario(nome="P", role="pesquisador_campo")
    with pytest.raises(HTTPException) as exc:
        require_servidor(u)
    assert exc.value.status_code == 403


# ---------------------------------------------------------------------------
# Token JWT
# ---------------------------------------------------------------------------

def test_gerar_token_inclui_claims():
    u = Usuario(id=42, nome="Fulano", role="pesquisador_campo")
    token = gerar_token(u)
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "42"
    assert payload["nome"] == "Fulano"
    assert payload["role"] == "pesquisador_campo"
