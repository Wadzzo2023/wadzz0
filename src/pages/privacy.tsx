import Link from "next/link";
import Logo from "~/components/logo";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="flex gap-2">
          <div>
            <Logo className="bg-yellow-500 px-2" />
          </div>
          <h1 className="mb-8 items-center text-center text-4xl font-bold">
            Privacy Policy
          </h1>
        </div>

        <div className="mb-8 rounded-lg bg-white p-6 shadow-md md:p-8">
          <p className="mb-4 text-sm text-gray-600">
            Effective Date: March 12, 2024
          </p>

          <p className="mb-4">
            At Wadzzo, your privacy is our priority. This policy explains what
            information we collect, how it is used, and the rights you have as a
            user. By using Wadzzo&apos;s services, you agree to the collection
            and use of your data as outlined here.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          <nav className="md:col-span-1">
            <div className="sticky top-8">
              <h2 className="mb-4 text-xl font-semibold">Table of Contents</h2>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#introduction"
                    className="text-blue-600 hover:underline"
                  >
                    Introduction
                  </a>
                </li>
                <li>
                  <a
                    href="#information-we-collect"
                    className="text-blue-600 hover:underline"
                  >
                    Information We Collect
                  </a>
                </li>
                <li>
                  <a
                    href="#third-party-services"
                    className="text-blue-600 hover:underline"
                  >
                    Third-Party Services
                  </a>
                </li>
                <li>
                  <a href="#security" className="text-blue-600 hover:underline">
                    Security
                  </a>
                </li>
                <li>
                  <a
                    href="#childrens-privacy"
                    className="text-blue-600 hover:underline"
                  >
                    Children&apos;s Privacy
                  </a>
                </li>
                <li>
                  <a href="#changes" className="text-blue-600 hover:underline">
                    Changes to This Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#contact-us"
                    className="text-blue-600 hover:underline"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          <div className="space-y-8 md:col-span-3">
            <section id="introduction">
              <h2 className="mb-4 text-2xl font-semibold">Introduction</h2>
              <p>
                Wadzzo is an innovative platform designed to transform the way people engage with brands through gamified experiences. Our mission is to bridge the digital and physical worlds by enabling users to explore their surroundings, discover rewards, and connect with brands in a fun, interactive way. This <strong>Privacy Policy</strong> governs how we
                collect, use, and protect the information you provide when using
                our services. Unless otherwise defined, the terms used in this
                Privacy Policy have the same meanings as in our{" "}
                <Link href="#" className="text-blue-600 hover:underline">
                  Terms and Conditions
                </Link>
                .
              </p>
            </section>

            <section id="information-we-collect">
              <h2 className="mb-4 text-2xl font-semibold">
                Information We Collect
              </h2>

              <h3 className="mb-2 mt-4 text-xl font-semibold">
                1. Information You Provide
              </h3>
              <p>
                To enhance your experience, we may collect personal information
                you provide, including:
              </p>
              <ul className="mb-4 mt-2 list-disc pl-6">
                <li>Name</li>
                <li>Email address</li>
                <li>Gender</li>
                <li>Location</li>
                <li>Profile pictures</li>
                <li>Stellar Address</li>
              </ul>
              <p>
                This information is used to deliver and improve our services. It
                is retained securely and shared only as described in this
                policy.
              </p>

              <h3 className="mb-2 mt-4 text-xl font-semibold">2. Cookies</h3>
              <p>
                Cookies are small files stored on your device, often used to
                identify users anonymously. While Wadzzo does not use cookies
                directly, third-party tools integrated into our services may use
                cookies to collect and improve data. You can manage cookie
                preferences through your browser settings. Note that refusing
                cookies may limit certain functionalities of our platform.
              </p>

              <h3 className="mb-2 mt-4 text-xl font-semibold">
                3. Device Information
              </h3>
              <p>
                We may collect non-identifiable information about your device to
                improve services and prevent fraud. Examples include:
              </p>
              <ul className="mb-4 mt-2 list-disc pl-6">
                <li>Device type</li>
                <li>Operating system</li>
                <li>App usage data</li>
              </ul>
              <p>
                This information is used solely for operational improvements and
                security.
              </p>

              <h3 className="mb-2 mt-4 text-xl font-semibold">
                4. Location Information
              </h3>
              <p>
                Some services may require access to your device&apos;s location.
                Location data is used only within the scope necessary for the
                intended service and is not shared without your consent.
              </p>
            </section>

            <section id="third-party-services">
              <h2 className="mb-4 text-2xl font-semibold">
                Third-Party Services
              </h2>
              <p>Wadzzo may engage trusted third-party providers to:</p>
              <ul className="mb-4 mt-2 list-disc pl-6">
                <li>Facilitate our services</li>
                <li>Analyze usage data</li>
                <li>Perform service-related tasks</li>
              </ul>
              <p>
                These providers are contractually obligated to protect your
                personal information and use it solely for authorized purposes.
              </p>
            </section>

            <section id="security">
              <h2 className="mb-4 text-2xl font-semibold">Security</h2>
              <p>
                We employ commercially reasonable measures to protect your
                information. However, no online or electronic storage method is
                entirely secure. While we strive for maximum protection, we
                cannot guarantee absolute security.
              </p>
            </section>

            <section id="childrens-privacy">
              <h2 className="mb-4 text-2xl font-semibold">
                Children&apos;s Privacy
              </h2>
              <p>
                Wadzzo does not target or knowingly collect personal
                information from users under the age of 13. If we learn that we
                have inadvertently collected such data, we will delete it
                promptly. Parents or guardians aware of any such cases should
                contact us immediately.
              </p>
            </section>

            <section id="changes">
              <h2 className="mb-4 text-2xl font-semibold">
                Changes to This Privacy Policy
              </h2>
              <p>
                Wadzzo may update this policy periodically. Changes will be
                communicated via updates to this document. Continued use of our
                services after such updates constitutes acceptance of the
                revised policy.
              </p>
            </section>

            <section id="contact-us">
              <h2 className="mb-4 text-2xl font-semibold">Contact Us</h2>
              <p>
                If you have any questions or concerns about this Privacy Policy,
                please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:support@Wadzzo.com"
                  className="text-blue-600 hover:underline"
                >
                  support@wadzzo.com
                </a>
                <br />
                <strong>Website:</strong>{" "}
                <a
                  href="https://app.wadzzo.com"
                  className="text-blue-600 hover:underline"
                >
                  app.wadzzo.com
                </a>
              </p>
              <p className="mt-4">
                Thank you for trusting Wadzzo. Together, we&apos;re empowering
                bands and redefining music experiences on the Stellar
                blockchain.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}