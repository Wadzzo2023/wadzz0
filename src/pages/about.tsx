import Image from "next/image";
import Link from "next/link";
import Logo from "~/components/logo";
import { Button } from "~/components/shadcn/ui/button";
import { Card, CardContent } from "~/components/shadcn/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-[#39BD2B]">
      <main className="container mx-auto px-4 py-16">
        <h1 className="mb-8 text-center text-4xl font-bold ">
          About
        </h1>

        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-6 text-lg text-gray-700">
            Wadzzo is an innovative platform designed to transform the way people engage with brands through gamified experiences. Our mission is to bridge the digital and physical worlds by enabling users to explore their surroundings, discover rewards, and connect with brands in a fun, interactive way.
          </p>
          <Link href="/fans/home">
            <Button >
              Join as BRANDS
            </Button>
          </Link>
        </div>

        <div className="mb-16 grid gap-8 md:grid-cols-2">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <h2 className="mb-4 text-2xl font-semibold ">
                For Brands:
              </h2>
              <p className="mb-4">
                Wadzzo offers a dynamic platform for brands to create impactful, localized campaigns. With our intuitive dashboard, brands can:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-gray-700">
                <li>Place virtual pins at any GPS location, each holding a unique reward.</li>
                <li>
                  Customize campaigns with brand details, descriptions, and collection limits.
                </li>
                <li>Build memorable connections with customers through immersive experiences.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <h2 className="mb-4 text-2xl font-semibold ">
                For Users:
              </h2>
              <p className="mb-4">
                Wadzzo turns the world into your playground. Embark on exciting virtual scavenger hunts where you can:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-gray-700">
                <li>
                  Discover GPS-based pins placed by brands worldwide.
                </li>
                <li>
                  Collect and claim rewards in real-time by exploring your surroundings.
                </li>
                <li>
                  Enjoy a unique mix of augmented reality (AR) and gamification tailored to your lifestyle.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <section className="mb-16">
          <h2 className="mb-6 text-center text-3xl font-semibold">
            Why Choose Wadzzo?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Interactive Engagement",
                description: "Elevate customer engagement with gamified experiences.",
                icon: "🎸",
              },
              {
                title: "Calable Reach",
                description: "Connect with users globally using real-time, location-based technology.",
                icon: "🎧",
              },
              {
                title: "Seamless Experience",
                description:
                  "Enjoy an intuitive platform powered by cutting-edge AR and GPS integration.",
                icon: "🚀",
              },
            ].map((item, index) => (
              <Card key={index} className="bg-white shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 text-4xl">{item.icon}</div>
                  <h3 className="mb-2 text-xl font-semibold ">
                    {item.title}
                  </h3>
                  <p className="text-gray-700">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="mb-16 text-center">
          <p className="mb-6 text-xl text-gray-700">
            Whether you’re hunting for rewards or driving brand visibility, Wadzzo redefines engagement by merging technology, fun, and creativity.
          </p>
        </div>

        {/* only for wadzzo */}
        <div className="flex flex-col items-center justify-center py-10">
          <h1 className="mb-2 text-xl font-bold">
            Download our application from
          </h1>

          <div className="flex items-center justify-center gap-4  md:items-start md:justify-start">
            <Link href="https://apps.apple.com/us/app/wadzzo/id1639649037">
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
            <Link href="https://play.google.com/store/apps/details?id=com.thebillboardapp.wadzzo">
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
        {/* <div className="relative h-64 overflow-hidden rounded-lg">
          <Image
            src="/placeholder.svg?height=256&width=1024"
            alt="Music collaboration"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
        </div> */}
      </main>
    </div>
  );
}