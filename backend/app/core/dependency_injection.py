from typing import Generator
from app.db.supabase_client import get_supabase_client
from app.providers.gemini_provider import GeminiProvider
from app.providers.groq_provider import GroqProvider
from app.providers.huggingface_provider import HuggingFaceProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.openrouter_provider import OpenRouterProvider
from app.providers.provider_router import ProviderRouter
from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.repo_metadata_repository import RepoMetadataRepository
from app.repositories.supabase_analysis_repository import SupabaseAnalysisRepository
from app.repositories.supabase_repo_metadata_repository import SupabaseRepoMetadataRepository
from app.services.analysis_service import AnalysisService
from app.services.repo_ingestion_service import RepoIngestionService
from app.services.report_service import ReportService


class Container:
    """
    Dependency Injection Container for managing application singletons and dependencies.
    Registers all 5 AI Provider Adapters into ProviderRouter.
    """

    def __init__(self) -> None:
        self.supabase_client = get_supabase_client()

        # Repositories
        if self.supabase_client:
            self.repo_metadata_repository = SupabaseRepoMetadataRepository(self.supabase_client)
            self.analysis_repository = SupabaseAnalysisRepository(self.supabase_client)
        else:
            self.repo_metadata_repository = RepoMetadataRepository()
            self.analysis_repository = AnalysisRepository()

        # Provider Router & Concrete Provider Adapters Initialization
        self.provider_router = ProviderRouter()
        self.provider_router.register_provider(GeminiProvider())
        self.provider_router.register_provider(GroqProvider())
        self.provider_router.register_provider(OpenAIProvider())
        self.provider_router.register_provider(OpenRouterProvider())
        self.provider_router.register_provider(HuggingFaceProvider())

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
