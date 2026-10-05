"""Database setup. SQLite by default so the prototype runs anywhere;
set DATABASE_URL=postgresql+psycopg://user:pass@host/db to move to PostgreSQL
(and add pgvector) without changing any application code."""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

DEFAULT_SQLITE = "sqlite:///" + os.path.join(DATA_DIR, "complygem.db").replace("\\", "/")
DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_SQLITE)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
