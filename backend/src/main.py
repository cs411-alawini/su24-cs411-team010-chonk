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
    app.state.db = engine
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
    with request.app.state.db.connect() as connection:
        result = connection.execute(query)
    map_data = result.fetchall()
    maps = [Map(map_id=map_id, name=map_name) for map_id, map_name in map_data]
    return maps


@app.get("/homepage-stats")
def get_homepage_stats(request: Request):
    agent_query = text(
        "select agent_name, AVG(kd) as avg_kd from Agent_Stats natural join Agents group by agent_id order by avg_kd desc limit 1"
    )
    weapon_query = text(
        "select weapon_name, count(*) as game_count from Weapon_Stats natural join Weapons group by weapon_id order by game_count desc limit 1"
    )
    map_query = text(
        "select map_name, count(*) as game_count from Map_Stats natural join Maps group by map_id order by game_count desc limit 1"
    )

    top_agents_query = text(
        "select agent_name, AVG(win_rate) as avg_win_rate, AVG(pick_rate) as avg_pick_rate, AVG(kd) as avg_kd, AVG(acs) as average_acs, SUM(num_matches) as match_count from Agent_Stats natural join Agents group by agent_id order by avg_win_rate desc limit 5"
    )
    with request.app.state.db.connect() as connection:
        agent_result = connection.execute(agent_query)
        best_agent = agent_result.fetchone()

        weapon_result = connection.execute(weapon_query)
        best_weapon = weapon_result.fetchone()

        map_result = connection.execute(map_query)
        best_map = map_result.fetchone()

        top_agents_result = connection.execute(top_agents_query)
        top_agents = top_agents_result.fetchall()

        top_agents_formatted = [
            {
                "agent_name": agent.agent_name,
                "avg_win_rate": agent.avg_win_rate,
                "avg_pick_rate": agent.avg_pick_rate,
                "avg_kd": agent.avg_kd,
                "average_acs": agent.average_acs,
                "match_count": agent.match_count,
            }
            for agent in top_agents
        ]

    return {
        "best_agent": {"agent_name": best_agent.agent_name, "kd": best_agent.avg_kd},
        "best_weapon": {
            "weapon_name": best_weapon.weapon_name,
            "game_count": best_weapon.game_count,
        },
        "best_map": {"map_name": best_map.map_name, "game_count": best_map.game_count},
        "top_agents": top_agents_formatted,
    }


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


@app.get("/users/me", response_model=User)
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
    with request.app.state.db.connect() as connection:
        result = connection.execute(query)
    player_stats_data = result.fetchone()
    if player_stats_data is None:
        return {"playerID": player_id}
    return {
        "playerID": player_id,
        "avgKillsPerGame": player_stats_data.avgKillsPerGame,
        "avgDeathsPerGame": player_stats_data.avgDeathsPerGame,
        "avgAssistsPerGame": player_stats_data.avgAssistsPerGame,
        "avgCombatScorePerGame": player_stats_data.avgCombatScorePerGame,
        "avgHeadShotRatio": player_stats_data.avgHeadShotRatio,
        "avgFirstBloodsPerGame": player_stats_data.avgFirstBloodsPerGame,
    }


# make kd tree work, assiugn agents to numbers...corresponding to roles in game maybe

# @app.get("/recommend_agent")
# def get_agent(request: Request):
#     curr_map = request.args['map']


@app.get("/most_played_agent")
def most_played_agent(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
):
    player_id = current_user.player_id
    query = text(
        "select agent_name as agent from Player_Stats p left join Agents a on p.agent_id = a.agent_id where player_id=:player_id group by p.agent_id order by count(p.agent_id) desc limit 1"
    ).bindparams(player_id=player_id)
    with request.app.state.db.connect() as connection:
        result = connection.execute(query)
    most_played_user = result.fetchone()
    if not most_played_user:
        return {"most_played_agent": None}

    agent = most_played_user.agent

    return {"most_played_agent": f"{agent}"}


