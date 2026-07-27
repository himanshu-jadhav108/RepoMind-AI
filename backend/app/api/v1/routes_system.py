from fastapi import APIRouter, Depends, status
from app.core.dependency_injection import get_provider_router
from app.providers.provider_router import ProviderRouter

router = APIRouter(tags=["System"])


@router.get("/providers/status", status_code=status.HTTP_200_OK)
async def get_providers_status(
    provider_router: ProviderRouter = Depends(get_provider_router),
):
    """
    Report current AI provider availability and active/failover state per API.md.
    """
    return {"providers": provider_router.get_status()}
