// scripts/hash-password.mjs
import { pbkdf2, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);

async function hashPassword(password) {
  if (!password) {
    console.error("Usage: node scripts/hash-password.mjs <password>");
    process.exit(1);
  }
  // Use Node's crypto to generate the salt
  const salt = randomBytes(16);
  const hashBuffer = await pbkdf2Async(password, salt, 100000, 64, "sha512");

  // Combine salt and hash, and encode as a hex string for storage
  const saltHex = salt.toString("hex");
  const hashHex = Buffer.from(hashBuffer).toString("hex");

  console.log(`${saltHex}:${hashHex}`);
}

const password = process.argv[2];
hashPassword(password);
