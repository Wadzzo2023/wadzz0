import { createCipheriv, randomBytes } from "crypto";

import { Asset, Claimant, Horizon, Keypair, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";

process.loadEnvFile(".env.development");

const server = new Horizon.Server("https://horizon-testnet.stellar.org");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fund(kp: Keypair) {
  const r = await fetch(`https://friendbot.stellar.org/?addr=${kp.publicKey()}`);
  expect(r.ok).toBe(true);
  for (let i = 0; i < 20; i++) {
    try {
      await server.loadAccount(kp.publicKey());
      return;
    } catch {
      await sleep(1500);
    }
  }
}

async function send(source: Keypair, build: (tx: TransactionBuilder) => void, extra: Keypair[] = []) {
  const acc = await server.loadAccount(source.publicKey());
  const tx = new TransactionBuilder(acc, { fee: "1000", networkPassphrase: Networks.TESTNET }).setTimeout(60);
  build(tx);
  const built = tx.build();
  built.sign(source, ...extra);
  return server.submitTransaction(built);
}

function encrypt(secret: string) {
  const raw = process.env.ISSUER_ENCRYPTION_KEY!;
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([c.update(secret, "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

const bal = async (id: string, asset: Asset | "XLM") => {
  const a = await server.loadAccount(id);
  const l = a.balances.find((b) => (asset === "XLM" ? b.asset_type === "native" : "asset_code" in b && b.asset_code === asset.getCode() && b.asset_issuer === asset.getIssuer()));
  return Number(l && "balance" in l ? l.balance : 0);
};

describe("fan app money flows (testnet)", () => {
  it("buy, bulk buy, resale, send, and accepting a gift", async () => {
    const { db } = await import("~/server/db");
    const { PLATFORM_ASSET } = await import("~/lib/stellar/constant");
    const { preparePurchase } = await import("~/server/stellar/purchase");
    const { prepareStorageSetup, prepareListing } = await import("~/server/stellar/resale");
    const { prepareSend } = await import("~/server/stellar/transfer");
    const { pendingGifts, prepareGiftClaim } = await import("~/server/stellar/wallet");
    const { settle } = await import("~/server/stellar/ledger");

    const brand = Keypair.random(), brandStorage = Keypair.random(), issuer = Keypair.random();
    const A = Keypair.random(), B = Keypair.random(), C = Keypair.random(), D = Keypair.random();
    await Promise.all([brand, brandStorage, issuer, A, B, C].map(fund));

    // Wadzzo trustlines + balances (the platform sends the tokens)
    const mother = Keypair.fromSecret(process.env.MOTHER_SECRET!);
    for (const kp of [brand, A, B, C]) await send(kp, (t) => t.addOperation(Operation.changeTrust({ asset: PLATFORM_ASSET })));
    for (const [kp, amount] of [[A, "1000"], [B, "1000"]] as const) {
      await send(mother, (t) => t.addOperation(Operation.payment({ destination: kp.publicKey(), asset: PLATFORM_ASSET, amount })));
    }

    const sfx = Math.random().toString(36).slice(2, 8);
    const code = ("M" + Math.random().toString(36).slice(2, 8)).toUpperCase();
    const item = new Asset(code, issuer.publicKey());
    await db.user.createMany({ data: [brand, A, B, C].map((k, i) => ({ id: k.publicKey(), name: `e2e-${i}-${sfx}`, email: `e2e-${i}-${sfx}@example.test` })) });
    await db.creator.create({ data: { id: brand.publicKey(), name: `E2E brand ${sfx}`, storagePub: brandStorage.publicKey(), storageSecret: brandStorage.secret(), aprovalSend: true, approved: true, platformId: "wadzzo" } });
    await db.creatorIssuer.create({ data: { creatorId: brand.publicKey(), publicKey: issuer.publicKey(), secretEncrypted: encrypt(issuer.secret()), active: true } });
    const asset = await db.asset.create({
      data: { code, issuer: issuer.publicKey(), name: `E2E ${sfx}`, description: "e2e", mediaType: "IMAGE", mediaUrl: "https://example.test/a.png", thumbnail: "https://example.test/a.png", limit: null, royaltyPercent: 10, creatorId: brand.publicKey(), platformId: "wadzzo" },
    });
    const listing = await db.marketAsset.create({ data: { assetId: asset.id, placerId: brand.publicKey(), price: 50, priceUSD: 0.5, privacy: "PUBLIC", type: "FAN", platformId: "wadzzo" } });
    const ctx = { db, platform: { id: "wadzzo", isRoot: true } };

    const submit = async (kp: Keypair, xdr: string) => {
      const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
      tx.sign(kp);
      return server.submitTransaction(tx);
    };
    const step = async (name: string, kp: Keypair, p: { ok: boolean; txId?: string; xdr?: string; quote?: unknown }) => {
      if (!p.ok || !p.txId || !p.xdr) throw new Error(`${name} failed to prepare: ${JSON.stringify((p.quote as { problems?: unknown })?.problems)}`);
      await submit(kp, p.xdr);
      const row = await settle(db, p.txId);
      console.log(name, row?.status, row?.error ?? "");
      expect(row?.status).toBe("SUCCESS");
      return row!;
    };

    try {
      // 1. buy one from the brand: minted on demand
      await step("BUY x1", A, await preparePurchase(ctx, { buyerId: A.publicKey(), listingId: listing.id, method: "PLATFORM_ASSET", signer: undefined, quantity: 1 }));
      expect(await bal(A.publicKey(), item)).toBe(1);

      // 2. bulk: three more
      await step("BUY x3", A, await preparePurchase(ctx, { buyerId: A.publicKey(), listingId: listing.id, method: "PLATFORM_ASSET", signer: undefined, quantity: 3 }));
      expect(await bal(A.publicKey(), item)).toBe(4);
      expect((await db.asset.findUniqueOrThrow({ where: { id: asset.id } })).mintedCount).toBe(4);
      const brandBefore = await bal(brand.publicKey(), PLATFORM_ASSET);

      // 3. A opens a storage account and lists 2 copies at 20 Wadzzo
      await step("STORAGE", A, await prepareStorageSetup(ctx, { userId: A.publicKey(), payIn: "PLATFORM_ASSET", signer: undefined }));
      await step("LIST x2", A, await prepareListing(ctx, { userId: A.publicKey(), assetId: asset.id, copies: 2, price: 20, payIn: "PLATFORM_ASSET", signer: undefined }));
      const resale = await db.marketAsset.findFirstOrThrow({ where: { assetId: asset.id, placerId: A.publicKey() } });
      expect(resale.price).toBe(20);

      // 4. B buys one resale copy: the seller is paid, the brand earns its 10% royalty
      const aBefore = await bal(A.publicKey(), PLATFORM_ASSET);
      await step("RESALE x1", B, await preparePurchase(ctx, { buyerId: B.publicKey(), listingId: resale.id, method: "PLATFORM_ASSET", signer: undefined, quantity: 1 }));
      expect(await bal(B.publicKey(), item)).toBe(1);
      const sellerGain = (await bal(A.publicKey(), PLATFORM_ASSET)) - aBefore;
      const royalty = (await bal(brand.publicKey(), PLATFORM_ASSET)) - brandBefore;
      console.log("PAYOUT seller", sellerGain, "royalty", royalty);
      expect(sellerGain).toBeCloseTo(18, 5);
      expect(royalty).toBeCloseTo(2, 5);

      // 5. B sends 5 Wadzzo to C (direct) and to a brand-new wallet D (creates the account)
      await step("SEND direct", B, { ok: true, ...(await prepareSend(ctx, { userId: B.publicKey(), signer: undefined, code: PLATFORM_ASSET.code, issuer: PLATFORM_ASSET.issuer, to: C.publicKey(), amount: 5 })) });
      expect(await bal(C.publicKey(), PLATFORM_ASSET)).toBe(5);
      const sd = await prepareSend(ctx, { userId: B.publicKey(), signer: undefined, code: "XLM", issuer: null, to: D.publicKey(), amount: 3 });
      await step("SEND to new wallet", B, { ok: true, ...sd });
      expect(await bal(D.publicKey(), "XLM")).toBeGreaterThan(0);

      // 6. the brand gifts B one item as a claimable gift; B accepts it
      await send(brand, (t) => {
        t.addOperation(Operation.payment({ source: mother.publicKey(), destination: issuer.publicKey(), asset: Asset.native(), amount: "1" }));
        t.addOperation(Operation.createClaimableBalance({ source: issuer.publicKey(), asset: item, amount: "1", claimants: [new Claimant(B.publicKey(), Claimant.predicateUnconditional())] }));
      }, [mother, issuer]);
      const gifts = await pendingGifts(B.publicKey());
      console.log("PENDING GIFTS", gifts.length);
      expect(gifts.length).toBe(1);
      await step("ACCEPT gift", B, { ...(await prepareGiftClaim(ctx, { userId: B.publicKey(), balanceId: gifts[0]!.id, signer: undefined })), ok: true });
      expect(await bal(B.publicKey(), item)).toBe(2);

      // the brand and the fans were told
      const brandNotes = await db.notification.findMany({ where: { notifierId: brand.publicKey() }, select: { notificationObject: { select: { entityType: true } } } });
      const types = brandNotes.map((n) => n.notificationObject.entityType);
      console.log("BRAND NOTIFICATIONS", types);
      expect(types).toContain("ITEM_SOLD");
      expect(types).toContain("ROYALTY_EARNED");
    } finally {
      const ids = [brand, A, B, C].map((k) => k.publicKey());
      await db.notification.deleteMany({ where: { notifierId: { in: ids } } });
      await db.notificationObject.deleteMany({ where: { actorId: { in: ids } } });
      await db.assetTransaction.deleteMany({ where: { OR: [{ creatorId: brand.publicKey() }, { buyerId: { in: ids } }, { sellerId: { in: ids } }] } });
      await db.user_Asset.deleteMany({ where: { userId: { in: ids } } });
      await db.marketAsset.deleteMany({ where: { assetId: asset.id } });
      await db.asset.deleteMany({ where: { creatorId: brand.publicKey() } });
      await db.creatorIssuer.deleteMany({ where: { creatorId: brand.publicKey() } });
      await db.creator.deleteMany({ where: { id: { in: ids } } });
      await db.user.deleteMany({ where: { id: { in: ids } } });
    }
  });
});
