from fastapi.testclient import TestClient
from main import app
import sqlalchemy
import sqlite3
import os

client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}


def test_read_item():
    response = client.get("/items/5")
    assert response.status_code == 200
    assert response.json() == {"item_id": 5, "q": None}


# CREATE TABLE some_table (
#     id INTEGER NOT NULL,
#     data INTEGER,
#     PRIMARY KEY (id),
#     UNIQUE (data) ON CONFLICT IGNORE
# )

async def start_dummy_app():

    con = sqlite3.connect("testing.db")
    cur = con.cursor()
    cur.execute("CREATE TABLE Player_Stats(game_id int,player_id varchar(50),agent_id int,average_combat_score int,kills int,deaths int,assists int,average_damage_per_round int,headshot_ratio double,tier int,primary key (game_id, player_id))")
    cur.execute("create table Games(primary key game_id int, map_id int, dateinfo varchar(20), riot_key varchar(50))")
    cur.execute("insert into Games(?, ?, ? ,?)", [(1, 1, "1", "blah1"),(2, 1, "1", "blah2"),(3, 1, "1", "blah3")])
    cur.executemany("INSERT INTO Player_Stats VALUES(?,?,?,?,?,?,?,?,?,?)", [(1, "meow404", 1, 1,1,1,1,1,0.5,20 ), (1, "meow404", 1, 1,1,1,1,1,0.5,20 ), (1, "meow404", 1, 1,1,1,1,1,0.5,20 )])
    con.close()
    engine = sqlalchemy.create_engine('sqlite:///testing.db')
    
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.db = engine.connect()
        yield
        engine.dispose()
    
    app = FastAPI(lifespan=lifespan)



def test_update_user_info():
    #app.dependency_overrides[request.app.state.db.execute] = start_dummy_app

