import asyncio
from app.core.db import init_db_pool, close_db_pool
from app.services.coin_service import CoinService
from app.schemas.coin import CoinLedgerReason

async def give_coins_to_all_users():
    # Initialize the database pool
    pool = await init_db_pool()
    try:
        async with pool.acquire() as conn:
            # Fetch all user IDs from the profiles table
            users = await conn.fetch("SELECT id FROM profiles")
            print(f"Found {len(users)} users. Giving 1000 coins to each...")
            
            # Initialize the CoinService
            coin_service = CoinService(conn)
            
            # Iterate and add 1000 coins to each user
            for user in users:
                user_id = str(user['id'])
                try:
                    await coin_service.add_coins(
                        user_id=user_id,
                        amount=1000,
                        reason=CoinLedgerReason.admin_adjustment
                    )
                    print(f"Gave 1000 coins to user {user_id}")
                except Exception as e:
                    print(f"Failed to give coins to user {user_id}: {e}")
            
            print("Done!")
    finally:
        await close_db_pool()

if __name__ == "__main__":
    asyncio.run(give_coins_to_all_users())
