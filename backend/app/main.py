import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import models  # noqa: F401  (registers the tables on Base)
from app.config import settings
from app.database import Base, engine

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unexpected_error(request: Request, exc: Exception):
    """Any error we did not plan for: log it, tell the client nothing internal."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/api/health", summary="Health check", tags=["health"])
def health():
    """Returns `{"status": "ok"}` when the API is up."""
    return {"status": "ok"}
