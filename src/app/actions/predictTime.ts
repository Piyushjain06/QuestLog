"use server";

export interface PredictTimeInput {
    is_rpg: number;
    is_multiplayer: number;
    review_score: number;
}

export interface PredictTimeResult {
    predicted_hours_to_beat: number;
    model_version: string;
}

/**
 * Calls the FastAPI Time-to-Beat ML microservice.
 *
 * Returns the prediction result on success, or `null` if the service is
 * unreachable / returns a non-2xx status — so callers never crash.
 */
export async function predictTime(
    input: PredictTimeInput
): Promise<PredictTimeResult | null> {
    const baseUrl =
        process.env.ML_API_URL ?? "http://localhost:8000";

    const endpoint = `${baseUrl}/predict`;

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Keep the connection warm for repeated predictions
                Connection: "keep-alive",
            },
            body: JSON.stringify(input),
            // Next.js: never cache ML predictions — always fresh
            cache: "no-store",
            // Abort if the Python service hangs
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            console.error(
                `[predictTime] ML service responded with ${response.status} ${response.statusText}`
            );
            return null;
        }

        const data = (await response.json()) as PredictTimeResult;
        return data;
    } catch (err) {
        // Network error, ECONNREFUSED, timeout, parse failure — all handled here
        console.error("[predictTime] Failed to reach ML service:", err);
        return null;
    }
}
