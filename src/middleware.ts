import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    // ── Header size audit ──────────────────────────────────────────────────
    // Run `npm run dev` and visit /profile. Check the terminal for sizes.
    // Goal: keep total headers under 8 192 bytes (8KB) in production.
    if (process.env.NODE_ENV === "development") {
        let totalHeaderBytes = 0;
        const headerLog: Record<string, number> = {};

        request.headers.forEach((value, key) => {
            const size = key.length + value.length + 4; // ": " + "\r\n"
            headerLog[key] = size;
            totalHeaderBytes += size;
        });

        // Sort descending so the biggest culprits appear first
        const sorted = Object.entries(headerLog).sort((a, b) => b[1] - a[1]);
        console.log(`\n🔍 [Header Audit] ${request.nextUrl.pathname}`);
        console.log(`   Total header bytes: ${totalHeaderBytes} / 8192`);
        sorted.forEach(([k, v]) =>
            console.log(`   ${v.toString().padStart(5)} bytes  →  ${k}`)
        );

        if (totalHeaderBytes > 6000) {
            console.warn(
                `⚠️  Headers are ${totalHeaderBytes} bytes — dangerously close to the 8KB limit!`
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    // Run on every non-static route
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
