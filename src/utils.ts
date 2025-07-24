// src/utils.ts

// Helper to convert a hex string to a Uint8Array.
function hexToUint8Array(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

// Helper to convert an ArrayBuffer to a hex string.
function arrayBufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verifies a plaintext password against a stored salted hash.
 * @param password The plaintext password to verify.
 * @param storedHash The 'salt:hash' string from the database.
 * @returns A promise that resolves to true if the password is correct, false otherwise.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = storedHash.split(":");
    if (!saltHex || !hashHex) return false;

    const salt = hexToUint8Array(saltHex);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-512",
      },
      keyMaterial,
      512 // 64 bytes * 8 bits
    );

    const derivedHashHex = arrayBufferToHex(hashBuffer);
    return derivedHashHex === hashHex;
  } catch (e) {
    console.error("Error during password verification:", e);
    return false;
  }
}

/**
 * Extracts the object key from a full public R2 URL.
 * @param url The full public URL of the R2 object.
 * @param r2PublicUrl The base public URL of the R2 bucket.
 * @returns The object key or null if the URL is invalid.
 */
export function getKeyFromR2Url(url: string | null, r2PublicUrl: string): string | null {
  if (!url || !url.startsWith(r2PublicUrl)) {
    return null;
  }
  return url.substring(r2PublicUrl.length);
}

/**
 * Parses fields that are stored as JSON strings in D1.
 * @param item The object retrieved from D1.
 * @param fields An array of keys to parse.
 * @returns A new object with the specified fields parsed.
 */
export function parseJsonFields<T extends Record<string, any>>(item: T, fields: (keyof T)[]): T {
  const newItem = { ...item };
  for (const field of fields) {
    const value = newItem[field];
    if (typeof value === "string") {
      try {
        // This is a safe way to handle the assignment for a generic type
        (newItem as any)[field] = JSON.parse(value);
      } catch {
        // If parsing fails, set to a safe default (null or an empty array).
        // Let's use null as a generic default.
        (newItem as any)[field] = null;
      }
    }
  }
  return newItem;
}
