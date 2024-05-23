export async function fetchPubkeyfromEmail(email: string): Promise<string> {
  const response = await fetch(
    `https://accounts.action-tokens.com/api/pub?email=${email}`,
  );
  if (response.ok) {
    console.log(response);
    const data = await response.json();
    return data.publicKey;
  } else {
    throw new Error("Email don't have a pubkey");
  }
}
