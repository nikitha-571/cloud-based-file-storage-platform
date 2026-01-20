from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routes import auth, folders, files, shares, versions, activities, tags

from app.models import User, Folder, File, Share, PublicLink, PasswordReset, FileVersion, ActivityLog, Tag

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Cloud Storage API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=False,
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
    return {"message": "Cloud Storage API is running!"}