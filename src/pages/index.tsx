import "mapbox-gl/dist/mapbox-gl.css";

import Head from "next/head";
import Main from "~/components/wallete/main";
import { env } from "~/env";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { api } from "~/utils/api";

export default function Home() {
  const { setBalance } = useUserStellarAcc();
  const acc = api.wallate.acc.getUserPubAssetBallances.useQuery(undefined, {
    onSuccess: (data) => {
      setBalance(data);
    },
    onError: (error) => {
      console.log(error);
    },
    refetchOnWindowFocus: false,
  });
  return (
    <>
      <Head>
        <title>{env.NEXT_PUBLIC_SITE}</title>
        <meta
          name="description"
          content="A subscription-based platform that connects bands & creators with their fans on Stellar Blockchain."
        />
        <meta property="og:title" content={env.NEXT_PUBLIC_SITE} />
        <meta
          property="og:description"
          content="Connect with bands & creators on the Stellar Blockchain."
        />
        <meta name="keywords" content={process.env.NEXT_PUBLIC_KEYWORD} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={env.NEXT_PUBLIC_URL} />
        <meta name="robots" content="index, follow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="p-4">
        <MainSection />
      </main>
    </>
  );
}

function MainSection() {
  return <Main />;
}
