import pickle
from contextlib import asynccontextmanager
from datetime import timedelta
from typing import Annotated, Union

import config
import jwt
import pandas as pd
import scipy as sp
import valo_api
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


def replace_percentage(df, column):
    df[column] = df[column].str.replace("%", "").astype(float)
    return df


import __main__  # noqa: E402

__main__.replace_percentage = replace_percentage  # type: ignore


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db = engine
    app.state.model = pickle.load(open("/app/model.pkl", "rb"))
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


@app.get("/update_user_data")
async def update_user_data(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
):
    player_id = current_user.player_id

    if not player_id:
        return

    if "#" not in player_id:
        return {"success": False}
    ign_tag = player_id.split("#")
    playerign = ign_tag[0]
    playertag = ign_tag[1]

    query = text(
        "select game_id, player_id,won, agent_id, average_combat_score,kills,deaths,assists,average_damage_per_round,headshot_ratio, tier_id from playerstats1 where player_id = :playerid"
    ).bindparams(playerid=player_id)
    matches = await valo_api.get_match_history_by_name_v3_async(  # type: ignore
        "na", playerign, playertag, game_mode="competitive"
    )

    for match in matches:
        metadata = match.metadata
        winteam = "Blue"
        if match.teams.red.has_won:
            winteam = "Red"
        # print(metadata.map, metadata.game_start, metadata.matchid)
        query = text("select map_id from Maps where map_name = :map").bindparams(
            map=metadata.map
        )
        mapp = request.app.state.db.execute(query).first()[0]
        stmst = text(
            "insert into Game(map_id, date_info, riot_id) values(:map, :game_start, :matchid)"
        ).bindparams(map=mapp, game_start=metadata.game_start, matchid=metadata.matchid)
        request.app.state.db.execute(stmst)
        request.app.state.db.commit()
        query = text("select game_id from Game where riot_id =:id").bindparams(
            id=metadata.matchid
        )  # maybe can get game id in same execution as insert?
        result = request.app.state.db.execute(query)
        game_id = result.first()[0]
        # print(f"gameid = {game_id}")

        query = text(
            "select * from playerstats1  where game_id =:id and player_id = :playerid"
        ).bindparams(id=game_id, playerid=player_id)
        with request.app.state.db.connect() as connection:
            result = connection.execute(query)

        if not result.first():
            # print(matchdict.players)
            matchrounds = metadata.rounds_played
            player_data = match.players.all_players
            for player in player_data:
                if player.tag == playertag and player.name == playerign:
                    didwin = False
                    if player.team == winteam:
                        didwin = True
                    shots = (
                        player.stats.bodyshots
                        + player.stats.headshots
                        + player.stats.legshots
                    )
                    query = text(
                        "select agent_id from Agents where agent_name = :agent"
                    ).bindparams(agent=player.character)
                    with request.app.state.db.connect() as connection:
                        agent = connection.execute(query).first()[0]
                        stmst = text(
                            "insert into playerstats1 (game_id, player_id,won, agent_id, average_combat_score,kills,deaths,assists,average_damage_per_round,headshot_ratio, tier_id) values(:gid, :pid, :w, :aid, :acs, :k, :d,:a,:adr,:hr,:tid)"
                        ).bindparams(
                            gid=game_id,
                            pid=player_id,
                            w=didwin,
                            aid=agent,
                            acs=player.stats.score / matchrounds,
                            k=player.stats.kills,
                            d=player.stats.deaths,
                            a=player.stats.assists,
                            adr=player.damage_made / matchrounds,
                            hr=player.stats.headshots / shots,
                            tid=player.currenttier,
                        )
                        connection.execute(stmst)
                        connection.commit()

    return {"success": True}


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
    map_name = most_played_map.map
    return {"most_played_map": f"{map_name}"}


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
        "SELECT player_id, avg(average_combat_score), avg(deaths),avg(assists) ,avg(kill_assist_trade_survive_ratio),avg(average_damage_per_round),avg(headshot_ratio),avg(first_kills),avg(first_deaths) FROM Player_Stats where agent_id=:agent and tier_id = 21 group by player_id  order by count(agent_id) desc limit 100"
    ).bindparams(agent=agent)
    with request.app.state.db.connect() as connection:
        pros = list(connection.execute(pro_query))
    pro_tree = sp.spatial.KDTree([x[1:] for x in pros])
    query = text(
        "SELECT avg(average_combat_score), avg(deaths),avg(assists) ,avg(kill_assist_trade_survive_ratio),avg(average_damage_per_round),avg(headshot_ratio),avg(first_kills),avg(first_deaths) FROM Player_Stats where player_id=:player_id group by player_id"
    ).bindparams(player_id=player_id)
    with request.app.state.db.connect() as connection:
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
    with request.app.state.db.connect() as connection:
        result = connection.execute(query)
    agent_synergies = result.fetchall()

    return {"agent_synergies": f"{agent_synergies}"}


