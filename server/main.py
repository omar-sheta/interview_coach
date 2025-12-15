from __future__ import annotations

"""
Guided Learning Platform - FastAPI Server

A centralized server for AI-powered learning and practice coaching.
"""

import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from server.routers import auth, candidate, ai
from server.routers import learning, practice
# Archived routers (kept for reference):
# from server.routers import admin, interview
# from server.routes import stt_router

# Configure logging
import os
log_dir = os.path.dirname(os.path.abspath(__file__))
log_file = os.path.join(log_dir, "server.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(log_file, mode='a')
    ],
    force=True,
)
logger = logging.getLogger("guided_learning.server")

# Initialize FastAPI app
app = FastAPI(
    title="Guided Learning Platform",
    description="AI-powered learning and practice coaching server",
    version="2.0.0",
)

# CORS middleware for web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register active routers
app.include_router(auth.router, tags=["auth"])
app.include_router(candidate.router, tags=["candidate"])
app.include_router(ai.router, tags=["ai"])
app.include_router(learning.router, tags=["learning"])
app.include_router(practice.router, tags=["practice"])

# Archived routers (commented out):
# app.include_router(admin.router, tags=["admin"])
# app.include_router(interview.router, tags=["interview"])
# app.include_router(stt_router.router, tags=["stt"])


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
