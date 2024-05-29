import { useSession } from "next-auth/react";
import Head from "next/head";
import toast from "react-hot-toast";
import Main from "~/components/wallete/main";
import { api } from "~/utils/api";

export default function Home() {
  return (
    <>
      <Head>
        <title>BandFan</title>
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
