import os

from dotenv import load_dotenv  # type: ignore[import-not-found]
from sqlalchemy import create_engine  # type: ignore[import-not-found]
from sqlalchemy.orm import declarative_base, sessionmaker  # type: ignore[import-not-found]

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL não encontrada no arquivo .env")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()