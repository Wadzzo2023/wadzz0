import { logger, task } from "@trigger.dev/sdk/v3";
import { submitSignedXDRToServer4User } from "package/connect_wallet/src/lib/stellar/trx/payment_fb_g";

export const swapTask = task({
  id: "swap-asset-usdt",
  retry: {
    maxAttempts: 5,
    factor: 1.8,
    minTimeoutInMs: 500,
    maxTimeoutInMs: 30_000,
  },

  run: async (payload: { xdr: string; bountyId: number }) => {
    const { xdr } = payload;
    const res = await submitSignedXDRToServer4User(xdr);
    logger.log("Log message", { res });

    if (!res) {
      throw new Error("Swap failed");
    }
  },
  onSuccess: async (payload: { xdr: string; bountyId: number }) => {
    console.log(
      "Swap success Swap success Swap success Swap success Swap success",
    );
    // await db.bounty.update({
    //   where: {
    //     id: payload.bountyId,
    //   },
    //   data: {
    //     isSwaped: true,
    //   },
    // });
  },
});
