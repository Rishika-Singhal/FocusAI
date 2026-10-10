from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.schemas.study_session import (
    StudyContextCreate,
    StudyContextRead,
    StudySessionCreate,
    StudySessionRead,
    StudySessionUpdate,
)
from app.services import context_service
from app.services.content_extractor import MAX_UPLOAD_BYTES, extract_document
from app.utils.database import get_db

router = APIRouter(prefix="/sessions", tags=["Study Sessions & Context"])


@router.post("", response_model=StudySessionRead, status_code=status.HTTP_201_CREATED)
def create_session(session_in: StudySessionCreate, db: Session = Depends(get_db)):
    """Create a new study session with topic and learning objectives."""
    return context_service.create_study_session(db, session_in)


@router.get("", response_model=List[StudySessionRead])
def list_sessions(student_id: Optional[str] = None, db: Session = Depends(get_db)):
    """List recent study sessions (optionally for one student)."""
    return context_service.list_study_sessions(db, student_id)


@router.get("/{session_id}", response_model=StudySessionRead)
def get_session(session_id: str, db: Session = Depends(get_db)):
    db_session = context_service.get_study_session(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Study session not found")
    return db_session


@router.patch("/{session_id}", response_model=StudySessionRead)
def update_session(session_id: str, update_in: StudySessionUpdate, db: Session = Depends(get_db)):
    updated = context_service.update_study_session(db, session_id, update_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Study session not found")
    return updated


@router.post("/{session_id}/context", response_model=StudyContextRead)
def set_study_context(session_id: str, context_in: StudyContextCreate, db: Session = Depends(get_db)):
    """Create or update the active study context for a session."""
    if not context_service.get_study_session(db, session_id):
        raise HTTPException(status_code=404, detail="Study session not found")
    context_in.session_id = session_id
    return context_service.create_or_update_study_context(db, context_in)


@router.get("/{session_id}/context", response_model=StudyContextRead)
def get_study_context(session_id: str, db: Session = Depends(get_db)):
    db_context = context_service.get_study_context_by_session(db, session_id)
    if not db_context:
        raise HTTPException(status_code=404, detail="Study context not found for this session")
    return db_context


@router.post("/{session_id}/context/material", response_model=StudyContextRead)
async def upload_course_material(session_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Attach a course document (PDF, DOCX, TXT, MD); its key terms enrich the study context."""
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    try:
        extracted = extract_document(file.filename or "", data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=422, detail="The file could not be read.")
    if not extracted["cleaned_text"]:
        raise HTTPException(status_code=422, detail=extracted.get("error", "No text found in the file."))
    ctx = context_service.add_course_material(db, session_id, extracted["cleaned_text"])
    if not ctx:
        raise HTTPException(status_code=404, detail="Study context not found for this session")
    return ctx
