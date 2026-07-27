from typing import Dict, Any


class Container:
    """
    Dependency Injection Container for managing application singletons,
    services, repositories, and provider instances.
    """

    def __init__(self) -> None:
        self._services: Dict[str, Any] = {}
        self._repositories: Dict[str, Any] = {}
        self._providers: Dict[str, Any] = {}

    def register_service(self, name: str, instance: Any) -> None:
        self._services[name] = instance

    def get_service(self, name: str) -> Any:
        return self._services.get(name)

    def register_repository(self, name: str, instance: Any) -> None:
        self._repositories[name] = instance

    def get_repository(self, name: str) -> Any:
        return self._repositories.get(name)

    def register_provider(self, name: str, instance: Any) -> None:
        self._providers[name] = instance

    def get_provider(self, name: str) -> Any:
        return self._providers.get(name)


container = Container()
