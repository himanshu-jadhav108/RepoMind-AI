from typing import Any, Dict, Optional


class RepoMindException(Exception):
    """
    Base exception class for all RepoMind AI backend domain errors.
    """

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class InvalidRepoUrlException(RepoMindException):
    def __init__(self, message: str = "Invalid or malformed GitHub repository URL.", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message=message, code="INVALID_REPO_URL", status_code=400, details=details)


class RepositoryNotFoundException(RepoMindException):
    def __init__(self, message: str = "Repository does not exist or is private/inaccessible.", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message=message, code="REPO_NOT_FOUND", status_code=404, details=details)


class RepositoryAlreadyExistsException(RepoMindException):
    def __init__(self, message: str = "Repository is already registered.", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message=message, code="REPO_ALREADY_EXISTS", status_code=409, details=details)


class UnprocessableRepoException(RepoMindException):
    def __init__(self, message: str = "Repository URL is valid but unparseable (e.g. empty repository).", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message=message, code="UNPROCESSABLE_REPO", status_code=422, details=details)


class AnalysisRunNotFoundException(RepoMindException):
    def __init__(self, message: str = "Analysis run not found.", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message=message, code="ANALYSIS_RUN_NOT_FOUND", status_code=404, details=details)


class AnalysisConflictException(RepoMindException):
    def __init__(self, message: str = "An identical analysis run is already in progress or completed.", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message=message, code="ANALYSIS_CONFLICT", status_code=409, details=details)


class ProviderException(RepoMindException):
    def __init__(self, message: str = "AI Provider error occurred.", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message=message, code="PROVIDER_ERROR", status_code=503, details=details)


class ProviderTimeoutException(ProviderException):
    def __init__(self, message: str = "AI Provider call timed out.", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message=message, details=details)
        self.code = "PROVIDER_TIMEOUT"


class ParsingException(RepoMindException):
    def __init__(self, message: str = "Failed to parse repository AST.", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message=message, code="PARSING_ERROR", status_code=422, details=details)
