from pydantic import BaseModel
from datetime import datetime

class WeeklyBonusClaimResponse(BaseModel):
    claimed: bool
    already_claimed: bool
    coins_awarded: int
    balance: int
    period_start: datetime
    period_end: datetime
