import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

// Magic byte signatures for allowed image types.
// SVG is intentionally excluded — it can contain inline <script> tags (XSS).
const MAGIC_SIGNATURES: { mime: string; bytes: number[]; offset?: number }[] = [
    { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
    { mime: "image/png",  bytes: [0x89, 0x50, 0x4e, 0x47] },
    { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // "RIFF" header; webp also has "WEBP" at offset 8
    { mime: "image/gif",  bytes: [0x47, 0x49, 0x46, 0x38] }, // "GIF8"
];

function detectMimeFromBuffer(buf: Uint8Array): string | null {
    for (const sig of MAGIC_SIGNATURES) {
        const off = sig.offset ?? 0;
        const matches = sig.bytes.every((b, i) => buf[off + i] === b);
        if (matches) {
            // Extra check for WebP: bytes 8–11 must be "WEBP"
            if (sig.mime === "image/webp") {
                const webp = [0x57, 0x45, 0x42, 0x50];
                if (!webp.every((b, i) => buf[8 + i] === b)) continue;
            }
            return sig.mime;
        }
    }
    return null;
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("avatar") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 2 MB." },
                { status: 400 }
            );
        }

        // Read the buffer and validate via magic bytes — NOT the client-supplied Content-Type
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const detectedMime = detectMimeFromBuffer(bytes);

        if (!detectedMime) {
            return NextResponse.json(
                { error: "Invalid file type. Upload a JPEG, PNG, WebP, or GIF image." },
                { status: 400 }
            );
        }

        // Store as base64 data URL using the server-verified MIME type
        const base64 = Buffer.from(buffer).toString("base64");
        const dataUrl = `data:${detectedMime};base64,${base64}`;

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: { image: dataUrl },
        });

        return NextResponse.json({ image: user.image });
    } catch {
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
