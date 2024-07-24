# rye run fastapi dev src/backend/main.py
from contextlib import asynccontextmanager
from typing import Union

from database import engine
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from models import Map
from sqlalchemy import text


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db = engine.connect()
    yield
    engine.dispose()


app = FastAPI(lifespan=lifespan)

# Pydantic model for the login request body
class LoginRequest(BaseModel):
    username: str
    password: str

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

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

# new POST endpoint for login
@app.post("/login")
async def login(request: LoginRequest):
    # Extract username and password from the request
    username = request.username
    password = request.password

    # login logic, check against DB, need to hash and unhash
    # where to store hash key?

    # testing stuff
    if username == "testuser" and password == "testpassword":
        return {"message": "Login successful"}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")