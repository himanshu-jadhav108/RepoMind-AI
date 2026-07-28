from typing import Generator
from app.core.config import settings
from app.db.supabase_client import get_supabase_client
from app.providers.gemini_provider import GeminiProvider
from app.providers.groq_provider import GroqProvider
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
    Registers AI Provider Adapters with priority failover routing.
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

        # Primary Gemini Key (Google AI Studio Free Tier)
        self.provider_router.register_provider(
            GeminiProvider(api_key=settings.GEMINI_API_KEY, name_override="gemini_primary")
        )

        # Secondary Gemini Key (Failover from 2nd Account - Free Tier)
        if settings.GEMINI_API_KEY_2:
            self.provider_router.register_provider(
                GeminiProvider(api_key=settings.GEMINI_API_KEY_2, name_override="gemini_secondary")
            )

        # Groq Provider (100% Free Tier - LLaMA 3.3 70B)
        self.provider_router.register_provider(GroqProvider())

        # OpenAI Provider (if configured)
        self.provider_router.register_provider(OpenAIProvider())

        # OpenRouter Provider (Free Models)
        self.provider_router.register_provider(OpenRouterProvider())

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
