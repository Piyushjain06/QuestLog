"""
train_model.py
--------------
Generates a realistic mock dataset of video games, trains a
RandomForestRegressor to predict 'hours_to_beat', and exports the
trained model as 'time_predictor.joblib'.

Run:
    python train_model.py
"""

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

# ──────────────────────────────────────────────
# 1. Build a realistic mock dataset
# ──────────────────────────────────────────────

np.random.seed(42)

# Each row is one game; values are hand-crafted to produce a
# plausible real-world distribution.
data = [
    # is_rpg, is_multiplayer, review_score, hours_to_beat
    # ── Long, story-rich RPGs ──────────────────────────────
    (1, 0, 95.0, 120.0),   # Baldur's Gate 3 archetype
    (1, 0, 92.0, 100.0),   # The Witcher 3 archetype
    (1, 0, 88.0,  80.0),   # Dragon Age Origins archetype
    (1, 0, 85.0,  70.0),   # Mass Effect 3 archetype
    (1, 0, 79.0,  55.0),   # Decent mid-tier RPG
    (1, 0, 72.0,  45.0),   # Average RPG
    (1, 1, 91.0,  90.0),   # FF XIV (RPG + multiplayer)
    (1, 1, 83.0,  60.0),   # Borderlands 3 archetype
    # ── Multiplayer-focused non-RPG ───────────────────────
    (0, 1, 90.0,   5.0),   # Valorant / CS archetype (infinite loop)
    (0, 1, 87.0,   8.0),   # Overwatch archetype
    (0, 1, 82.0,  12.0),   # CoD Warzone archetype
    (0, 1, 75.0,  10.0),   # Mid-tier competitive shooter
    (0, 1, 68.0,   7.0),   # Low-rated multiplayer title
    # ── Single-player action / adventure ──────────────────
    (0, 0, 96.0,  35.0),   # God of War / Elden Ring archetype
    (0, 0, 93.0,  30.0),   # Red Dead Redemption 2 main story
    (0, 0, 89.0,  25.0),   # Spider-Man archetype
    (0, 0, 84.0,  18.0),   # Solid action-adventure game
    (0, 0, 78.0,  14.0),   # Average single-player
    (0, 0, 71.0,  10.0),   # Below-average single-player
    (0, 0, 60.0,   8.0),   # Low-rated short game
    # ── Indie / puzzle hybrid ─────────────────────────────
    (0, 0, 88.0,   6.0),   # Hollow Knight archetype
    (0, 1, 77.0,   4.0),   # Co-op puzzle game archetype
    (1, 0, 81.0,  40.0),   # Persona 5 archetype (RPG, no MP)
    (1, 1, 74.0,  30.0),   # MMO-lite
    (0, 0, 94.0,  22.0),   # Hades / roguelike archetype
]

df = pd.DataFrame(data, columns=["is_rpg", "is_multiplayer", "review_score", "hours_to_beat"])

# Add a tiny bit of Gaussian noise so the regressor has variance to learn
df["hours_to_beat"] = (
    df["hours_to_beat"]
    + np.random.normal(0, 2.0, size=len(df))
).clip(lower=1.0).round(1)

print(f"Dataset shape: {df.shape}")
print(df.to_string(index=False))
print()

# ──────────────────────────────────────────────
# 2. Split & train
# ──────────────────────────────────────────────

FEATURES = ["is_rpg", "is_multiplayer", "review_score"]
TARGET   = "hours_to_beat"

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestRegressor(
    n_estimators=200,
    max_depth=8,
    min_samples_leaf=2,
    random_state=42,
)
model.fit(X_train, y_train)

# ──────────────────────────────────────────────
# 3. Evaluate
# ──────────────────────────────────────────────

y_pred = model.predict(X_test)
mae    = mean_absolute_error(y_test, y_pred)
r2     = r2_score(y_test, y_pred)

print("── Model Evaluation ─────────────────────")
print(f"  Test MAE : {mae:.2f} hours")
print(f"  Test R²  : {r2:.3f}")
print()

# Feature importance
importances = pd.Series(model.feature_importances_, index=FEATURES).sort_values(ascending=False)
print("── Feature Importances ──────────────────")
print(importances.to_string())
print()

# ──────────────────────────────────────────────
# 4. Export
# ──────────────────────────────────────────────

MODEL_PATH = "time_predictor.joblib"
joblib.dump(model, MODEL_PATH)
print(f"✅  Model saved to '{MODEL_PATH}'")
