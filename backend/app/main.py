from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, usuarios
from app.routers import pesquisas, edicoes, publico, respostas, pesquisador
from app.routers import hospedagem, diaria_media

app = FastAPI(
    title="Projeto Olímpia",
    description="API de Gestão de Pesquisas para o Turismo de Olímpia — Secretaria de Turismo.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(pesquisas.router)
app.include_router(edicoes.router)
app.include_router(publico.router)
app.include_router(respostas.router)
app.include_router(pesquisador.router)
app.include_router(hospedagem.router)
app.include_router(diaria_media.router)
