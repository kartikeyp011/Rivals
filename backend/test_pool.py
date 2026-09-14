import asyncio, asyncpg
async def f():
    p = await asyncpg.create_pool('postgresql://postgres:postgres@127.0.0.1:54322/postgres', min_size=2, max_size=10)
    await p.close()
asyncio.run(f())
