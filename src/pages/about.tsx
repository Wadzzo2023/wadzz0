import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/shadcn/ui/button";
import { env } from "~/env";

export default function About() {
  return (
    <>
      <Head>
        <title>About | ${env.NEXT_PUBLIC_SITE}</title>
        <meta name="description" content={env.NEXT_PUBLIC_DESC} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="">
        <section
          id="features"
          className="relative block   px-6 py-10 md:px-10 md:py-20"
        >
          <div className="relative mx-auto max-w-5xl text-center">
            <h2 className="block w-full  text-3xl font-bold  sm:text-4xl">
              About {env.NEXT_PUBLIC_SITE}
            </h2>
            <p className="mx-auto my-4 w-full max-w-xl  text-center font-medium leading-relaxed tracking-wide ">
              {env.NEXT_PUBLIC_SITE} is the best place for creators to build
              community with their biggest fans, share exclusive work, and turn
              their passions into lasting creative businesses. Starting a{" "}
              {env.NEXT_PUBLIC_SITE} account is free for creators and their
              fans. If they want to start earning an income, they can choose to
              launch their own digital shop or run a paid membership. Here,
              creators get a direct line to their communities. That means they
              never have to worry about ads or algorithms getting in between
              them and the people who matter most.
            </p>
          </div>

          <div className=" flex flex-col items-center justify-center  gap-10 py-5  md:flex-row ">
            <div className=" flex  rounded-md border ">
              <Image
                src={"/images/about/explore.png"}
                alt=""
                height={1000}
                width={1000}
                className="h-full w-full"
              />
            </div>
            <div className="flex  rounded-md border">
              <Image
                src={"/images/about/win.png"}
                alt=""
                height={1000}
                width={1000}
                className="h-full w-full"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-10">
            <h1 className="mb-2 text-xl font-bold">
              Download our application from
            </h1>

            <div className="flex items-center justify-center gap-4  md:items-start md:justify-start">
              <Link href="https://apps.apple.com/pk/app/{env.NEXT_PUBLIC_SITE}/id1639649037">
                <Button className="inline-flex w-full items-center justify-center rounded-lg bg-gray-800 px-4 py-2.5 text-white hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700 sm:w-auto">
                  <svg
                    className="me-3 h-7 w-7"
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fab"
                    data-icon="apple"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 384 512"
                  >
                    <path
                      fill="currentColor"
                      d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
                    ></path>
                  </svg>
                  <div className="text-left rtl:text-right">
                    <div className="mb-1 text-xs">Download on the</div>
                    <div className="-mt-1 font-sans text-sm font-semibold">
                      App Store
                    </div>
                  </div>
                </Button>
              </Link>
              <Link
                href={`https://play.google.com/store/apps/details?id=com.${env.NEXT_PUBLIC_SITE}.${env.NEXT_PUBLIC_SITE}&pli=1`}
              >
                <Button className="inline-flex w-full items-center justify-center rounded-lg bg-gray-800 px-4 py-2.5 text-white hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700 sm:w-auto">
                  <svg
                    className="me-3 h-7 w-7"
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fab"
                    data-icon="google-play"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                  >
                    <path
                      fill="currentColor"
                      d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"
                    ></path>
                  </svg>
                  <div className="text-left rtl:text-right">
                    <div className="mb-1 text-xs">Get in on</div>
                    <div className="-mt-1 font-sans text-sm font-semibold">
                      Google Play
                    </div>
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
