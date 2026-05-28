from fastapi import FastAPI
from app.routers import auth, usuarios

app = FastAPI(title="MERX - Projeto Olímpia")

app.include_router(auth.router)
app.include_router(usuarios.router)
