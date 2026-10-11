import type { Metadata } from "next";
import type { ReactNode } from "react";

import { StaticHeader } from "~/components/static/static-header";
import { PageBody } from "~/ui/page-header";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What information Wadzzo collects, how it is used, and the rights you have as a user.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  { id: "introduction", title: "Introduction" },
  { id: "information-we-collect", title: "Information We Collect" },
  { id: "third-party-services", title: "Third-Party Services" },
  { id: "security", title: "Security" },
  { id: "childrens-privacy", title: "Children's Privacy" },
  { id: "changes", title: "Changes to This Privacy Policy" },
  { id: "contact-us", title: "Contact Us" },
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="font-hud text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

const h3 = "mt-4 font-hud text-lg font-semibold";
const list = "list-disc space-y-1 pl-6";

/** The policy text is kept word-for-word from the previous app; only the layout changed. */
export default function PrivacyPage() {
  return (
    <PageBody wide className="space-y-8">
      <StaticHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description={
          <>
            <span className="block text-sm">Effective Date: March 12, 2024</span>
            <span className="mt-2 block">
              At Wadzzo, your privacy is our priority. This policy explains what information we collect, how it is used, and the rights you have as a user. By using Wadzzo&apos;s services, you agree to the collection and use of your data as outlined here.
            </span>
          </>
        }
      />
      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav aria-label="Table of contents" className="lg:sticky lg:top-24 lg:self-start">
          <div className="glass space-y-2 rounded-2xl p-4">
            <h2 className="label-caps">Table of Contents</h2>
            <ul className="space-y-1.5 text-sm">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-muted-foreground transition-colors hover:text-primary">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <article className="glass space-y-10 rounded-2xl p-6 leading-relaxed text-foreground/90 sm:p-8">
          <Section id="introduction" title="Introduction">
            <p>
              Wadzzo is an innovative platform designed to transform the way people engage with brands through gamified experiences. Our mission is to bridge the digital and physical worlds by enabling users to explore their surroundings, discover rewards, and connect with brands in a fun, interactive way. This <strong>Privacy Policy</strong> governs how we collect, use, and protect the information you provide when using our services. Unless otherwise defined, the terms used in this Privacy Policy have the same meanings as in our Terms and Conditions.
            </p>
          </Section>

          <Section id="information-we-collect" title="Information We Collect">
            <h3 className={h3}>1. Information You Provide</h3>
            <p>To enhance your experience, we may collect personal information you provide, including:</p>
            <ul className={list}>
              <li>Name</li>
              <li>Email address</li>
              <li>Gender</li>
              <li>Location</li>
              <li>Profile pictures</li>
              <li>Stellar Address</li>
            </ul>
            <p>This information is used to deliver and improve our services. It is retained securely and shared only as described in this policy.</p>

            <h3 className={h3}>2. Cookies</h3>
            <p>
              Cookies are small files stored on your device, often used to identify users anonymously. While Wadzzo does not use cookies directly, third-party tools integrated into our services may use cookies to collect and improve data. You can manage cookie preferences through your browser settings. Note that refusing cookies may limit certain functionalities of our platform.
            </p>

            <h3 className={h3}>3. Device Information</h3>
            <p>We may collect non-identifiable information about your device to improve services and prevent fraud. Examples include:</p>
            <ul className={list}>
              <li>Device type</li>
              <li>Operating system</li>
              <li>App usage data</li>
            </ul>
            <p>This information is used solely for operational improvements and security.</p>

            <h3 className={h3}>4. Location Information</h3>
            <p>Some services may require access to your device&apos;s location. Location data is used only within the scope necessary for the intended service and is not shared without your consent.</p>
          </Section>

          <Section id="third-party-services" title="Third-Party Services">
            <p>Wadzzo may engage trusted third-party providers to:</p>
            <ul className={list}>
              <li>Facilitate our services</li>
              <li>Analyze usage data</li>
              <li>Perform service-related tasks</li>
            </ul>
            <p>These providers are contractually obligated to protect your personal information and use it solely for authorized purposes.</p>
          </Section>

          <Section id="security" title="Security">
            <p>We employ commercially reasonable measures to protect your information. However, no online or electronic storage method is entirely secure. While we strive for maximum protection, we cannot guarantee absolute security.</p>
          </Section>

          <Section id="childrens-privacy" title="Children's Privacy">
            <p>
              Wadzzo does not target or knowingly collect personal information from users under the age of 13. If we learn that we have inadvertently collected such data, we will delete it promptly. Parents or guardians aware of any such cases should contact us immediately.
            </p>
          </Section>

          <Section id="changes" title="Changes to This Privacy Policy">
            <p>Wadzzo may update this policy periodically. Changes will be communicated via updates to this document. Continued use of our services after such updates constitutes acceptance of the revised policy.</p>
          </Section>

          <Section id="contact-us" title="Contact Us">
            <p>If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:support@Wadzzo.com" className="text-primary hover:underline">
                support@wadzzo.com
              </a>
              <br />
              <strong>Website:</strong>{" "}
              <a href="https://app.wadzzo.com" className="text-primary hover:underline">
                app.wadzzo.com
              </a>
            </p>
            <p>Thank you for trusting Wadzzo. Together, we&apos;re empowering bands and redefining music experiences on the Stellar blockchain.</p>
          </Section>
        </article>
      </div>
    </PageBody>
  );
}
