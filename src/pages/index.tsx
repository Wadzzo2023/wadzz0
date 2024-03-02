import Head from "next/head";
import { PostCard } from "~/components/fan/creator/post";

import { api } from "~/utils/api";
import Main from "~/components/wallete/main";

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
      <main className="">
        <AuthShowcase />
      </main>
    </>
  );
}

function AuthShowcase() {
  return <Main  />;
}
