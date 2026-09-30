from fastapi import APIRouter, Depends, Request, Response
from asyncpg import Connection
from uuid import UUID

from app.schemas.ad import AdIntentCreate, AdIntentResponse
from app.services.ad_service import AdService
from app.core.dependencies import get_current_user, get_db_connection

router = APIRouter(prefix="/ads", tags=["ads"])

def get_ad_service(conn: Connection = Depends(get_db_connection)) -> AdService:
    return AdService(conn)

@router.post("/intent", response_model=AdIntentResponse, status_code=201)
async def create_intent(
    data: AdIntentCreate,
    user_id: str = Depends(get_current_user),
    service: AdService = Depends(get_ad_service)
):
    return await service.create_intent(user_id, data)

# This route is hit by Google's servers. No authentication middleware.
@router.get("/ssv", status_code=200)
async def admob_ssv_webhook(
    request: Request,
    service: AdService = Depends(get_ad_service)
):
    # Extract query params
    signature = request.query_params.get("signature")
    key_id = request.query_params.get("key_id")
    custom_data = request.query_params.get("custom_data")
    event_id = request.query_params.get("transaction_id", "missing_transaction_id")
    reward_amount = int(request.query_params.get("reward_amount", 0))
    reward_item = request.query_params.get("reward_item", "")

    if not signature or not key_id or not custom_data:
        # Per AdMob specs, respond with HTTP 200 even for errors to stop retries,
        # or 400 if it's a bad request we want them to retry?
        # AdMob says "Your server should return an HTTP 200 OK status code when the callback is successfully received"
        return Response(status_code=400, content="Missing parameters")

    # The query string to verify is everything before &signature=
    raw_query = str(request.query_params)

    # httpx/fastapi parses query_params but we need the raw string up to signature
    # request.scope['query_string'] is bytes
    query_bytes = request.scope['query_string']
    query_str = query_bytes.decode('utf-8')

    # Usually AdMob appends &signature= at the end
    try:
        query_to_verify = query_str[:query_str.index("&signature=")]
    except ValueError:
        # Fallback if somehow signature is not at the end, though AdMob promises it is
        query_to_verify = query_str

    # Process asynchronously to not block
    import asyncio
    asyncio.create_task(service.process_ssv_webhook(
        query_string=query_to_verify,
        custom_data=custom_data,
        signature=signature,
        key_id=key_id,
        event_id=event_id,
        reward_amount=reward_amount,
        reward_item=reward_item
    ))

    return Response(status_code=200)
