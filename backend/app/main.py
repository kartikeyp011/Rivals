from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.core.db import init_db_pool, close_db_pool
from app.core.errors import AppError, app_error_handler, global_exception_handler

# Import routers
from app.routers import arenas, invites, participants, rounds, attempts, results, friends, users, coins, wagers, streaks, leaderboards, webhooks, subscriptions

# Setup basic logging
logging.basicConfig(level=settings.LOG_LEVEL)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup events
    await init_db_pool()
    yield
    # Shutdown events
    await close_db_pool()

app = FastAPI(
    title="Rivals Backend API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Register routers
app.include_router(arenas.router, prefix="/api/v1")
app.include_router(invites.router, prefix="/api/v1")  # Handles /api/v1/invites and /api/v1/arenas/.../invites
app.include_router(participants.router, prefix="/api/v1")
app.include_router(rounds.router, prefix="/api/v1")
app.include_router(attempts.router, prefix="/api/v1")
app.include_router(results.router, prefix="/api/v1")
app.include_router(coins.router, prefix="/api/v1")
app.include_router(wagers.router, prefix="/api/v1")
app.include_router(friends.router)
app.include_router(users.router)
app.include_router(streaks.router)
app.include_router(leaderboards.router)
app.include_router(webhooks.router, prefix="/api/v1")
app.include_router(subscriptions.router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
