import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    const start = Date.now();

    try {
        // Verify database connectivity
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json(
            {
                status: "ok",
                db: "connected",
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                latencyMs: Date.now() - start,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Health check failed:", error);

        return NextResponse.json(
            {
                status: "error",
                db: "disconnected",
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 503 }
        );
    }
}
