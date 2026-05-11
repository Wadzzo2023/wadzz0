import { useState } from "react";
import { getCookie } from "cookies-next";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { submitSignedXDRToServer4User } from "package/connect_wallet/src/lib/stellar/trx/payment_fb_g";
import toast from "react-hot-toast";
import ConvertCard from "~/components/marketplace/recharge/convert_card";
import OfferCard from "~/components/marketplace/recharge/offer_card";
import PaymentCard from "~/components/marketplace/recharge/pay_card";
import { Offer } from "~/components/marketplace/recharge/types";
import { Button } from "~/components/shadcn/ui/button";
import { Card } from "~/components/shadcn/ui/card";
import { useRecharge } from "~/lib/state/recharge";
import { api } from "~/utils/api";
import { Coins, RefreshCw, ArrowRight } from "lucide-react";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";

function PayPage() {
  const [layoutMode] = useState<"modern" | "legacy">(() => {
    const cookieMode = getCookie("wadzzo-layout-mode");
    if (cookieMode === "modern") return "modern";
    if (cookieMode === "legacy") return "legacy";
    if (typeof window !== "undefined") {
      const storedMode = localStorage.getItem("layoutMode");
      if (storedMode === "modern") return "modern";
      if (storedMode === "legacy") return "legacy";
    }
    return "legacy";
  });

  if (layoutMode === "modern") return <ModernPayPage />;

  return <LegacyPayPage />;
}

function LegacyPayPage() {
  const { convertOpen, setOpen } = useRecharge();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <h2 className="text-3xl">Recharge Token</h2>
        {convertOpen ? <LegacyCovertSiteAsset /> : <LegacySiteAssetBuy />}
      </div>
    </div>
  );
}

function LegacyCovertSiteAsset() {
  const [selected, setSelected] = useState(false);
  const xdrMuation = api.marketplace.steller.convertSiteAsset.useMutation({
    async onSuccess(data, variables, context) {
      if (data) {
        const presignedxdr = data;
        const res = await submitSignedXDRToServer4User(presignedxdr);
        if (res) {
          toast.success("Transaction successful.");
        } else {
          toast.error(
            "Transaction error, Code: Stellar. Please let any admin know.",
          );
        }
        setSelected(false);
      }
    },
  });

  function handleCovert() {
    xdrMuation.mutate({ siteAssetAmount: 20, xlm: "1" });
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <ConvertCard
        handleClick={() => setSelected(!selected)}
        selected={selected}
      />
      {selected && (
        <button
          className="btn btn-primary w-full"
          onClick={() => handleCovert()}
        >
          {xdrMuation.isLoading && <span className="loading loading-spinner" />}
          Convert
        </button>
      )}
    </div>
  );
}

function LegacySiteAssetBuy() {
  const session = useSession();
  const [xdr, setXDR] = useState<string>();

  const [selectedIdx, setSelection] = useState<number>(() => 0);
  const offersQ = api.marketplace.pay.getOffers.useQuery();

  const { data } = api.bounty.Bounty.getCurrentUSDFromAsset.useQuery();

  const xdrMutation = api.marketplace.pay.getRechargeXDR.useMutation({
    onSuccess: (data) => {
      setXDR(data);
      toast.success("Transaction Ready");
    },
    onError: (e) => toast.error(`${e.message}`),
  });

  function handleOfferChange(i: number) {
    if (i == selectedIdx) return;
    setXDR(undefined);
    setSelection(i);
  }

  const offers = offersQ.data;
  if (offers) {
    const selectedOffer = offers[selectedIdx];
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="my-5 flex flex-wrap justify-center gap-2">
          {offers.map((offer, i) => {
            return (
              <OfferCard
                handleClick={() => handleOfferChange(i)}
                key={i}
                selected={i == selectedIdx}
                num={offer.num}
                price={offer.price}
              />
            );
          })}
        </div>

        {selectedOffer && <SelectedOfferSummary offer={selectedOffer} />}

        {session.status == "authenticated" && selectedOffer && (
          <>
            {xdr ? (
              <PaymentCard
                xdr={xdr}
                {...{ pubkey: session.data.user.id }}
                offer={selectedOffer}
              />
            ) : (
              <Button
                variant="default"
                className="w-1/2"
                disabled={xdrMutation.isLoading}
                onClick={() =>
                  xdrMutation.mutate({
                    tokenNum: selectedOffer.num,
                    xlm: selectedOffer.price,
                  })
                }
              >
                {xdrMutation.isLoading && (
                  <span className="loading loading-spinner mr-2" />
                )}
                {xdrMutation.isLoading ? "Preparing transaction" : "Buy Now"}
              </Button>
            )}
          </>
        )}
      </div>
    );
  }
}

interface ISelectedOfferSummary {
  offer?: Offer;
}
function SelectedOfferSummary({ offer }: ISelectedOfferSummary) {
  if (offer)
    return (
      <div>
        <p>
          Buy {offer.num} {process.env.NEXT_PUBLIC_ASSET_CODE} for ${" "}
          {offer.price}
        </p>
      </div>
    );
  else <p>No offer selected</p>;
}

