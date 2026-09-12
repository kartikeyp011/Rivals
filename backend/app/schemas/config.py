from pydantic import BaseModel
from typing import List
from app.schemas.arena import QuestionDifficulty

class ArenaConfigOptions(BaseModel):
    max_participants_min: int = 2
    max_participants_max: int = 8
    max_rounds_min: int = 1
    max_rounds_max: int = 20
    time_limit_seconds_min: int = 5
    time_limit_seconds_max: int = 300
    difficulties: List[QuestionDifficulty] = [d for d in QuestionDifficulty]
    categories: List[str]
