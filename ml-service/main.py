"""
main.py
-------
FastAPI microservice that loads the pre-trained RandomForestRegressor
model and exposes a /predict endpoint for time-to-beat estimation.

Run (after training):
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from contextlib import asynccontextmanager
from typing import Any

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

# ──────────────────────────────────────────────
# 1. Model state – loaded once on startup
# ──────────────────────────────────────────────

MODEL_PATH = "time_predictor.joblib"
model: Any = None  # will hold the RandomForestRegressor instance


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the ML model when the server starts; release on shutdown."""
    global model
    try:
        model = joblib.load(MODEL_PATH)
        print(f"[OK] Model loaded from '{MODEL_PATH}'")
    except FileNotFoundError:
        raise RuntimeError(
            f"Model file '{MODEL_PATH}' not found. "
            "Run `python train_model.py` first."
        )
    yield
    # Nothing to clean up, but the hook is here for completeness.
    print("[--] Shutting down -- model released.")


# ──────────────────────────────────────────────
# 2. FastAPI app
# ──────────────────────────────────────────────

app = FastAPI(
    title="QuestLog – Time-to-Beat Predictor",
    description=(
        "ML microservice that estimates how many hours it takes "
        "to beat a video game based on its genre, multiplayer status, "
        "and review score."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ──────────────────────────────────────────────
# 3. CORS configuration
# ──────────────────────────────────────────────

ALLOWED_ORIGINS = [
    "http://localhost:3000",          # Local Next.js dev server
    "https://your-production-url.com",  # Replace with your production domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# 4. Pydantic schemas
# ──────────────────────────────────────────────

class PredictRequest(BaseModel):
    """Input features for the time-to-beat prediction."""

    is_rpg: int = Field(
        ...,
        ge=0,
        le=1,
        description="1 if the game is an RPG, 0 otherwise.",
        examples=[1],
    )
    is_multiplayer: int = Field(
        ...,
        ge=0,
        le=1,
        description="1 if the game has a multiplayer mode, 0 otherwise.",
        examples=[0],
    )
    review_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Aggregate review score on a 0–100 scale.",
        examples=[88.5],
    )

    # Extra guard: ensure binary fields are strictly 0 or 1
    @field_validator("is_rpg", "is_multiplayer", mode="before")
    @classmethod
    def must_be_binary(cls, v: Any) -> int:
        if v not in (0, 1):
            raise ValueError("Field must be 0 or 1.")
        return int(v)


class PredictResponse(BaseModel):
    """Prediction result returned by the /predict endpoint."""

    predicted_hours_to_beat: float = Field(
        ...,
        description="Estimated number of hours to beat the game (1 decimal place).",
        examples=[42.5],
    )
    model_version: str = "1.0.0"


# ──────────────────────────────────────────────
# 5. Endpoints
# ──────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root() -> dict:
    """Health-check / root endpoint."""
    return {
        "service": "QuestLog Time-to-Beat Predictor",
        "status": "ok",
        "model_loaded": model is not None,
    }


@app.get("/health", tags=["Health"])
def health_check() -> dict:
    """Lightweight liveness probe."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    return {"status": "healthy"}


@app.post("/predict", response_model=PredictResponse, tags=["Prediction"])
def predict(payload: PredictRequest) -> PredictResponse:
    """
    Predict how many hours it will take to beat a game.

    - **is_rpg**: 0 or 1
    - **is_multiplayer**: 0 or 1
    - **review_score**: float between 0 and 100
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not available.")

    features = np.array(
        [[payload.is_rpg, payload.is_multiplayer, payload.review_score]]
    )

    try:
        raw_prediction: float = float(model.predict(features)[0])
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {exc}",
        ) from exc

    # Clamp to a sensible minimum (no game takes 0 hours)
    hours = max(round(raw_prediction, 1), 0.5)

    return PredictResponse(predicted_hours_to_beat=hours)
