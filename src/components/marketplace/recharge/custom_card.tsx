import { useState } from "react";
import { env } from "~/env";

function CustomOfferCard() {
  const [siteAssetAmount, setAssetAmount] = useState(10);
  function handleChange(num: string) {
    const count = Number(num);
    setAssetAmount(count);
  }
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <h3 className=" text-2xl font-bold">Recharge {env.NEXT_PUBLIC_SITE}</h3>
      <p className=" text-base">Price: 1 {env.NEXT_PUBLIC_SITE} 1$</p>
      <div>
        <label className="form-control w-full max-w-sm">
          <input
            type="number"
            min={1}
            placeholder={`How many ${env.NEXT_PUBLIC_SITE}`}
            className="input input-bordered w-full max-w-sm"
            onChange={(e) => handleChange(e.target.value)}
          />
          <div className="label">
            <span className="label-text-alt">
              {siteAssetAmount} x 1$ = {siteAssetAmount}$
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
