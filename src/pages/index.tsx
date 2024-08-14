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
