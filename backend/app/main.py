"""
FastAPI Main Application Entry Point
This is the "heart" of your backend - it starts the server and connects all the pieces.

Think of it as:
- The main file that runs when you start the server
- Where all your API routes are registered
- Where middleware (like CORS) is configured
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Import our configuration
from app.config import settings

# Import database connection (we'll use this later)
from app.database.connection import get_supabase_client

# Import API routers
from app.api.v1 import crm, pms
# from app.api.v1 import auth, common  # We'll add these later

# Load environment variables
load_dotenv()

# ============================================
# LIFESPAN: Startup and Shutdown Events
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    This function runs when the server starts and stops.
    
    Startup: Things to do when server starts
    - Initialize connections
    - Load data
    - Start background tasks
    
    Shutdown: Things to do when server stops
    - Close connections
    - Clean up resources
    """
    # STARTUP - Runs when server starts
    print("🚀 Starting LeanChem Connect API...")
    print(f"📋 App: {settings.APP_NAME}")
    print(f"🔢 Version: {settings.APP_VERSION}")
    
    # Test database connection
    try:
        supabase = get_supabase_client()
        print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
    
    # You can add more startup tasks here:
    # - Initialize notification service
    # - Load cache
    # - Start background workers
    
    yield  # Server runs here
    
    # SHUTDOWN - Runs when server stops
    print("🛑 Shutting down LeanChem Connect API...")
    # Clean up tasks here:
    # - Close database connections
    # - Stop background workers

# ============================================
# CREATE FASTAPI APP
# ============================================
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered CRM and Product Management System",
    version=settings.APP_VERSION,
    docs_url="/api/docs",      # Swagger UI at http://localhost:8000/api/docs
    redoc_url="/api/redoc",    # ReDoc at http://localhost:8000/api/redoc
    lifespan=lifespan          # Use our startup/shutdown function
)

# ============================================
# CORS MIDDLEWARE
# ============================================
# This allows your React frontend to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # From config.py
    allow_credentials=True,                # Allow cookies/auth
    allow_methods=["*"],                   # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],                   # Allow all headers
)

# ============================================
# HEALTH CHECK ENDPOINT
# ============================================
@app.get("/health")
async def health_check():
    """
    Simple health check endpoint.
    Useful for monitoring and checking if server is running.
    
    Try it: http://localhost:8000/health
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION
    }

# ============================================
# ROOT ENDPOINT
# ============================================
@app.get("/")
async def root():
    """
    Root endpoint - welcome message.
    
    Try it: http://localhost:8000/
    """
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
        "health": "/health"
    }

# ============================================
# REGISTER API ROUTERS
# ============================================
# Register CRM routes
app.include_router(crm.router, prefix="/api/v1/crm", tags=["CRM"])

# Register PMS routes
app.include_router(pms.router, prefix="/api/v1/pms", tags=["PMS"])

# We'll add these later:
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
# app.include_router(common.router, prefix="/api/v1", tags=["Common"])

# ============================================
# RUN SERVER (for development)
# ============================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",  # Path to the app
        host="0.0.0.0",  # Listen on all network interfaces
        port=8000,       # Port number
        reload=True       # Auto-reload on code changes (development only)
    )

