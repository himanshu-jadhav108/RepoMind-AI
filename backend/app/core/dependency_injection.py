from typing import Generator
from app.providers.provider_router import ProviderRouter
from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.repo_metadata_repository import RepoMetadataRepository
from app.services.analysis_service import AnalysisService
from app.services.repo_ingestion_service import RepoIngestionService
from app.services.report_service import ReportService


class Container:
    """
    Dependency Injection Container for managing application singletons and dependencies.
    """

    def __init__(self) -> None:
        # Repositories
        self.repo_metadata_repository = RepoMetadataRepository()
        self.analysis_repository = AnalysisRepository()

        # Providers
        self.provider_router = ProviderRouter()

        # Services
        self.repo_ingestion_service = RepoIngestionService(
            repo_repository=self.repo_metadata_repository
        )
        self.analysis_service = AnalysisService(
            analysis_repository=self.analysis_repository,
            repo_repository=self.repo_metadata_repository,
        )
        self.report_service = ReportService(
            analysis_repository=self.analysis_repository
        )


container = Container()


# Dependency Injection helper functions for FastAPI routes
def get_repo_ingestion_service() -> RepoIngestionService:
    return container.repo_ingestion_service


def get_analysis_service() -> AnalysisService:
    return container.analysis_service


def get_report_service() -> ReportService:
    return container.report_service


def get_provider_router() -> ProviderRouter:
    return container.provider_router