@app.get("/player_most_played_agent")
def player_most_played_agent(
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
        "SELECT DISTINCT p1.player_id FROM Player_Stats p1 WHERE :agent=(SELECT agent_id AS games_played FROM Player_Stats p2 WHERE p2.player_id = p1.player_id GROUP BY agent_id ORDER BY COUNT(agent_id) DESC LIMIT 1) GROUP BY p1.player_id ORDER BY COUNT(p1.agent_id) DESC LIMIT 15"
    ).bindparams(agent=agent)
    with request.app.state.db.connect() as connection:
        result = connection.execute(query)
    player = result.fetchall()

    return {"player_most_played_agent": f"{[row for row in player]}"}


@app.get("/agent_recommendations")
def agent_recommendations(
    map_name: str,
    tier_id: int,
    request: Request,
):
    query = text(
        "SELECT a.agent_name, z.win_rate FROM"
        " (SELECT p.agent_id FROM Player_Stats p JOIN Game g ON p.game_id = g.game_id JOIN Maps m ON m.map_id = g.map_id WHERE m.map_name = :map_name GROUP BY agent_id ORDER BY COUNT(agent_id) DESC LIMIT 5)"
        " AS y LEFT JOIN"
        " (SELECT a.win_rate, a.agent_id FROM Agent_Stats a JOIN Maps m ON m.map_id = a.map_id WHERE m.map_name = :map_name AND a.tier_id = :tier_id)"
        " AS z ON y.agent_id = z.agent_id JOIN Agents a ON a.agent_id = y.agent_id ORDER BY z.win_rate DESC"
    ).bindparams(map_name=map_name, tier_id=tier_id)
    with request.app.state.db.connect() as connection:
        result = connection.execute(query)
    recommendations = result.fetchall()

    return {"agent_recommendations": f"{recommendations}"}


@app.get("/top_agent_map")
def top_agent_map(
    request: Request,
):
    query = text("""
        SELECT m.map_name, a.agent_name, astats.acs AS MaxACS
        FROM Agent_Stats astats JOIN Agents a ON astats.agent_id = a.agent_id JOIN Map_Stats mstats ON astats.map_id = mstats.map_id AND astats.tier_id = mstats.tier_id JOIN Maps m ON mstats.map_id = m.map_id
         WHERE (astats.map_id, astats.acs) IN (
            SELECT map_id, MAX(acs) FROM Agent_Stats GROUP BY map_id
        )
         ORDER BY m.map_name, MaxACS DESC
    """)
    with request.app.state.db.connect() as connection:
        result = connection.execute(query)
    top_agent_map = result.fetchall()

    results = {
        map_name: [
            {"agent_name": agent_name, "max_acs": max_acs}
            for _, agent_name, max_acs in top_agent_map
        ]
        for map_name in set([map_name for map_name, _, _ in top_agent_map])
    }

    return results


@app.get("/analyze_performance")
def analyze_performance(
    map_name: str,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
):
    player_id = current_user.player_id

    call_procedure = text("CALL AnalyzePlayerPerformance(:player_id, :map_name)")

    with request.app.state.db.connect() as connection:
        result = connection.execute(
            call_procedure, {"player_id": player_id, "map_name": map_name}
        )
    analysis = result.fetchall()

    return {"kowalski_analysis": f"{analysis}"}


# stored_procedure = """
#     DELIMITER //
#     CREATE PROCEDURE AnalyzePlayerPerformance(IN player_id VARCHAR(50), IN map_name VARCHAR(50))
#     BEGIN
#         DECLARE done INT DEFAULT 0;
#         DECLARE map_acs INT;
#         DECLARE map_kills INT;
#         DECLARE map_deaths INT;
#         DECLARE map_assists INT;
#         DECLARE map_matches INT;
#         DECLARE overall_acs INT;
#         DECLARE overall_kills INT;
#         DECLARE overall_deaths INT;
#         DECLARE overall_assists INT;
#         DECLARE overall_matches INT;
#         DECLARE map_acs_ratio FLOAT;
#         DECLARE map_kill_ratio FLOAT;
#         DECLARE map_death_ratio FLOAT;
#         DECLARE map_assist_ratio FLOAT;
#         DECLARE overall_acs_ratio FLOAT;
#         DECLARE overall_kill_ratio FLOAT;
#         DECLARE overall_death_ratio FLOAT;
#         DECLARE overall_assist_ratio FLOAT;

#         DECLARE map_cursor CURSOR FOR
#             SELECT SUM(average_combat_score), SUM(kills), SUM(deaths), SUM(assists), COUNT(*)
#             FROM Player_Stats p
#             JOIN Game g ON p.game_id = g.game_id
#             JOIN Maps m ON g.map_id = m.map_id
#             WHERE p.player_id = player_id AND m.map_name = map_name;

