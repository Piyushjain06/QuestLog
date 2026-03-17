import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    
    const params = new URLSearchParams(url.search);
    params.set('openid.mode', 'check_authentication');
    
    // Verify authentication with Steam
    const response = await fetch('https://steamcommunity.com/openid/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });
    
    const text = await response.text();
    if (!text.includes('is_valid:true')) {
        return NextResponse.redirect(new URL('/auth?error=SteamAuthFailed', req.url));
    }
    
    const claimedId = url.searchParams.get('openid.claimed_id') || '';
    const match = claimedId.match(/\/id\/(\d+)$/);
    const steamId = match ? match[1] : null;
    
    if (!steamId) {
        return NextResponse.redirect(new URL('/auth?error=SteamIdNotFound', req.url));
    }

    try {
        const session = await getServerSession(authOptions);
        if (session?.user && 'id' in session.user) {
            const userId = (session.user as any).id as string;
            
            // Fetch player summary for name and avatar
            let steamUsername = null;
            let steamAvatarUrl = null;
            
            try {
                const summaryRes = await fetch(
                    `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
                );
                const summaryData = await summaryRes.json();
                const player = summaryData.response?.players?.[0];
                if (player) {
                    steamUsername = player.personaname;
                    steamAvatarUrl = player.avatarfull;
                }
            } catch (err) {
                console.error("Failed to fetch steam player summary:", err);
            }

            // Logged in user linking their account
            await prisma.user.update({
                where: { id: userId },
                data: { 
                    steamId,
                    steamUsername,
                    steamAvatarUrl,
                },
            });
            return NextResponse.redirect(new URL('/profile?steam=linked', req.url));
        }
    } catch (e) {
        console.error("Error reading session during Steam auth:", e);
    }

    // Unauthenticated user - generate short-lived JWT token mapped to steamId
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "default_secret_for_local_dev_12345");
    const token = await new SignJWT({ steamId })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('5m')
        .sign(secret);

    // Auto-submit form to NextAuth credentials provider
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Authenticating with Steam...</title>
        <style>
            body { background: #111827; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .loader { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    </head>
    <body>
        <div class="loader"></div>
        <form id="steamLogin" action="/api/auth/callback/steam" method="POST">
            <input type="hidden" name="token" value="${token}" />
            <input type="hidden" name="callbackUrl" value="/" />
        </form>
        <script>
            fetch('/api/auth/csrf')
                .then(r => r.json())
                .then(data => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = 'csrfToken';
                    input.value = data.csrfToken;
                    document.getElementById('steamLogin').appendChild(input);
                    document.getElementById('steamLogin').submit();
                })
                .catch(e => {
                    console.error('CSRF fetch failed', e);
                    window.location.href = '/auth?error=CSRFFailed';
                });
        </script>
    </body>
    </html>
    `;
    
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}
