import time

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api_router import api_v1_router
from app.core.config import settings
from app.core.exceptions import RepoMindException
from app.core.logging import logger

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.netlify\.app|https://.*\.pages\.dev|https://.*\.onrender\.com|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time_ms = round((time.time() - start_time) * 1000, 2)
    response.headers["X-Process-Time-Ms"] = str(process_time_ms)
    return response


@app.exception_handler(RepoMindException)
async def repomind_exception_handler(request: Request, exc: RepoMindException):
    logger.warning(f"Domain Exception [{exc.code}]: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": str(exc.detail),
                "details": {},
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request parameters or body.",
                "details": {"errors": exc.errors()},
            }
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred.",
                "details": {"raw_error": str(exc)}
                if settings.ENVIRONMENT == "development"
                else {},
            }
        },
    )


# Include API v1 Router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
async def root():
    """
    Root API welcome endpoint
    """
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "ok",
        "docs_url": "/docs",
        "health_url": "/health",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.on_event("startup")
async def seed_demo_workspace():
    """
    Seed a complete demo workspace run on backend startup so demo mode requests always succeed.
    """
    try:
        from app.core.dependency_injection import get_analysis_service
        analysis_service = get_analysis_service()
        demo_run_id = "demo-hackathon-workspace"

        existing = await analysis_service.analysis_repository.get_by_id(demo_run_id)
        if not existing:
            from app.models.analysis import AnalysisRunDetail, RunStatus, AgentStatus, AgentStatusEnum
            demo_run = AnalysisRunDetail(
                run_id=demo_run_id,
                repo_id="repo-repomind-ai",
                repo_name="RepoMind-AI",
                repo_owner="himanshu-jadhav108",
                repo_url="https://github.com/himanshu-jadhav108/RepoMind-AI",
                commit_sha="a7b8c9d0",
                status=RunStatus.COMPLETED,
                agents=[
                    AgentStatus(name="planner_agent", status=AgentStatusEnum.COMPLETED),
                    AgentStatus(name="repository_analyzer", status=AgentStatusEnum.COMPLETED),
                    AgentStatus(name="architect_agent", status=AgentStatusEnum.COMPLETED),
                    AgentStatus(name="bug_hunter_agent", status=AgentStatusEnum.COMPLETED),
                    AgentStatus(name="security_agent", status=AgentStatusEnum.COMPLETED),
                    AgentStatus(name="performance_agent", status=AgentStatusEnum.COMPLETED),
                    AgentStatus(name="documentation_agent", status=AgentStatusEnum.COMPLETED),
                    AgentStatus(name="reviewer_agent", status=AgentStatusEnum.COMPLETED),
                    AgentStatus(name="report_generator", status=AgentStatusEnum.COMPLETED),
                ],
                started_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                completed_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            )
            await analysis_service.analysis_repository.create(demo_run)
            logger.info("Successfully seeded demo workspace 'demo-hackathon-workspace' on startup.")
    except Exception as e:
        logger.warning(f"Could not seed demo workspace: {e}")


@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for uptime monitoring per API.md
    """
    return {
        "status": "ok",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }



if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
