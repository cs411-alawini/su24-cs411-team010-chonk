from pydantic import BaseModel


class Map(BaseModel):
    map_id: int
    name: str
