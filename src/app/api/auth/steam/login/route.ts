import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const host = url.host;
    const protocol = url.protocol;
    
    // Determine the realm dynamically based on the current request
    const realm = `${protocol}//${host}`;
    const returnTo = `${realm}/api/auth/steam/callback`;

    const params = new URLSearchParams({
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': returnTo,
        'openid.realm': realm,
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });

    return NextResponse.redirect(`https://steamcommunity.com/openid/login?${params.toString()}`);
}
