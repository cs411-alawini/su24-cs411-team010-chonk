from contextlib import asynccontextmanager
from datetime import timedelta
from typing import Annotated, Union

import config
import jwt
import scipy as sp
from auth import (
    authenticate_user,
    create_access_token,
    get_user,
)
from config import get_settings
from database import engine
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from models import Map, Token, TokenData, User
from sqlalchemy import text

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db = engine.connect()
    yield
    engine.dispose()


app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_current_user(
    request: Request,
    settings: Annotated[config.Settings, Depends(get_settings)],
    token: Annotated[str, Depends(oauth2_scheme)],
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.secret_key.get_secret_value(),  # type: ignore
            algorithms=[settings.algorithm],
        )
        username: str | None = payload.get("sub")
        if not username:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
    token_data = TokenData(username=username)
    user = get_user(request.app.state.db, username=token_data.username)  # type: ignore
    if user is None:
        raise credentials_exception
    return user


@app.get("/")
async def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
async def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


@app.get("/maps")
def get_maps(request: Request):
    query = text("SELECT * FROM Maps")
    result = request.app.state.db.execute(query)
    map_data = result.fetchall()
    maps = [Map(map_id=map_id, name=map_name) for map_id, map_name in map_data]
    return maps


@app.post("/token")
async def login_for_access_token(
    request: Request,
    settings: Annotated[config.Settings, Depends(get_settings)],
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    user = authenticate_user(
        request.app.state.db, form_data.username, form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


@app.get("/users/me/", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return current_user


@app.get("/player-stats")
async def player_stats(
        request: Request,
        current_user: Annotated[User, Depends(get_current_user)],
    ):
        player_id = current_user.player_id
        query = text(
            "SELECT AVG(kills) as avgKillsPerGame, AVG(deaths) as avgDeathsPerGame, AVG(assists) as avgAssistsPerGame, AVG(average_combat_score) as avgCombatScorePerGame, AVG(headshot_ratio) as avgHeadShotRatio, AVG(first_kills) as avgFirstBloodsPerGame FROM Player_Stats where player_id=:player_id group by player_id"
        ).bindparams(player_id=player_id)
        result = request.app.state.db.execute(query)
        player_stats_data = result.fetchone()
        return {
            "avgKillsPerGame": player_stats_data.avgKillsPerGame,
            "avgDeathsPerGame": player_stats_data.avgDeathsPerGame,
            "avgAssistsPerGame": player_stats_data.avgAssistsPerGame,
            "avgCombatScorePerGame": player_stats_data.avgCombatScorePerGame,
            "avgHeadShotRatio": player_stats_data.avgHeadShotRatio,
            "avgFirstBloodsPerGame": player_stats_data.avgFirstBloodsPerGame,
        }

@app.get("/update_user_data")
async def update_user_data():
    playertag = ""
    playerign = ""
    puuid = ""
    CREDS = "username", "password"

    auth = riot_auth.RiotAuth()
    asyncio.run(auth.authorize(*CREDS))

    asyncio.run(auth.reauthorize())


    shard = "na"
    puuid = "86e9115c-62f3-5bb8-be55-90aa5f38ccc6"
    client_platform = "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9"
    client_version = "release-09.01-shipping-21-2669223"

    headers = {
        "X-Riot-ClientPlatform": client_platform,
        "X-Riot-ClientVersion": client_version,
        "Authorization": f"Bearer {auth.access_token}",
        "X-Riot-Entitlements-JWT": auth.entitlements_token,
    }

    r = requests.get(
        f"https://pd.{shard}.a.pvp.net/match-history/v1/history/{puuid}?queue=competitive",
        headers=headers,
    )

    # print(r.json())

    for match in r.json()["History"]:
        match_id = match["MatchID"]
        r = requests.get(
            f"https://pd.{shard}.a.pvp.net/match-details/v1/matches/{match_id}",
            headers=headers,
        )
        matchdata = r.json()

    matches_to_add = []
    
    for player in matchdata['player']:
        if player['tagLine'] == playertag and player['gameName'] == playerign:

    
    

@app.get("/most_played_agent")
def most_played_agent(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
):
    player_id = current_user.player_id
    query = text(
        "select agent_name as agent from Player_Stats p left join Agents a on p.agent_id = a.agent_id where player_id=:player_id group by p.agent_id order by count(p.agent_id) desc limit 1"
    ).bindparams(player_id=player_id)
    result = request.app.state.db.execute(query)
    most_played_user = result.fetchone()
    agent = most_played_user.agent
    return {"most_played_agent": f"{agent}"}


@app.get("/pro_lookalike")
def get_pro_lookalike(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
):
    player_id = current_user.player_id

    query = text(
        "select agent_id as agent from Player_Stats where player_id=:player_id group by agent_id order by count(agent_id) desc limit 1"
    ).bindparams(player_id=player_id)
    result = request.app.state.db.execute(query)
    most_played_user = result.fetchone()
    agent = most_played_user.agent
    pro_query = text(
        "SELECT player_id, avg(average_combat_score), avg(deaths),avg(assists),avg(kills_deaths) ,avg(kill_assist_trade_survive_ratio),avg(average_damage_per_round),avg(headshot_ratio),avg(first_kills),avg(first_deaths) FROM Player_Stats where agent_id=:agent and tier_id = 21 group by player_id  order by count(agent_id) desc limit 100"
    ).bindparams(agent=agent)
    pros = list(request.app.state.db.execute(pro_query))
    pro_tree = sp.spatial.KDTree([x[1:] for x in pros])
    query = text(
        "SELECT avg(average_combat_score), avg(deaths),avg(assists),avg(kills_deaths) ,avg(kill_assist_trade_survive_ratio),avg(average_damage_per_round),avg(headshot_ratio),avg(first_kills),avg(first_deaths) FROM Player_Stats where player_id=:player_id group by player_id"
    ).bindparams(player_id=player_id)
    user_stats = list(request.app.state.db.execute(query))
    _, best_match = pro_tree.query(user_stats, k=1)
    return {"best_match": f"{pros[best_match[0]][0]}"}
