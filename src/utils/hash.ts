export function hashPassword(password: string) {
  return sha256(`${password}-ih`);
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
) {
  return (await sha256(`${password}-ih`)) == hashedPassword;
}

async function sha256(message: string) {
  // Encode the message as a Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  // Use the subtle crypto API to compute the SHA-256 hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert the hash buffer to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}
