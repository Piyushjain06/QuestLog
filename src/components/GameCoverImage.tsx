"use client";

import { useState } from "react";

interface GameCoverImageProps {
    src: string | null | undefined;
    alt: string;
    className?: string;
    steamAppId?: string | null;
}

/**
 * Renders a game cover image with a fallback chain:
 * 1. Tries the stored `src` (usually library_600x900.jpg or an IGDB URL)
 * 2. If that 404s, tries Steam's header.jpg (available for all Steam games)
 * 3. If that also fails, shows the first character of the game title
 */
export function GameCoverImage({ src, alt, className = "w-full h-full object-cover", steamAppId }: GameCoverImageProps) {
    const [imgSrc, setImgSrc] = useState<string | null>(src ?? null);
    const [triedFallback, setTriedFallback] = useState(false);

    const handleError = () => {
        if (!triedFallback && steamAppId) {
            // Fall back to Steam header image which exists for every game
            setImgSrc(`https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId}/header.jpg`);
            setTriedFallback(true);
        } else {
            setImgSrc(null);
        }
    };

    if (!imgSrc) {
        return (
            <div className={`flex items-center justify-center text-lg font-bold text-muted-foreground/30 ${className}`}>
                {alt.charAt(0).toUpperCase()}
            </div>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            onError={handleError}
        />
    );
}
