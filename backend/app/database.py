from sqlmodel import SQLModel, create_engine, Session

sqlite_file_name = "data/database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# Check for DATABASE_URL environment variable (from Render/Neon)
import os
database_url = os.getenv("DATABASE_URL")

# If DATABASE_URL is set, use it. Otherwise, fallback to SQLite.
# Note: Render provides postgres:// which SQLAlchemy < 1.4 doesn't like, replace with postgresql://
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

connection_string = database_url if database_url else sqlite_url

connect_args = {"check_same_thread": False} if "sqlite" in connection_string else {}
engine = create_engine(connection_string, echo=True, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
