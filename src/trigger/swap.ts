import { task } from "@trigger.dev/sdk/v3";
import { submitSignedXDRToServer4User } from "package/connect_wallet/src/lib/stellar/trx/payment_fb_g";
import { db } from "~/server/db";

export const swapTask = task({
  id: "swap-asset-usdt",
  run: async (payload: { xdr: string; bountyId: number }, { ctx }) => {
    const { xdr, bountyId } = payload;
    const res = await submitSignedXDRToServer4User(xdr);
    if (res) {
      await db.bounty.update({
        where: {
          id: bountyId,
        },
        data: {
          isSwaped: true,
        },
      });
      return {
        message: "Swap task completed",
      };
    }
    return {
      message: "Swap task failed",
    };
  },
});
