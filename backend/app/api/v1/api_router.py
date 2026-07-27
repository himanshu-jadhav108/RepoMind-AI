from fastapi import APIRouter
from app.api.v1.routes_repo import router as repo_router
from app.api.v1.routes_analysis import router as analysis_router
from app.api.v1.routes_reports import router as report_router
from app.api.v1.routes_system import router as system_router

api_v1_router = APIRouter()

api_v1_router.include_router(repo_router)
api_v1_router.include_router(analysis_router)
api_v1_router.include_router(report_router)
api_v1_router.include_router(system_router)
