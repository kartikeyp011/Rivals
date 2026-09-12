from asyncpg import Connection

class BaseRepository:
    def __init__(self, conn: Connection):
        self.conn = conn
