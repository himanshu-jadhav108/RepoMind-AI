from abc import ABC, abstractmethod
from typing import Any, List, Optional, Generic, TypeVar

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """
    Abstract base repository defining CRUD contract for data persistence per Clean Architecture.
    """

    @abstractmethod
    async def get_by_id(self, item_id: str) -> Optional[T]:
        pass

    @abstractmethod
    async def create(self, item: T) -> T:
        pass

    @abstractmethod
    async def update(self, item_id: str, data: dict) -> Optional[T]:
        pass

    @abstractmethod
    async def delete(self, item_id: str) -> bool:
        pass
