import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Notice | Snap Critique',
  description: 'Privacy Notice for Snap Critique.',
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 md:py-20 px-6">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-8">
        Privacy Notice
      </h1>
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Snap Critique knows that you care how information about you is used and shared, and we appreciate your trust that we will do so carefully and sensibly. This notice describes our privacy policy. <strong>By visiting Snap Critique, you are accepting the practices described in this Privacy Notice.</strong>
        </p>

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          What Personal Information About Customers Does Snap Critique Collect?
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          We collect your personal information in order to provide and continually improve our products and services.
        </p>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Here are the types of personal information we collect:
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>Information You Give Us:</strong> We receive and store any information you provide in relation to Snap Critique Services. You can choose not to provide certain information, but then you might not be able to take advantage of many of our Snap Critique Services.</li>
            <li><strong>Automatic Information:</strong> We automatically collect and store certain types of information about your use of Snap Critique Services, including information about your interaction with content and services available through Snap Critique Services. Like many websites, we use "cookies" and other unique identifiers, and we obtain certain types of information when your web browser or device accesses Snap Critique Services.</li>
             <li><strong>Information from Other Sources:</strong> We might receive information about you from other sources, such as updated delivery and address information from our carriers, which we use to correct our records and deliver your next purchase more easily.</li>
        </ul>

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          For What Purposes Does Snap Critique Use Your Personal Information?
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          We use your personal information to operate, provide, develop, and improve the products and services that we offer our customers. These purposes include:
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>Purchase and delivery of products and services.</strong> We use your personal information to take and handle orders, deliver products and services, process payments, and communicate with you about orders, products and services, and promotional offers.</li>
            <li><strong>Provide, troubleshoot, and improve Snap Critique Services.</strong> We use your personal information to provide functionality, analyze performance, fix errors, and improve the usability and effectiveness of the Snap Critique Services.</li>
            <li><strong>Recommendations and personalization.</strong> We use your personal information to recommend features, products, and services that might be of interest to you, identify, your preferences, and personalize your experience with Snap Critique Services.</li>
            <li><strong>Comply with legal obligations.</strong> In certain cases, we collect and use your personal information to comply with laws.</li>
            <li><strong>Communicate with you.</strong> We use your personal information to communicate with you in relation to Snap Critique Services via different channels (e.g., by phone, e-mail, chat).</li>
            <li><strong>Advertising.</strong> We may use your personal information to display interest-based ads for features, products, and services that might be of interest to you. We do not use information that personally identifies you to display interest-based ads.</li>
            <li><strong>Fraud Prevention and Credit Risks.</strong> We use personal information to prevent and detect fraud and abuse in order to protect the security of our customers, Snap Critique, and others. We may also use scoring methods to assess and manage credit risks.</li>
        </ul >

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          Does Snap Critique Share Your Personal Information?
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Information about our customers is an important part of our business, and we are not in the business of selling our customers' personal information to others. We share customers' personal information only as described below and with subsidiaries Beach Breeze Studios controls that either are subject to this Privacy Notice or follow practices at least as protective as those described in this Privacy Notice.
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
             <li><strong>Third-Party Service Providers:</strong> We employ other companies and individuals to perform functions on our behalf. Examples include fulfilling orders for products or services, delivering packages, sending postal mail and e-mail, removing repetitive information from customer lists, analyzing data, providing marketing assistance, providing search results and links (including paid listings and links), processing payments, transmitting content, scoring, assessing and managing credit risk, and providing customer service. These third-party service providers have access to personal information needed to perform their functions, but may not use it for other purposes.</li>
            <li><strong>Business Transfers:</strong> As we continue to develop our business, we might sell or buy other businesses or services. In such transactions, customer information generally is one of the transferred business assets but remains subject to the promises made in any pre-existing Privacy Notice (unless, of course, the customer consents otherwise). Also, in the unlikely event that Snap Critique or substantially all of its assets are acquired, customer information will of course be one of the transferred assets.</li>
            <li><strong>Protection of Snap Critique and Others:</strong> We release account and other personal information when we believe release is appropriate to comply with the law; enforce or apply our <Link href="/terms" className="text-primary hover:underline">Conditions of Use</Link> and other agreements; or protect the rights, property, or safety of Snap Critique, our users, or others. This includes exchanging information with other companies and organizations for fraud protection and credit risk reduction.</li>
        </ul>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
             Other than as set out above, you will receive notice when personal information about you might be shared with third parties, and you will have an opportunity to choose not to share the information.
        </p>

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          How Secure Is Information About Me?
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          We design our systems with your security and privacy in mind.
        </p>
         <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>We work to protect the security of your personal information during transmission by using encryption protocols and software.</li>
            <li>We follow the Payment Card Industry Data Security Standard (PCI DSS) when handling credit card data.</li>
            <li>We maintain physical, electronic, and procedural safeguards in connection with the collection, storage, and disclosure of personal customer information. Our security procedures mean that we may occasionally request proof of identity before we disclose personal information to you.</li>
             <li>It is important for you to protect against unauthorized access to your password and to your computer. Be sure to sign off when finished using a shared computer.</li>
        </ul>

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          What Choices Do I have?
        </h2>
         <p className="leading-7 [&:not(:first-child)]:mt-6">
            If you have any questions as to how we collect and use your personal information, please contact our Customer Service. Many of our Snap Critique Services also include settings that provide you with options as to how your information is being used.
         </p>
         <ul className="list-disc pl-6 mt-4 space-y-2">
             <li>As described above, you can always choose not to provide certain information, but then you might not be able to take advantage of many of the Snap Critique Services.</li>
             <li>You can add or update certain information on pages such as those referenced in the Help sections. When you update information, we usually keep a copy of the prior version for our records.</li>
             <li>If you do not want to receive e-mail or other communications from us, please adjust your Customer Communication Preferences. If you don't want to receive in-app notifications from us, please adjust your notification settings in the app or device.</li>
             <li>The Help feature on most browsers and devices will tell you how to prevent your browser or device from accepting new cookies or other identifiers, how to have the browser notify you when you receive a new cookie, or how to block cookies altogether. Because cookies and identifiers allow you to take advantage of some essential features of Snap Critique Services, we recommend that you leave them turned on.</li>
         </ul>

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          Conditions of Use, Notices, and Revisions
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          If you choose to use Snap Critique Services, your use and any dispute over privacy is subject to this Notice and our <Link href="/terms" className="text-primary hover:underline">Conditions of Use</Link>, including limitations on damages, resolution of disputes, and application of the law of the local jurisdiction. If you have any concern about privacy at Snap Critique, please contact us with a thorough description, and we will try to resolve it. Our business changes constantly, and our Privacy Notice will change also. You should check our Web site frequently to see recent changes. Unless stated otherwise, our current Privacy Notice applies to all information that we have about you and your account. We stand behind the promises we make, however, and will never materially change our policies and practices to make them less protective of customer information collected in the past without the consent of affected customers.
        </p>

      </div>
    </div>
  )
}
