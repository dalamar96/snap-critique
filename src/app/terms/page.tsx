import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Conditions of Use | Snap Critique',
  description: 'Conditions of use and terms of service for Snap Critique.',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 md:py-20 px-6">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-8">
        Conditions of Use
      </h1>
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Welcome to Snap Critique. Beach Breeze Studios and/or its affiliates (&quot;Snap Critique&quot;) provide website features and other products and services to you when you visit or shop at Snap Critique, use Snap Critique products or services, use Snap Critique applications for mobile, or use software provided by Snap Critique in connection with any of the foregoing (collectively, &quot;Snap Critique Services&quot;). Snap Critique provides the Snap Critique Services subject to the following conditions.
        </p>

        <p className="font-bold mt-6">
            By using Snap Critique Services, you agree to these conditions. Please read them carefully.
        </p>

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          PRIVACY
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Please review our <Link href="/privacy" className="text-primary hover:underline">Privacy Notice</Link>, which also governs your use of Snap Critique Services, to understand our practices.
        </p>

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          ELECTRONIC COMMUNICATIONS
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          When you use Snap Critique Services, or send e-mails, text messages, and other communications from your desktop or mobile device to us, you may be communicating with us electronically. You consent to receive communications from us electronically, such as e-mails, texts, mobile push notices, or notices and messages on this site or through the other Snap Critique Services, such as our Message Center, and you can retain copies of these communications for your records. You agree that all agreements, notices, disclosures, and other communications that we provide to you electronically satisfy any legal requirement that such communications be in writing.
        </p>

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          COPYRIGHT
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          All content included in or made available through any Snap Critique Service, such as text, graphics, logos, button icons, images, audio clips, digital downloads, data compilations, and software is the property of Snap Critique or its content suppliers and protected by United States and international copyright laws. The compilation of all content included in or made available through any Snap Critique Service is the exclusive property of Snap Critique and protected by U.S. and international copyright laws.
        </p>

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          LICENSE AND ACCESS
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Subject to your compliance with these Conditions of Use and any Service Terms, and your payment of any applicable fees, Snap Critique or its content providers grant you a limited, non-exclusive, non-transferable, non-sublicensable license to access and make personal and non-commercial use of the Snap Critique Services. This license does not include any resale or commercial use of any Snap Critique Service, or its contents; any collection and use of any product listings, descriptions, or prices; any derivative use of any Snap Critique Service or its contents; any downloading, copying, or other use of account information for the benefit of any third party; or any use of data mining, robots, or similar data gathering and extraction tools. All rights not expressly granted to you in these Conditions of Use or any Service Terms are reserved and retained by Snap Critique or its licensors, suppliers, publishers, rightsholders, or other content providers. No Snap Critique Service, nor any part of any Snap Critique Service, may be reproduced, duplicated, copied, sold, resold, visited, or otherwise exploited for any commercial purpose without express written consent of Snap Critique. You may not frame or utilize framing techniques to enclose any trademark, logo, or other proprietary information (including images, text, page layout, or form) of Snap Critique without express written consent. You may not use any meta tags or any other &quot;hidden text&quot; utilizing Snap Critique&apos;s name or trademarks without the express written consent of Snap Critique. You may not misuse the Snap Critique Services. You may use the Snap Critique Services only as permitted by law. The licenses granted by Snap Critique terminate if you do not comply with these Conditions of Use or any Service Terms.
        </p>

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          YOUR ACCOUNT
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          You may need your own Snap Critique account to use certain Snap Critique Services, and you may be required to be logged in to the account and have a valid payment method associated with it. If there is a problem charging your selected payment method, we may charge any other valid payment method associated with your account. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your account, and you agree to accept responsibility for all activities that occur under your account or password. Snap Critique does sell products for children, but it sells them to adults, who can purchase with a credit card or other permitted payment method. If you are under 18, you may use the Snap Critique Services only with involvement of a parent or guardian. Snap Critique reserves the right to refuse service, terminate accounts, terminate your rights to use Snap Critique Services, remove or edit content, or cancel orders in its sole discretion.
        </p>

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          REVIEWS, COMMENTS, COMMUNICATIONS, AND OTHER CONTENT
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          You may post reviews, comments, photos, videos, and other content; send e-cards and other communications; and submit suggestions, ideas, comments, questions, or other information, so long as the content is not illegal, obscene, threatening, defamatory, invasive of privacy, infringing of intellectual property rights (including publicity rights), or otherwise injurious to third parties or objectionable, and does not consist of or contain software viruses, political campaigning, commercial solicitation, chain letters, mass mailings, or any form of &quot;spam&quot; or unsolicited commercial electronic messages. You may not use a false e-mail address, impersonate any person or entity, or otherwise mislead as to the origin of a card or other content. Snap Critique reserves the right (but not the obligation) to remove or edit such content, but does not regularly review posted content.
        </p>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          If you do post content or submit material, and unless we indicate otherwise, you grant Snap Critique a nonexclusive, royalty-free, perpetual, irrevocable, and fully sublicensable right to use, reproduce, modify, adapt, publish, perform, translate, create derivative works from, distribute, and display such content throughout the world in any media. You grant Snap Critique and sublicensees the right to use the name that you submit in connection with such content, if they choose. You represent and warrant that you own or otherwise control all of the rights to the content that you post; that the content is accurate; that use of the content you supply does not violate this policy and will not cause injury to any person or entity; and that you will indemnify Snap Critique for all claims resulting from content you supply. Snap Critique has the right but not the obligation to monitor and edit or remove any activity or content. Snap Critique takes no responsibility and assumes no liability for any content posted by you or any third party.
        </p>

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          DISCLAIMER OF WARRANTIES AND LIMITATION OF LIABILITY
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6 uppercase font-bold">
          THE SNAP CRITIQUE SERVICES AND ALL INFORMATION, CONTENT, MATERIALS, PRODUCTS (INCLUDING SOFTWARE) AND OTHER SERVICES INCLUDED ON OR OTHERWISE MADE AVAILABLE TO YOU THROUGH THE SNAP CRITIQUE SERVICES ARE PROVIDED BY SNAP CRITIQUE ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS, UNLESS OTHERWISE SPECIFIED IN WRITING. SNAP CRITIQUE MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THE SNAP CRITIQUE SERVICES, OR THE INFORMATION, CONTENT, MATERIALS, PRODUCTS (INCLUDING SOFTWARE) OR OTHER SERVICES INCLUDED ON OR OTHERWISE MADE AVAILABLE TO YOU THROUGH THE SNAP CRITIQUE SERVICES, UNLESS OTHERWISE SPECIFIED IN WRITING. YOU EXPRESSLY AGREE THAT YOUR USE OF THE SNAP CRITIQUE SERVICES IS AT YOUR SOLE RISK.
        </p>
        <p className="leading-7 [&:not(:first-child)]:mt-6 uppercase font-bold">
          TO THE FULL EXTENT PERMISSIBLE BY LAW, SNAP CRITIQUE DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. SNAP CRITIQUE DOES NOT WARRANT THAT THE SNAP CRITIQUE SERVICES, INFORMATION, CONTENT, MATERIALS, PRODUCTS (INCLUDING SOFTWARE) OR OTHER SERVICES INCLUDED ON OR OTHERWISE MADE AVAILABLE TO YOU THROUGH THE SNAP CRITIQUE SERVICES, SNAP CRITIQUE&apos;S SERVERS OR ELECTRONIC COMMUNICATIONS SENT FROM SNAP CRITIQUE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. TO THE FULL EXTENT PERMISSIBLE BY LAW, SNAP CRITIQUE WILL NOT BE LIABLE FOR ANY DAMAGES OF ANY KIND ARISING FROM THE USE OF ANY SNAP CRITIQUE SERVICE, OR FROM ANY INFORMATION, CONTENT, MATERIALS, PRODUCTS (INCLUDING SOFTWARE) OR OTHER SERVICES INCLUDED ON OR OTHERWISE MADE AVAILABLE TO YOU THROUGH ANY SNAP CRITIQUE SERVICE, INCLUDING, BUT NOT LIMITED TO DIRECT, INDIRECT, INCIDENTAL, PUNITIVE, AND CONSEQUENTIAL DAMAGES, UNLESS OTHERWISE SPECIFIED IN WRITING.
        </p>

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          DISPUTES
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Any dispute or claim relating in any way to your use of any Snap Critique Service will be adjudicated in the state or Federal courts in the local jurisdiction, and you consent to exclusive jurisdiction and venue in these courts. We each waive any right to a jury trial.
        </p>

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          APPLICABLE LAW
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          By using any Snap Critique Service, you agree that applicable federal law, and the laws of the state of local jurisdiction, without regard to principles of conflict of laws, will govern these Conditions of Use and any dispute of any sort that might arise between you and Snap Critique.
        </p>

        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          SITE POLICIES, MODIFICATION, AND SEVERABILITY
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Please review our other policies, such as our Privacy Notice, posted on this site. These policies also govern your use of Snap Critique Services. We reserve the right to make changes to our site, policies, Service Terms, and these Conditions of Use at any time. If any of these conditions shall be deemed invalid, void, or for any reason unenforceable, that condition shall be deemed severable and shall not affect the validity and enforceability of any remaining condition.
        </p>

         <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10">
          OUR ADDRESS
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Snap Critique<br />
          Beach Breeze Studios
        </p>
      </div>
    </div>
  )
}
