import { env } from "~/env";

const PrivacyPage = () => {
  return (
    <>
      <div className="">
        <div className="container mx-auto p-8">
          <h1 className="mb-4 text-center text-3xl font-bold">
            Our commitment to protecting your privacy
          </h1>

          <p className="mb-4 text-center">
            Learn more about how {env.NEXT_PUBLIC_SITE} collects and uses data
            and your rights as a {env.NEXT_PUBLIC_SITE} user.
          </p>

          <p className="mb-2  font-bold">UPDATED MARCH 12, 2024</p>
          <h2 className="mb-2 text-2xl font-bold">Introduction</h2>
          <p className="mb-4">
            Our privacy policy will help you understand what information we
            collect at {env.NEXT_PUBLIC_SITE}.com, how {env.NEXT_PUBLIC_SITE}
            .com uses it, and what choices you have. {env.NEXT_PUBLIC_SITE}.io
            built the {env.NEXT_PUBLIC_SITE}.io website as a free app. This
            SERVICE is provided by {env.NEXT_PUBLIC_SITE}.com at no cost and is
            intended for use as is. If you choose to use our Service, then you
            agree to the collection and use of information in relation with this
            policy. The Personal Information that we collect are used for
            providing and improving the Service. We will not use or share your
            information with anyone except as described in this Privacy Policy.
            The terms used in this Privacy Policy have the same meanings as in
            our Terms and Conditions, which is accessible in our website, unless
            otherwise defined in this Privacy Policy.
          </p>

          <h2 className="mb-2 text-2xl font-bold">Information You Provide</h2>

          <table className="min-w-full p-4 text-left text-sm font-light">
            <thead className="">
              <tr>
                <th scope="col" className="px-6 py-4">
                  Category
                </th>
                <th scope="col" className="px-6 py-4">
                  Information
                </th>
              </tr>
            </thead>
            <tbody className="">
              <tr className="border-b border-neutral-200 dark:border-white/10">
                <td className="px-6 py-4 font-medium md:whitespace-nowrap">
                  Information Collection and Use
                </td>
                <td className=" px-6 py-4">
                  For a better experience while using our Service, we may
                  require you to provide us with certain personally identifiable
                  information, including but not limited to users name, email
                  address, gender, location, pictures. The information that we
                  request will be retained by us and used as described in this
                  privacy policy. The app does use third party services that may
                  collect information used to identify you.
                </td>
              </tr>
              <tr className="border-b border-neutral-200 dark:border-white/10">
                <td className="px-6 py-4 font-medium">Cookies</td>

                <td className=" px-6 py-4">
                  Cookies are files with small amount of data that is commonly
                  used an anonymous unique identifier. These are sent to your
                  browser from the website that you visit and are stored on your
                  devices’s internal memory. This Services does not uses these
                  “cookies” explicitly. However, the app may use third party
                  code and libraries that use “cookies” to collection
                  information and to improve their services. You have the option
                  to either accept or refuse these cookies, and know when a
                  cookie is being sent to your device. If you choose to refuse
                  our cookies, you may not be able to use some portions of this
                  Service.
                </td>
              </tr>

              <tr className="border-b border-neutral-200 dark:border-white/10">
                <td className=" px-6 py-4 font-medium">Device Information</td>
                <td className=" px-6 py-4">
                  We collect information from your device in some cases. The
                  information will be utilized for the provision of better
                  service and to prevent fraudulent acts. Additionally, such
                  information will not include that which will identify the
                  individual user.
                </td>
              </tr>
              <tr className="border-b border-neutral-200 dark:border-white/10">
                <td className=" px-6 py-4 font-medium">Location Information</td>
                <td className=" px-6 py-4">
                  {" "}
                  Some of the services may use location information transmitted
                  from user{"'"}s mobile phones. We only use this information
                  within the scope necessary for the designated service.
                </td>
              </tr>
              <tr className="border-b border-neutral-200 dark:border-white/10">
                <td className=" px-6 py-4 font-medium">Service Providers</td>
                <td className=" px-6 py-4">
                  We may employ third-party companies and individuals due to the
                  following reasons:
                  <ul className="mb-4 list-inside list-disc">
                    <li>To facilitate our Service;</li>
                    <li>To provide the Service on our behalf;</li>
                    <li>To perform Service-related services;</li>
                    <li>To assist us in analyzing how our Service is used.</li>
                  </ul>
                  We want to inform users of this Service that these third
                  parties have access to your Personal Information. The reason
                  is to perform the tasks assigned to them on our behalf.
                  However, they are obligated not to disclose or use the
                  information for any other purpose.
                </td>
              </tr>
              <tr className="border-b border-neutral-200 dark:border-white/10">
                <td className=" px-6 py-4 font-medium">Security</td>
                <td className=" px-6 py-4">
                  We value your trust in providing us your Personal Information,
                  thus we are striving to use commercially acceptable means of
                  protecting it. But remember that no method of transmission
                  over the internet, or method of electronic storage is 100%
                  secure and reliable, and we cannot guarantee its absolute
                  security.
                </td>
              </tr>
              <tr className="border-b border-neutral-200 dark:border-white/10">
                <td className=" px-6 py-4 font-medium">Children’s Privacy</td>
                <td className=" px-6 py-4">
                  This Services do not address anyone under the age of 13. We do
                  not knowingly collect personal identifiable information from
                  children under 13. In the case we discover that a child under
                  13 has provided us with personal information, we immediately
                  delete this from our servers. If you are a parent or guardian
                  and you are aware that your child has provided us with
                  personal information, please contact us so that we will be
                  able to do necessary actions.
                </td>
              </tr>
              <tr className="border-b border-neutral-200 dark:border-white/10">
                <td className=" px-6 py-4 font-medium">
                  Changes to This Privacy Policy
                </td>
                <td className=" px-6 py-4">
                  {" "}
                  Some of the services may use location information transmitted
                  from user{"'"}s mobile phones. We only use this information
                  within the scope necessary for the designated service.
                </td>
              </tr>
              <tr className="border-b border-neutral-200 dark:border-white/10">
                <td className=" px-6 py-4 font-medium">Location Information</td>
                <td className=" px-6 py-4">
                  We may update our Privacy Policy from time to time. Thus, you
                  are advised to review this page periodically for any changes.
                  We will notify you of any changes by posting the new Privacy
                  Policy on this page. These changes are effective immediately,
                  after they are posted on this page.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default PrivacyPage;
