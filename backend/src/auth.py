from datetime import datetime, timedelta, timezone

import jwt
from config import get_settings
from models import User
from passlib.context import CryptContext
from sqlalchemy import text

settings = get_settings()

if settings.secret_key is None:
    raise ValueError("secret_key is required")


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, password_hash):
    return pwd_context.verify(plain_password, password_hash)


def get_password_hash(password):
    return pwd_context.hash(password)


def get_user(db, username: str):
    statement = text("select * from User where username=:username").bindparams(
        username=username
    )
    with db.connect() as connection:
        user_data = connection.execute(statement).fetchone()
    if not user_data:
        return None

    return User(
        user_id=user_data.user_id,
        username=user_data.username,
        player_id=user_data.player_id,
        pro_lookalike=user_data.pro_lookalike,
        password_hash=user_data.password_hash,
    )


def register_user(db, username: str, password: str):
    statement = text("select * from Player where player_id=:player_id").bindparams(
        player_id=username
    )
    with db.connect() as connection:
        player_data = connection.execute(statement).fetchone()

        if not player_data:
            statement = text(
                "insert into Player (player_id, current_tier_id) values (:player_id, :current_tier_id)"
            ).bindparams(player_id=username, current_tier_id=3)
            connection.execute(statement)
            connection.commit()

        statement = text(
            "insert into User (username, player_id, password_hash) values (:username, :player_id, :password_hash)"
        ).bindparams(
            username=username,
            player_id=username,
            password_hash=get_password_hash(password),
        )
        connection.execute(statement)
        connection.commit()


def authenticate_user(db, username: str, password: str):
    user = get_user(db, username)
    if not user:
        register_user(db, username, password)
        user = get_user(db, username)
        if not user:
            raise ValueError("Failed to create user")
    if not verify_password(password, user.password_hash):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key.get_secret_value(),  # type: ignore
        algorithm=settings.algorithm,
    )
    return encoded_jwt
