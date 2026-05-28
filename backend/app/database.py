from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Engine no SQLAlchemy
# código Python  →  Engine  →  Banco de dados
# Ela não abre uma conexão nova a cada query — ela mantém um pool de conexões abertas e reutiliza:
# Engine
# ├── conexão 1  (em uso)
# ├── conexão 2  (disponível)
# └── conexão 3  (disponível)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# É a classe pai de todos os seus models. Todo model que herdar dela vira uma tabela no banco.
class Base(DeclarativeBase):
    pass



def get_db():
    db = SessionLocal()
    try:
        yield db         
    finally:
        db.close()