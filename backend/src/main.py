# rye run fastapi dev src/backend/main.py
from typing import Union

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

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