#         DECLARE overall_cursor CURSOR FOR
#             SELECT SUM(average_combat_score), SUM(kills), SUM(deaths), SUM(assists), COUNT(*)
#             FROM Player_Stats p
#             WHERE p.player_id = player_id;

#         DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

#         OPEN map_cursor;
#         FETCH map_cursor INTO map_acs, map_kills, map_deaths, map_assists, map_matches;
#         CLOSE map_cursor;

#         OPEN overall_cursor;
#         FETCH overall_cursor INTO overall_acs, overall_kills, overall_deaths, overall_assists, overall_matches;
#         CLOSE overall_cursor;

#         IF map_matches > 0 THEN
#             SET map_acs_ratio = map_acs / map_matches;
#             SET map_kill_ratio = map_kills / map_matches;
#             SET map_death_ratio = map_deaths / map_matches;
#             SET map_assist_ratio = map_assists / map_matches;
#         ELSE
#             SET map_acs_ratio = 0;
#             SET map_kill_ratio = 0;
#             SET map_death_ratio = 0;
#             SET map_assist_ratio = 0;
#         END IF;

#         IF overall_matches > 0 THEN
#             SET overall_acs_ratio = overall_acs / overall_matches;
#             SET overall_kill_ratio = overall_kills / overall_matches;
#             SET overall_death_ratio = overall_deaths / overall_matches;
#             SET overall_assist_ratio = overall_assists / overall_matches;
#         ELSE
#             SET overall_acs_ratio = 0;
#             SET overall_kill_ratio = 0;
#             SET overall_death_ratio = 0;
#             SET overall_assist_ratio = 0;
#         END IF;

#         SELECT player_id, map_name, map_acs_ratio, map_kill_ratio, map_death_ratio, map_assist_ratio, map_matches, overall_acs_ratio, overall_kill_ratio, overall_death_ratio, overall_assist_ratio, overall_matches,
#             IF(map_acs_ratio > overall_acs_ratio, '↑', '↓') AS acs_comparison,
#             IF(map_kill_ratio > overall_kill_ratio, '↑', '↓') AS kill_comparison,
#             IF(map_death_ratio < overall_death_ratio, '↑', '↓') AS death_comparison,
#             IF(map_assist_ratio > overall_assist_ratio, '↑', '↓') AS assist_comparison;
#     END //
#     DELIMITER ;
#     """


@app.get("/matches")
async def matches(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
):
    player_id = current_user.player_id
    query = text(
        "SELECT * from Player_Stats natural join Game natural join Maps natural join Agents where player_id=:player_id  order by game_id limit 5"
    ).bindparams(player_id=player_id)
    with request.app.state.db.connect() as connection:
        result = connection.execute(query)
    match_data = result.fetchall()

    matches = [
        {
            "date_info": match.date_info,
            "agent_name": match.agent_name,
            "map_name": match.map_name,
            "kills": match.kills,
            "deaths": match.deaths,
            "assists": match.assists,
            "average_combat_score": match.average_combat_score,
            "headshot_ratio": match.headshot_ratio,
            "first_kills": match.first_kills,
            "first_deaths": match.first_deaths,
        }
        for match in match_data
    ]

    return matches


# DELIMITER //

# CREATE TRIGGER userlogin BEFORE INSERT ON User
# FOR EACH ROW
# BEGIN
#     DECLARE user_count INT;
#     SELECT COUNT(*) INTO user_count
#     FROM User
#     WHERE username = NEW.username;
#     IF user_count = 0 THEN
#         INSERT INTO User (username, player_id, password_hash)
#         VALUES (NEW.username, NEW.player_id, NEW.password_hash);
#     END IF;
# END //

# DELIMITER ;


@app.get("/model_matches")
async def model_matches(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
):
    player_id = current_user.player_id
    query = text(
        "SELECT * from Player_Stats natural join Game natural join Maps natural join Agents where player_id=:player_id  order by game_id limit 5"
    ).bindparams(player_id=player_id)
    with request.app.state.db.connect() as connection:
        result = connection.execute(query)
    match_data = result.fetchall()

    matches = [
        {
            "side": match.team_side,
            "kill_assist_trade_survive_ratio": str(
                match.kill_assist_trade_survive_ratio
            ),
            "tier": match.tier_id,
            "kills_deaths": match.kills - match.deaths,
            "agent": match.agent_id,
            "average_damage_per_round": match.average_damage_per_round,
            "kills": match.kills,
            "deaths": match.deaths,
            "assists": match.assists,
            "average_combat_score": match.average_combat_score,
            "headshot_ratio": str(match.headshot_ratio),
            "first_kills": match.first_kills,
            "first_deaths": match.first_deaths,
        }
        for match in match_data
    ]

    X = pd.DataFrame(matches)
    predictions = request.app.state.model.predict_proba(X)
    return [prediction[1] for prediction in predictions]
