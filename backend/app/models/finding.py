from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class FindingCategory(str, Enum):
    BUG = "bug"
    SECURITY = "security"
    PERFORMANCE = "performance"
    ARCHITECTURE = "architecture"


class FindingSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ReviewStatus(str, Enum):
    APPROVED = "approved"
    REWRITTEN_AND_APPROVED = "rewritten_and_approved"
    FLAGGED_LOW_CONFIDENCE = "flagged_low_confidence"
    UNREVIEWED = "unreviewed"


class Finding(BaseModel):
    id: str
    category: FindingCategory
    severity: FindingSeverity
    file: str
    line_start: int = 0
    line_end: int = 0
    description: str
    suggested_fix: Optional[str] = None

    # Explainability Fields (Mandatory per AGENTS.md & API.md)
    reasoning: str = Field(..., description="Short explanation of how the agent arrived at this conclusion")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Numeric confidence score from 0.0 to 1.0")
    evidence: str = Field(..., description="Specific code snippet or structural signal supporting this finding")
    referenced_files: List[str] = Field(default_factory=list, description="Exact file paths referenced")

    # Reviewer Loop Field
    review_status: ReviewStatus = Field(default=ReviewStatus.UNREVIEWED)


class PaginatedFindingsResponse(BaseModel):
    data: List[Finding]
    pagination: dict
