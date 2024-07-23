from pydantic import SecretStr
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_username: str = "chonk"
    database_password: SecretStr | None = None
    database_host: str | None = None
    database_dbname: str = "chonk"


settings = Settings()
