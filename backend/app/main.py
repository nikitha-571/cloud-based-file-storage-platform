from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routes import auth, folders, files, shares, versions, activities, tags
from app.models import User, Folder, File, Share, PublicLink, PasswordReset, FileVersion, ActivityLog, Tag
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cloud Storage API",
    description="Secure cloud file storage and sharing platform",
    version="1.0.0"
)

ENV = os.getenv("ENVIRONMENT", "development")


if ENV == "production":

    allowed_origins = [
        "https://your-app-name.vercel.app",  # ← Will update this later
        "http://localhost:5173",  # Keep for local testing
    ]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ]

print(f"🌍 Environment: {ENV}")
print(f"🔗 Allowed Origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(folders.router)
app.include_router(files.router)
app.include_router(shares.router)
app.include_router(versions.router)
app.include_router(activities.router)
app.include_router(tags.router)

@app.get("/")
def read_root():
    return {
        "message": "Cloud Storage API is running!",
        "environment": ENV,
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "environment": ENV
    }