from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, regions, departments, calls, search, users, call_types, call_resolutions, scripts
from app.core.config import settings

app = FastAPI(title="Support Operator Panel API", version="1.0.0")

# CORS middleware
print(f"CORS origins: {settings.cors_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(regions.router, prefix="/api/v1")
app.include_router(departments.router, prefix="/api/v1")
app.include_router(call_types.router, prefix="/api/v1")
app.include_router(call_resolutions.router, prefix="/api/v1")
app.include_router(calls.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(scripts.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"status": "ok", "service": "support-panel"}
