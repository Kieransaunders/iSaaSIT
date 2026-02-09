/**
 * Lemon Squeezy Webhook Signature Verification
 *
 * Uses Web Crypto API (compatible with Convex runtime) to verify HMAC-SHA256 signatures.
 * NOTE: Cannot use Node.js crypto module in Convex HTTP actions.
 */

/**
 * Verify Lemon Squeezy webhook signature using HMAC-SHA256
 *
 * @param signature - Signature from X-Signature header
 * @param body - Raw request body (must be exact string from request.text())
 * @param secret - Webhook signing secret from LEMONSQUEEZY_WEBHOOK_SECRET env var
 * @returns Promise<boolean> - True if signature is valid
 */
export async function verifySignature(
  signature: string,
  body: string,
  secret: string
): Promise<boolean> {
  try {
    // Encode the secret and body as Uint8Array for Web Crypto API
    const encoder = new TextEncoder();
    const secretData = encoder.encode(secret);
    const bodyData = encoder.encode(body);

    // Import the secret key for HMAC-SHA256
    const key = await crypto.subtle.importKey(
      "raw",
      secretData,
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

    // Sign the body with HMAC-SHA256
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, bodyData);

    // Convert ArrayBuffer to hex string
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const computedSignature = signatureArray
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    // Compare computed signature with provided signature
    return computedSignature === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}
