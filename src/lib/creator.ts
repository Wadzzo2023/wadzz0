/** A brand's public page: its vanity URL when it has one, else its id. */
export const creatorHref = (c: { id: string; vanityURL?: string | null }) => `/creator/${c.vanityURL ?? c.id}`;
