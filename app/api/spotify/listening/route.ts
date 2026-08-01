import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import type { SpotifyListeningData } from "@/lib/spotify/spotifyApi";

async function getTopItems(accessToken: string, type: "artists" | "tracks") {
  const res = await fetch(
    `https://api.spotify.com/v1/me/top/${type}?limit=5&time_range=medium_term`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return (data.items ?? []).map((item: { name?: string }) => item.name ?? "Unknown");
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const [topArtists, recentTracks] = await Promise.all([
      getTopItems(session.accessToken, "artists"),
      getTopItems(session.accessToken, "tracks"),
    ]);

    const genres = Array.from(new Set(topArtists.slice(0, 3))) as string[];

    const listening: SpotifyListeningData = {
      topArtists,
      recentTracks,
      genres,
    };

    return NextResponse.json(listening);
  } catch (error) {
    console.error("Error fetching Spotify listening data:", error);
    return NextResponse.json({ error: "Failed to fetch Spotify listening data" }, { status: 500 });
  }
}