@app.get("/most_played_map")
def most_played_map(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
):
    player_id = current_user.player_id
    query = text(
        "SELECT map_name as map FROM Player_Stats p JOIN Game g ON p.game_id = g.game_id JOIN Maps m ON g.map_id = m.map_id WHERE player_id=:player_id GROUP BY m.map_id ORDER BY COUNT(m.map_id) DESC LIMIT 1"
    ).bindparams(player_id=player_id)
    with request.app.state.db.connect() as connection:
        result = connection.execute(query)
    most_played_map = result.fetchone()
    map = most_played_map.map
    return {"most_played_map": f"{map}"}


@app.get("/pro_lookalike")
def get_pro_lookalike(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
):
    player_id = current_user.player_id

    query = text(
        "select agent_id as agent from Player_Stats where player_id=:player_id group by agent_id order by count(agent_id) desc limit 1"
    ).bindparams(player_id=player_id)
    with request.app.state.db.connect() as connection:
        result = connection.execute(query)
        most_played_user = result.fetchone()
        agent = most_played_user.agent
        pro_query = text(
            "SELECT player_id, avg(average_combat_score), avg(deaths),avg(assists),avg(kills_deaths) ,avg(kill_assist_trade_survive_ratio),avg(average_damage_per_round),avg(headshot_ratio),avg(first_kills),avg(first_deaths) FROM Player_Stats where agent_id=:agent and tier_id = 21 group by player_id  order by count(agent_id) desc limit 100"
        ).bindparams(agent=agent)
        pros = list(connection.execute(pro_query))
        pro_tree = sp.spatial.KDTree([x[1:] for x in pros])
        query = text(
            "SELECT avg(average_combat_score), avg(deaths),avg(assists),avg(kills_deaths) ,avg(kill_assist_trade_survive_ratio),avg(average_damage_per_round),avg(headshot_ratio),avg(first_kills),avg(first_deaths) FROM Player_Stats where player_id=:player_id group by player_id"
        ).bindparams(player_id=player_id)
        user_stats = list(connection.execute(query))
        _, best_match = pro_tree.query(user_stats, k=1)
        return {"best_match": f"{pros[best_match[0]][0]}"}


@app.get("/agent_synergies")
def agent_synergies(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
):
    player_id = current_user.player_id
    agent_query = text(
        "select agent_id as agent from Player_Stats p where player_id=:player_id group by p.agent_id order by count(p.agent_id) desc limit 1"
    ).bindparams(player_id=player_id)
    with request.app.state.db.connect() as connection:
        result = connection.execute(agent_query)
        most_played_user = result.fetchone()
        agent = most_played_user.agent

        query = text(
            "SELECT agent_name AS synergies FROM Player_Stats p JOIN Player ON p.player_id = Player.player_id LEFT JOIN Agents a ON p.agent_id = a.agent_id WHERE game_id IN (SELECT game_id FROM Player_Stats p WHERE agent_id=:agent) AND p.tier_id = Player.current_tier_id GROUP BY agent_name ORDER BY COUNT(agent_name) DESC LIMIT 15"
        ).bindparams(agent=agent)
        result = connection.execute(query)
        agent_synergies = result.fetchall()

    return {"agent_synergies": f"{agent_synergies}"}


@app.get("/pro_mains")
def player_most_played_agent(request: Request, agent: str):
    query = text(
        "SELECT p1.player_id, count(agent_id) from Player_Stats p1 where p1.tier_id = 21 and (select a.agent_id from Agents a where a.agent_name = :agent)=(SELECT p2.agent_id FROM Player_Stats p2 WHERE p2.player_id = p1.player_id GROUP BY p2.agent_id ORDER BY COUNT(p2.agent_id) DESC LIMIT 1) group by player_id order by count(agent_id) desc limit 20"
    ).bindparams(agent=agent)
    with request.app.state.db.connect() as connection:
        result = connection.execute(query)
    player = result.fetchall()
    player_to_count = {}
    for agent in player:
        player_to_count[agent[0]] = agent[1]

    return {"player_most_played_agent": player_to_count}
