from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, regions, departments
from app.core.config import settings

app = FastAPI(title="Support Operator Panel API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(regions.router, prefix="/api/v1")
app.include_router(departments.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"status": "ok", "service": "support-panel"}
