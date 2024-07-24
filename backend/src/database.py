from config import get_settings
from sqlalchemy import URL, create_engine

settings = get_settings()

if settings.database_username is None:
    raise ValueError("database_username is required")

if settings.database_dbname is None:
    raise ValueError("database_dbname is required")

if settings.database_host is None:
    raise ValueError("database_host is required")

if settings.database_password is None:
    raise ValueError("database_password is required")

database_url = URL.create(
    "mysql+pymysql",
    username=settings.database_username,
    password=settings.database_password.get_secret_value(),
    host=settings.database_host,
    database=settings.database_dbname,
)

engine = create_engine(database_url, pool_size=20, max_overflow=0, pool_pre_ping=True)
