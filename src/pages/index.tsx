import Head from "next/head";
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
      <main className="p-4">
        <MainSection />
      </main>
    </>
  );
}

function MainSection() {
  return <Main />;
}
