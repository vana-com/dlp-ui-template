// Store the generated values so they remain consistent
let generatedIV: Uint8Array | null = null;
let generatedEphemeralKey: Uint8Array | null = null;

/**
 * Generate or retrieve the encryption parameters (IV and ephemeral key)
 * Ensures the same values are used across multiple calls
 * @returns An object containing the IV and ephemeral key
 */
export function getEncryptionParameters() {
  if (!generatedIV || !generatedEphemeralKey) {
    // 16-byte initialization vector (fixed value)
    generatedIV = new Uint8Array([
      0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
      0x0d, 0x0e, 0x0f, 0x10,
    ]);

    // 32-byte ephemeral key (fixed value)
    generatedEphemeralKey = new Uint8Array([
      0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc,
      0xdd, 0xee, 0xff, 0x00, 0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80,
      0x90, 0xa0, 0xb0, 0xc0, 0xd0, 0xe0, 0xf0, 0x00,
    ]);
  }

  return {
    iv: generatedIV,
    ephemeralKey: generatedEphemeralKey,
    ivHex: Buffer.from(generatedIV).toString("hex"),
    ephemeralKeyHex: Buffer.from(generatedEphemeralKey).toString("hex"),
  };
}
