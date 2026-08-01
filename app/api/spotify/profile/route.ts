import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import type { SpotifyUserInfo } from "@/lib/spotify/spotifyApi";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Spotify fetch failed" }, { status: res.status });
    }

    const data = await res.json();
    const user: SpotifyUserInfo = {
      id: data.id,
      email: data.email ?? `${data.id}@spotify.local`,
      name: data.display_name ?? data.id,
      locale: data.country ?? "en",
      country: data.country ?? "US",
      product: data.product ?? "free",
    };

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching Spotify profile:", error);
    return NextResponse.json({ error: "Failed to fetch Spotify profile" }, { status: 500 });
  }
}
