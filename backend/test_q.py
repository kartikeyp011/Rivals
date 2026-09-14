import asyncio, asyncpg
async def f():
    p = await asyncpg.connect('postgresql://postgres:postgres@127.0.0.1:54322/postgres')
    r = await p.fetchval('SELECT count(*) FROM questions WHERE is_active=true')
    print('Questions count:', r)
    await p.close()
asyncio.run(f())
