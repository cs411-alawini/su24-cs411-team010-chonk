from pydantic import BaseModel


class Map(BaseModel):
    map_id: int
    name: str


class User(BaseModel):
    user_id: int
    username: str
    player_id: str | None
    pro_lookalike: str | None
    password_hash: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None
