from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel, Field


class SubScores(BaseModel):
    architecture: Optional[float] = None
    documentation: Optional[float] = None
    security: Optional[float] = None
    performance: Optional[float] = None
    maintainability: Optional[float] = None
    testing: Optional[float] = None


class HealthScoreResponse(BaseModel):
    run_id: str
    overall_score: float = Field(..., ge=0.0, le=100.0)
    sub_scores: SubScores
    generated_at: datetime


class ReportResponse(BaseModel):
    run_id: str
    report_markdown: str
    generated_at: datetime
