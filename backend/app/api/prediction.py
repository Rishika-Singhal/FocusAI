from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models import StudySession
from app.schemas.prediction import PredictionResult
from app.services import prediction_service
from app.utils.database import get_db

router = APIRouter(prefix="/prediction", tags=["Focus Decay Prediction"])


@router.post("/sessions/{session_id}", response_model=PredictionResult)
def predict_focus(session_id: str, db: Session = Depends(get_db)):
    session = db.get(StudySession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Study session not found")
    try:
        return prediction_service.predict(db, session)
    except prediction_service.ModelNotTrained:
        raise HTTPException(status_code=503, detail="Model not trained yet. Run: uv run python scripts/train_lstm.py")
    except prediction_service.NotEnoughData as exc:
        raise HTTPException(status_code=422, detail=str(exc))