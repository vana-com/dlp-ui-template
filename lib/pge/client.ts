import { keccak256, fromHex } from "viem";
import { BrowserECIESProvider } from "@opendatalabs/vana-sdk/browser";
/**
 * PGE (Protocol-Governed Encryption) Helper
 * 
 * Provides utilities for PGE integration:
 * - Fetching PGE public key from service
 * - Deriving PGE Ethereum address from public key
 * 
 * Note: File encryption and permission setup are handled by Vana SDK's
 * vana.data.upload() method, which automatically encrypts the user's
 * encryption key with the PGE public key.
 */

const PGE_URL = process.env.NEXT_PUBLIC_PGE_URL || 
  "https://5d2f3c508220a6a0fdd07eb770eac06c319e758a-8000.dstack-pha-prod7.phala.network";

// Cache for PGE public key (can be refreshed)
let cachedPublicKey: string | null = null;
let cachedPublicKeyTimestamp: number = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface PgePublicKeyResponse {
  public_key: string;
  n: number;
  threshold: number;
}

/**
 * Fetch PGE public key from the service.
 * 
 * Caches the result for 1 hour to reduce API calls.
 * 
 * @returns PGE public key (hex string, uncompressed format)
 */
export async function fetchPgePublicKey(): Promise<string> {
  // Check cache first
  const now = Date.now();
  if (cachedPublicKey && (now - cachedPublicKeyTimestamp) < CACHE_TTL_MS) {
    return cachedPublicKey;
  }

  try {
    // Use proxy API route to avoid CORS issues until PGE is rebuilt
    // TODO: Switch to direct PGE call once CORS is deployed: fetch(`${PGE_URL}/v1/public-key`)
    const response = await fetch(`/api/pge/public-key`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PGE public key: ${response.status} ${response.statusText}`);
    }

    const data: PgePublicKeyResponse = await response.json();
    
    if (!data.public_key) {
      throw new Error("Invalid PGE public key response: missing public_key");
    }

    // Cache the result
    cachedPublicKey = data.public_key;
    cachedPublicKeyTimestamp = now;

    console.log(`✅ Fetched PGE public key (${data.threshold}-of-${data.n} threshold)`);
    
    return data.public_key;
  } catch (error) {
    console.error("❌ Error fetching PGE public key:", error);
    throw error;
  }
}

/**
 * Derive Ethereum address from a public key.
 * 
 * Algorithm:
 * 1. Ensure public key is in uncompressed format (65 bytes: 0x04 + x + y)
 * 2. Take the public key bytes (skip 0x04 prefix if present)
 * 3. Compute Keccak-256 hash
 * 4. Take last 20 bytes as Ethereum address
 * 
 * @param publicKeyHex Public key as hex string (with or without 0x prefix)
 * @returns Ethereum address (0x-prefixed)
 */
export function derivePgeAddress(publicKeyHex: string): string {
  try {
    const provider = getEciesProvider();
    
    // Convert hex string to Uint8Array
    const hexWithPrefix = publicKeyHex.startsWith("0x") ? publicKeyHex : `0x${publicKeyHex}`;
    let publicKeyBytes = fromHex(hexWithPrefix as `0x${string}`, "bytes");

    // Handle different public key formats
    if (publicKeyBytes.length === 64) {
      // Raw x,y coordinates (64 bytes) - add 0x04 prefix
      const prefixed = new Uint8Array(65);
      prefixed[0] = 0x04;
      prefixed.set(publicKeyBytes, 1);
      publicKeyBytes = prefixed;
    }
    
    // Normalize to uncompressed format using SDK (handles compressed keys)
    const normalizedPublicKey = provider.normalizeToUncompressed(publicKeyBytes);

    // Skip the 0x04 prefix (first byte) for hashing
    const keyWithoutPrefix = normalizedPublicKey.subarray(1);

    // Convert to hex for keccak256 (viem expects hex string)
    const keyHex = Array.from(keyWithoutPrefix, (b: number) => 
      b.toString(16).padStart(2, '0')
    ).join('');

    // Compute Keccak-256 hash
    const hash = keccak256(`0x${keyHex}`);

    // Take last 20 bytes (40 hex chars) as Ethereum address
    const address = `0x${hash.slice(-40)}`;

    console.log(`✅ Derived PGE address: ${address}`);
    
    return address;
  } catch (error) {
    console.error("❌ Error deriving PGE address:", error);
    throw new Error(`Failed to derive PGE address: ${error}`);
  }
}

// Initialize ECIES provider instance (singleton) for key normalization
let eciesProvider: BrowserECIESProvider | null = null;

function getEciesProvider(): BrowserECIESProvider {
  if (!eciesProvider) {
    eciesProvider = new BrowserECIESProvider();
  }
  return eciesProvider;
}

