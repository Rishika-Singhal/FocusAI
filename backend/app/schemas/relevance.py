from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, model_validator


class PageMetadata(BaseModel):
    """Extra, already-cleaned page facts the extension can see (used for YouTube videos)."""
    video_id: Optional[str] = None
    description: Optional[str] = Field(default=None, max_length=5000)
    channel: Optional[str] = Field(default=None, max_length=200)
    keywords: List[str] = Field(default_factory=list, max_length=30)  # e.g. hashtags shown on the page


class AnalyzeRequest(BaseModel):
    """Content to evaluate against a study context.

    Provide ``session_id`` (uses that session's context) or ``topic`` for a stateless preview.
    Provide ``text`` (what the extension extracted), ``html``, or just a ``url`` to fetch.
    """
    session_id: Optional[str] = None
    topic: Optional[str] = None
    learning_objectives: Optional[str] = None
    url: Optional[str] = None
    title: Optional[str] = None
    text: Optional[str] = None
    html: Optional[str] = None
    metadata: Optional[PageMetadata] = None
    persist: bool = True  # store the analysis / blocked content / activity events (needs session_id)

    @model_validator(mode="after")
    def _check(self):
        if not self.session_id and not self.topic:
            raise ValueError("Provide either session_id or topic.")
        if not (self.url or self.text or self.html):
            raise ValueError("Provide at least one of url, text or html.")
        return self


class SentenceScore(BaseModel):
    text: str
    score: float = Field(description="0-100 relevance of this sentence to the study context")
    level: Literal["high", "medium", "low"]


class AnalyzeResponse(BaseModel):
    analysis_id: Optional[str] = None
    url: Optional[str] = None
    title: str = ""
    source_type: str = "webpage"
    relevance_score: float
    classification: Literal["RELEVANT", "PARTIALLY_RELEVANT", "DISTRACTING"]
    decision: Literal["ALLOW", "WARN", "BLOCK"]
    explanation: str
    reasons: List[str] = []
    matching_concepts: List[str] = []
    highlighted_sentences: List[SentenceScore] = []
    heatmap: List[SentenceScore] = []
    signals: Dict[str, Optional[float]] = {}
    explanation_method: str
    embedding_backend: str
    llm_used: bool = False
    low_content: bool = False
    insufficient_content: bool = False
    word_count: int = 0
    # How the score was produced and what evidence was available (useful for debugging/explanations)
    evaluation_path: str = "embedding"  # embedding | embedding+llm | llm+embedding | insufficient
    llm_status: str = "not_configured"  # not_configured | not_needed | ok | failed:<kind>
    content_quality: str = "sufficient"  # sufficient | low | insufficient
    content_sources: Dict[str, Any] = {}


class OverrideRequest(BaseModel):
    session_id: str
    url: str
    title: Optional[str] = None


class HistoryItem(BaseModel):
    id: str
    url: str
    title: Optional[str] = None
    relevance_score: float
    classification: Optional[str] = None
    decision: str
    analyzed_at: datetime


class EngineInfo(BaseModel):
    embedding_backend: str
    dense_embeddings: bool
    llm_enabled: bool
    llm_provider: Optional[str] = None  # never includes the key
    llm_model: Optional[str] = None
    allow_threshold: float
    warn_threshold: float
    explanation_method: str
