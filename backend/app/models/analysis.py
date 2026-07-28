from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class RunStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentStatusEnum(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    DEGRADED = "degraded"


class AgentStatus(BaseModel):
    name: str
    status: AgentStatusEnum
    error: Optional[str] = None


class AnalysisRunCreate(BaseModel):
    repo_id: str
    commit_sha: Optional[str] = None
    force_refresh: bool = False


class AnalysisRunResponse(BaseModel):
    run_id: str
    status: RunStatus
    created_at: datetime


class AnalysisRunDetail(BaseModel):
    run_id: str
    repo_id: str
    status: RunStatus
    agents: List[AgentStatus] = Field(default_factory=list)
    started_at: datetime
    completed_at: Optional[datetime] = None
