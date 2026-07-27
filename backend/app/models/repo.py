from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, HttpUrl


class RepoCreate(BaseModel):
    repo_url: HttpUrl = Field(..., description="Public GitHub repository URL")


class RepoResponse(BaseModel):
    repo_id: str
    owner: str
    name: str
    default_branch: str
    created_at: datetime


class RepoMetadata(BaseModel):
    repo_id: str
    owner: str
    name: str
    default_branch: str
    last_analyzed_commit: Optional[str] = None
    last_analyzed_at: Optional[datetime] = None
