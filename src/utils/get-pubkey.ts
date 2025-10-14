export async function fetchPubkeyfromEmail(email: string): Promise<string> {
  const response = await fetch(
    `https://accounts.action-tokens.com/api/pub?email=${email}`,
  );
  if (response.ok) {
    const data = (await response.json()) as { publicKey: string };
    return data.publicKey;
  } else {
    throw new Error("Email don't have a pubkey");
  }
}

export async function fetchUsersByPublicKeys(
  publicKeys: string[],
): Promise<{ email: string; publicKey: string }[]> {
  const body = JSON.stringify({ publicKeys });
  console.log("Fetching public keys for:", body);
  const response = await fetch("https://accounts.action-tokens.com/api/pubs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  });

  if (response.ok) {
    const data = (await response.json()) as {
      email: string;
      publicKey: string;
    }[];
    console.log("Fetched public keys:", data);
    return data;
  } else {
    // const data = await response.json();
    // console.log("Error fetching public keys:", data);
    // throw new Error("Public keys not found x");
    return [];
  }
}
