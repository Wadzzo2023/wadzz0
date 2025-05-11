/* eslint-disable */
import { task } from "@trigger.dev/sdk/v3";

import { randomUUID } from "crypto";
import { Client, Environment } from "square";

// @ts-expect-error BigInt polyfill
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const { paymentsApi } = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox,
});

async function squarePayment({
  sourceId,
  amount,
}: {
  sourceId: string;
  amount: number;
}) {
  const { result } = await paymentsApi.createPayment({
    idempotencyKey: randomUUID(),
    sourceId: sourceId,
    amountMoney: {
      currency: "USD",
      amount: 100 as unknown as bigint,
    },
  });
  console.log(result);
}

export const rechargeTask = task({
  id: "recharge-task",
  retry: {
    maxAttempts: 5,
    factor: 1.8,
    minTimeoutInMs: 500,
    maxTimeoutInMs: 30_000,
  },

  run: async (payload: { xdr: string; sourceId: string }) => {
    try {
      await squarePayment({
        amount: 100,
        sourceId: payload.sourceId,
      });
    } catch (e) {
      console.log(e);
    }
  },
});