function ModernPayPage() {
  const { convertOpen, setOpen } = useRecharge();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-[85vw] py-8"
      >
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="mb-3 text-4xl font-bold tracking-tight">
            Recharge
            <span className="bg-gradient-to-r from-accent to-accent/60 bg-clip-text text-transparent">
              {" "}{PLATFORM_ASSET.code.toUpperCase()}{" "}
            </span>
            Tokens
          </h1>
          <p className="mx-auto max-w-md text-muted-foreground">
            Purchase tokens securely via Stellar network
          </p>
        </motion.div>

        <motion.div
          className="mb-10 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative rounded-2xl bg-muted/50 p-1.5 backdrop-blur-sm">
            <motion.button
              className="relative rounded-xl px-8 py-3 text-sm font-semibold text-accent-foreground transition-colors"
              onClick={() => setOpen(false)}
            >
              <motion.div
                className="absolute inset-0 rounded-xl bg-accent"
                layoutId="activeTab"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
              <span className="relative z-10">Buy Tokens</span>
            </motion.button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={convertOpen ? "convert" : "buy"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {convertOpen ? <ModernCovertSiteAsset /> : <ModernSiteAssetBuy />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function ModernCovertSiteAsset() {
  const [selected, setSelected] = useState(false);
  const xdrMuation = api.marketplace.steller.convertSiteAsset.useMutation({
    async onSuccess(data) {
      if (data) {
        const presignedxdr = data;
        const res = await submitSignedXDRToServer4User(presignedxdr);
        if (res) {
          toast.success("Transaction successful.");
        } else {
          toast.error(
            "Transaction error, Code: Stellar. Please let any admin know.",
          );
        }
        setSelected(false);
      }
    },
  });

  function handleCovert() {
    xdrMuation.mutate({ siteAssetAmount: 20, xlm: "1" });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="overflow-hidden border-2 border-dashed border-border hover:border-accent/50 transition-colors">
        <div className="p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-3">
              <RefreshCw className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Convert Assets</h3>
              <p className="text-sm text-muted-foreground">Convert your existing assets to {PLATFORM_ASSET.code.toUpperCase()}</p>
            </div>
          </div>

          <div
            className={`cursor-pointer rounded-xl border-2 p-6 transition-all ${selected
              ? "ring-2 ring-accent border-accent bg-accent/5"
              : "border-border hover:border-accent/30"
              }`}
            onClick={() => setSelected(!selected)}
          >
            <ConvertCard
              handleClick={() => setSelected(!selected)}
              selected={selected}
            />
          </div>

          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6"
              >
                <Button
                  className="w-full rounded-xl py-7 text-base font-semibold"
                  onClick={() => handleCovert()}
                  disabled={xdrMuation.isLoading}
                >
                  {xdrMuation.isLoading && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="mr-2"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </motion.div>
                  )}
                  {xdrMuation.isLoading ? "Converting..." : "Convert Now"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}

function ModernSiteAssetBuy() {
  const session = useSession();
  const [xdr, setXDR] = useState<string>();
  const [selectedIdx, setSelection] = useState<number>(() => 0);
  const offersQ = api.marketplace.pay.getOffers.useQuery();

  const xdrMutation = api.marketplace.pay.getRechargeXDR.useMutation({
    onSuccess: (data) => {
      setXDR(data);
      toast.success("Transaction Ready");
    },
    onError: (e) => toast.error(`${e.message}`),
  });

  function handleOfferChange(i: number) {
    if (i === selectedIdx) return;
    setXDR(undefined);
    setSelection(i);
  }

  const offers = offersQ.data;
  const isLoading = offersQ.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        >
          <RefreshCw className="h-8 w-8 text-accent" />
        </motion.div>
      </div>
    );
  }

  if (!offers) return null;

  const selectedOffer = offers[selectedIdx];

  return (
    <div className="space-y-8">
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {offers.map((offer, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card
              className={`group relative cursor-pointer overflow-hidden border-2 rounded-3xl transition-all duration-300 hover:shadow-lg ${i === selectedIdx
                ? "border-accent bg-accent/5 shadow-lg ring-2 ring-accent"
                : "border-border hover:border-accent/50"
                }`}
              onClick={() => handleOfferChange(i)}
            >
              {i === selectedIdx && (
                <motion.div
                  className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <motion.div
                    className="h-2 w-2 rounded-full bg-accent-foreground"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  />
                </motion.div>
              )}
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Coins className={`h-8 w-8 ${i === selectedIdx ? "text-accent" : "text-muted-foreground"}`} />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold">
                    {offer.num.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {PLATFORM_ASSET.code.toUpperCase()} Tokens
                  </p>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-accent">
                    ${offer.price}
                  </span>
                  <ArrowRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${i === selectedIdx ? "text-accent" : "text-muted-foreground"
                    }`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {session.status === "authenticated" && selectedOffer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="sticky bottom-6"
        >
          {xdr ? (
            <PaymentCard
              xdr={xdr}
              {...{ pubkey: session.data.user.id }}
              offer={selectedOffer}
            />
          ) : (
            <Button
              size="lg"
              className="w-full rounded-2xl py-7 text-base font-semibold shadow-lg shadow-accent/25"
              disabled={xdrMutation.isLoading}
              onClick={() =>
                xdrMutation.mutate({
                  tokenNum: selectedOffer.num,
                  xlm: selectedOffer.price,
                })
              }
            >
              {xdrMutation.isLoading && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="mr-2"
                >
                  <RefreshCw className="h-5 w-5" />
                </motion.div>
              )}
              {xdrMutation.isLoading ? "Preparing Transaction..." : `Buy Now for $${selectedOffer.price}`}
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default PayPage;
