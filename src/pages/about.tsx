import Head from "next/head";
import changeLogJson from "../../changelog.json";
import packageJson from "../../package.json";
import { LOGO_BLURDATA } from "~/lib/defaults";
import { env } from "~/env";
import SAPage from "~/components/about/SAPage";

export default function About() {
  return (
    <>
      <Head>
        <title>About | BANDCOIN</title>
        <meta name="description" content={env.NEXT_PUBLIC_DESC} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container mx-auto mt-5 text-base-100">
        <SAPage
          app={{
            title: "BandCoin",
            codeName: packageJson.name,
            logo: {
              logoUrl: "/images/bandcoin-logo.png",
              blurDataUrl: LOGO_BLURDATA,
              alt: "Bandcoin logo",
            },
            version: packageJson.version,
          }}
          devCompany={{
            name: "SpeedOut",
            url: "https://play.google.com/store/apps/dev?id=7013622463085625240",
            year: 2023,
          }}
          devs={[
            {
              name: "Jose Urquiza",
              imgUrl:
                "https://raw.githubusercontent.com/biplobsd/biplobsd.github.io/data/images/action-tokens/joseUrquiza.jpg",
              role: "Founder and CEO - Action Tokens",
              url: "https://twitter.com/hollowvox",
            },
            {
              name: "Biplob Kumar Sutradhar",
              imgUrl: "https://avatars.githubusercontent.com/u/43641536",
              role: "Lead developer",
              url: "https://biplobsd.me",
            },
            {
              name: "Arnob Dey",
              imgUrl: "https://avatars.githubusercontent.com/u/74468064",
              role: "Developer",
              url: "https://github.com/arnob016",
            },
          ]}
          reportUrl="https://github.com/Bandcoin2023/issues/issues"
          poweredBy={{
            companyName: "bandcoin.io",
            url: "https://www.bandcoin.io",
          }}
          changeLogs={changeLogJson}
        />
      </main>
    </>
  );
}
