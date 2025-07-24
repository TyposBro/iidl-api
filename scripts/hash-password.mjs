// scripts/hash-password.mjs
import { pbkdf2 } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);

async function hashPassword(password) {
  if (!password) {
    console.error("Usage: node hash-password.mjs <password>");
    process.exit(1);
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hashBuffer = await pbkdf2Async(password, salt, 100000, 64, "sha512");

  // Combine salt and hash, and encode as a hex string for storage
  const saltHex = Buffer.from(salt).toString("hex");
  const hashHex = Buffer.from(hashBuffer).toString("hex");

  console.log(`${saltHex}:${hashHex}`);
}

const password = process.argv[2];
hashPassword(password);
