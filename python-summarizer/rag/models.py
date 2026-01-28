# python-summarizer/rag/models.py
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class IndexProjectRequest(BaseModel):
    projectId: str = Field(..., min_length=10)
    chunkSize: int = 1000
    overlap: int = 150

class IndexProjectResponse(BaseModel):
    projectId: str
    documentsTotal: int
    meetingsTotal: int
    sourcesIndexed: int
    sourcesSkipped: int
    chunksInserted: int
class QueryProjectRequest(BaseModel):
    projectId: str = Field(..., min_length=10)
    query: str = Field(..., min_length=2)
    topK: int = Field(6, ge=1, le=50)
    sourceType: Optional[str] = None  # 'DOCUMENT' or 'MEETING' (optional filter)
    sourceId: Optional[str] = None    # filter to one doc/meeting if needed

class RetrievedChunk(BaseModel):
    sourceType: str
    sourceId: str
    chunkIndex: int
    contentText: str
    distance: float

class QueryProjectResponse(BaseModel):
    projectId: str
    query: str
    topK: int
    results: List[RetrievedChunk]


class AnswerProjectRequest(BaseModel):
    projectId: str = Field(..., min_length=10)
    query: str = Field(..., min_length=2)
    topK: int = Field(6, ge=1, le=20)
    minChars: int = Field(50, ge=0, le=500)  # filter tiny chunks
    sourceType: Optional[str] = None
    sourceId: Optional[str] = None

class Citation(BaseModel):
    sourceType: str
    sourceId: str
    chunkIndex: int
    distance: float

class AnswerProjectResponse(BaseModel):
    projectId: str
    query: str
    answer: str
    citations: List[Citation]