from fastapi import FastAPI
from app.routers import usuarios

app = FastAPI(title="MERX - Projeto Olímpia")

app.include_router(usuarios.router)
# app.include_router(auth.router)
