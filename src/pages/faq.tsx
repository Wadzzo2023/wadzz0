import Head from "next/head";
import Link from "next/link";

// Define the FAQ items
const faqItems = [
  {
    question: "What is BandCoin?",
    answer:
      "BandCoin is a revolutionary digital currency designed specifically for the music industry. It aims to create a decentralized ecosystem that empowers artists, fans, and industry professionals by providing a transparent and efficient way to manage royalties, ticketing, and music rights.",
  },
  {
    question: "How does Band coin differ from other cryptocurrencies?",
    answer:
      "Band coin is tailored for the music industry, offering features like smart contracts for royalty distribution, tokenized music rights, and fan engagement tools. Unlike general-purpose cryptocurrencies, Bandcoin focuses on solving specific challenges within the music ecosystem.",
  },
  {
    question: "How can I buy BandCoin?",
    answer:
      "You can purchase BandCoin through our official website or authorized cryptocurrency exchanges. Visit our 'How to Buy' page for a step-by-step guide on acquiring BandCoin safely and securely.",
  },
  {
    question: "What are the benefits of using Bandcoin for artists?",
    answer:
      "Artists can benefit from Bandcoin in several ways, including faster and more transparent royalty payments, direct fan engagement opportunities, and the ability to tokenize their music rights for better control over their intellectual property.",
  },
  {
    question: "Is BandCoin secure?",
    answer:
      "Yes, BandCoin utilizes advanced blockchain technology to ensure the security and integrity of transactions. We employ state-of-the-art encryption and follow best practices in cryptocurrency security to protect our users' assets and data.",
  },
];

export default function FAQ() {
  const title =
    "Frequently Asked Questions about BandCoin | Your Music Industry Cryptocurrency";
  const description =
    "Get answers to common questions about BandCoin, Band coin, and Bandcoin. Learn how our cryptocurrency is revolutionizing the music industry for artists and fans alike.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content="BandCoin, Band coin, Bandcoin, cryptocurrency, music industry, FAQ"
        />
        <link rel="canonical" href="https://www.bandcoin.com/faq" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content="https://www.bandcoin.com/faq" />
        <meta
          property="og:image"
          content="https://www.bandcoin.com/images/bandcoin-og-image.jpg"
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta
          name="twitter:image"
          content="https://www.bandcoin.com/images/bandcoin-twitter-image.jpg"
        />

        {/* Structured Data for FAQs */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          })}
        </script>
      </Head>

      <main className="container mx-auto bg-slate-50 px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">
          Frequently Asked Questions about BandCoin
        </h1>

        <section className="space-y-8">
          {faqItems.map((item, index) => (
            <div key={index} className="border-b pb-4">
              <h2 className="mb-2 text-2xl font-semibold">{item.question}</h2>
              <p className="text-gray-700">{item.answer}</p>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-semibold">Still have questions?</h2>
          <p className="mb-4">
            If you couldn&apos;t find the answer you were looking for, please
            don&apos;t hesitate to reach out to our support team.
          </p>
          <Link href="/contact" className="text-blue-600 hover:underline">
            Contact Us
          </Link>
        </section>

        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-semibold">
            Learn More About BandCoin
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <Link href="/about" className="text-blue-600 hover:underline">
                About BandCoin
              </Link>
            </li>
            <li>
              <Link
                href="/how-it-works"
                className="text-blue-600 hover:underline"
              >
                How BandCoin Works
              </Link>
            </li>
            <li>
              <Link
                href="/for-artists"
                className="text-blue-600 hover:underline"
              >
                BandCoin for Artists
              </Link>
            </li>
            <li>
              <Link href="/for-fans" className="text-blue-600 hover:underline">
                BandCoin for Fans
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
