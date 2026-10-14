import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import models  # noqa: F401  (registers the tables on Base)
from app.config import settings
from app.database import Base, engine
from app.routers import leads

logger = logging.getLogger("leadflow")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    yield


app = FastAPI(
    title="LeadFlow API",
    description="Leads, their discussion timeline and follow-up reminders.",
    lifespan=lifespan,
)


@app.middleware("http")
async def catch_unexpected_errors(request: Request, call_next):
    """Any error we did not plan for: log it, tell the client nothing internal."""
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500, content={"detail": "Internal server error"}
        )


# Added after the error catcher, so it wraps it: even 500 responses get CORS
# headers and the browser can read the error message.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", summary="Health check", tags=["health"])
def health():
    """Returns `{"status": "ok"}` when the API is up."""
    return {"status": "ok"}


app.include_router(leads.router)
