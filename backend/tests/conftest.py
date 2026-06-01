"""
Configuração compartilhada dos testes.

Os testes rodam contra um SQLite em memória (não tocam o Neon de produção).
Por isso é preciso definir DATABASE_URL e SECRET_KEY *antes* de importar a
aplicação — `app.database` cria a engine e `app.services.auth` lê a SECRET_KEY
no momento do import.

O model `Campo.opcoes` é um ARRAY no Postgres e um JSON no SQLite (via
`with_variant` em `app/models/pesquisa.py`), o que permite usar o mesmo schema
nos dois bancos.
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  garante que todos os models são registrados
from app.database import Base, get_db
from app.main import app

# Engine de teste: SQLite em memória, conexão única (StaticPool) para que as
# tabelas persistam entre as requisições do TestClient dentro de um teste.
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture
def db():
    """Sessão direta ao banco de teste (para asserts que inspecionam o estado)."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    """TestClient com o schema recriado a cada teste (isolamento)."""
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)


# ---------------------------------------------------------------------------
# Helpers de autenticação
# ---------------------------------------------------------------------------

def criar_usuario(client, nome, email, senha, role):
    resp = client.post(
        "/usuarios",
        json={"nome": nome, "email": email, "senha": senha, "role": role},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def login(client, email, senha):
    resp = client.post("/auth/login", json={"email": email, "senha": senha})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def servidor(client):
    """Cria um servidor e devolve seus dados + headers autenticados."""
    user = criar_usuario(client, "Serv Admin", "admin@teste.com", "senha123", "servidor")
    token = login(client, "admin@teste.com", "senha123")
    return {"id": user["id"], "token": token, "headers": auth_headers(token)}


@pytest.fixture
def pesquisador(client):
    """Cria um pesquisador de campo e devolve seus dados + headers autenticados."""
    user = criar_usuario(client, "Pesq Campo", "pesq@teste.com", "senha123", "pesquisador_campo")
    token = login(client, "pesq@teste.com", "senha123")
    return {"id": user["id"], "token": token, "headers": auth_headers(token)}
