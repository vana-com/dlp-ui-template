/**
 * PGE Public Key Proxy
 * 
 * Proxies requests to PGE /v1/public-key to avoid CORS issues.
 * Server-to-server calls don't have CORS restrictions.
 */

import { NextResponse } from "next/server";

const PGE_URL = process.env.NEXT_PUBLIC_PGE_URL;

export async function GET() {
  try {
    if (!PGE_URL) {
      return NextResponse.json(
        { error: "PGE_URL not configured" },
        { status: 500 }
      );
    }

    console.log(`🔑 Fetching PGE public key from: ${PGE_URL}/v1/public-key`);

    const response = await fetch(`${PGE_URL}/v1/public-key`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`❌ PGE request failed: ${response.status}`);
      return NextResponse.json(
        { error: `PGE request failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("✅ PGE public key fetched successfully");

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error fetching PGE public key:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch PGE public key",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

