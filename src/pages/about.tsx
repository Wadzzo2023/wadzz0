import Image from "next/image";
import Logo from "~/components/logo";
import { Button } from "~/components/shadcn/ui/button";
import { Card, CardContent } from "~/components/shadcn/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100">
      <main className="container mx-auto px-4 py-16">
        <h1 className="mb-8 text-center text-4xl font-bold text-purple-800">
          About <Logo />
        </h1>

        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-6 text-lg text-gray-700">
            Bandcoin is a revolutionary platform designed to empower bands and
            music enthusiasts by connecting them with the Stellar blockchain.
            Our mission is to redefine how artists and fans engage, collaborate,
            and grow within the music industry.
          </p>
          <Button className="bg-purple-600 text-white hover:bg-purple-700">
            Join Bandcoin
          </Button>
        </div>

        <div className="mb-16 grid gap-8 md:grid-cols-2">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <h2 className="mb-4 text-2xl font-semibold text-purple-700">
                For Bands and Artists
              </h2>
              <p className="mb-4">
                Bandcoin provides tools and opportunities to:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-gray-700">
                <li>Tokenize your music and create unique digital assets.</li>
                <li>
                  Engage directly with fans through innovative blockchain
                  solutions.
                </li>
                <li>Monetize your creativity securely and transparently.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <h2 className="mb-4 text-2xl font-semibold text-purple-700">
                For Fans
              </h2>
              <p className="mb-4">
                Bandcoin enhances the fan experience by offering:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-gray-700">
                <li>
                  Exclusive access to music and collectibles through NFTs.
                </li>
                <li>
                  Opportunities to support your favorite artists directly.
                </li>
                <li>
                  A seamless way to discover and engage with music powered by
                  blockchain.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <section className="mb-16">
          <h2 className="mb-6 text-center text-3xl font-semibold text-purple-800">
            Why Bandcoin?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Empowered Artists",
                description: "Take control of your music and revenue streams.",
                icon: "🎸",
              },
              {
                title: "Engaged Fans",
                description: "Build deeper connections with artists you love.",
                icon: "🎧",
              },
              {
                title: "Innovative Technology",
                description:
                  "Leverage the Stellar blockchain for efficiency and scalability.",
                icon: "🚀",
              },
            ].map((item, index) => (
              <Card key={index} className="bg-white shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 text-4xl">{item.icon}</div>
                  <h3 className="mb-2 text-xl font-semibold text-purple-700">
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
            Bandcoin bridges the gap between music and technology, creating a
            vibrant ecosystem where creativity and community thrive.
          </p>
          <Button className="bg-purple-600 px-8 py-3 text-lg text-white hover:bg-purple-700">
            Join Bandcoin and be part of the future of music
          </Button>
        </div>

        <div className="relative h-64 overflow-hidden rounded-lg">
          <Image
            src="/placeholder.svg?height=256&width=1024"
            alt="Music collaboration"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
        </div>
      </main>
    </div>
  );
}
