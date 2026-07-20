import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions — Avatar India",
  description: "Terms governing your use of the Avatar India AI learning platform.",
};

/* ── Shared typography helpers ── */
const H2 = "text-xl font-bold text-slate-900 mb-4 pb-3 border-b border-slate-200/80";
const BODY = "text-[14px] text-slate-600 leading-relaxed space-y-3 font-normal";
const STRONG = "font-semibold text-slate-900";

export default function TermsConditionPage() {
  return (
    <>
      {/* ── Page Hero ── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-4">
          <Link href="/" className="hover:text-brand-600 transition-colors duration-200">Home</Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">Terms &amp; Conditions</span>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 mb-2">
          Legal Framework
        </p>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Terms &amp; Conditions
        </h1>
        <p className="text-slate-500 text-[14px]">
          Please read these terms carefully before using the Avatar India platform.
        </p>
      </div>

      {/* ── Meta card ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 mb-6 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {[
            { label: "Website", value: "www.avatarindia.com", href: "https://www.avatarindia.com" },
            { label: "Platform", value: "Avatar AI Marketplace" },
            { label: "Entity", value: "Avatar Industries Limited" },
            { label: "Version", value: "1.0" },
            { label: "Effective Date", value: "June 12, 2026" },
            { label: "Last Updated", value: "—" },
          ].map(({ label, value, href }) => (
            <div key={label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
              {href ? (
                <Link href={href} className="text-[13px] font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                  {value}
                </Link>
              ) : (
                <p className="text-[13px] font-semibold text-slate-800">{value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Content card ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="p-6 sm:p-10 space-y-10">

          {/* 1 */}
          <section>
            <h2 className={H2}>1. Introduction and Acceptance</h2>
            <div className={BODY}>
              <p>These Terms &amp; Conditions (&quot;Terms&quot;) constitute a legally binding agreement between Avatar Industries Limited, together with its affiliates, successors, and permitted assigns (&quot;Avatar,&quot; &quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), and any person or entity accessing or using the Avatar AI Marketplace through www.avatarindia.com, any subdomain, mobile site, mobile application, dashboard, API, communication channel, or related digital interface (collectively, the &quot;Platform&quot;).</p>
              <p>The Platform is designed as India&apos;s AI marketplace ecosystem combining an AI tools marketplace, AI education offerings, AI services, community features, and related digital products and services.</p>
              <p>By accessing, browsing, registering on, listing on, purchasing from, enrolling through, subscribing to, or otherwise using the Platform, you acknowledge that you have read, understood, and agreed to be bound by these Terms, the separate Privacy Policy, and all supplemental rules, guidelines, schedules, notices, and operational policies published by Avatar from time to time.</p>
              <p>If you do not agree to these Terms, you must not access or use the Platform.</p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className={H2}>2. Definitions</h2>
            <div className={BODY}>
              <p>For the purposes of these Terms:</p>
              <p><span className={STRONG}>&quot;Buyer&quot;</span> means a user who purchases, licenses, subscribes to, enrolls in, books, or otherwise acquires access to any tool, course, webinar, service, template, dataset, API, automation, or other offering made available through the Platform.</p>
              <p><span className={STRONG}>&quot;Seller&quot;</span> means an individual or business user who lists or offers AI tools, automations, templates, agents, APIs, scripts, datasets, mini-SaaS products, or other digital offerings through the Platform.</p>
              <p><span className={STRONG}>&quot;Instructor&quot;</span> means an individual educator or trainer who offers courses, bootcamps, live classes, workshops, educational materials, or related content through the Platform.</p>
              <p><span className={STRONG}>&quot;Partner&quot;</span> means any company, institution, organization, or other entity collaborating with Avatar in relation to licensed content, co-branded courses, affiliate listings, enterprise offerings, events, or other marketplace arrangements.</p>
              <p><span className={STRONG}>&quot;Service Provider&quot;</span> or <span className={STRONG}>&quot;Freelancer&quot;</span> means a user offering consulting, implementation, automation, AI agent building, or other services through the Platform&apos;s services layer.</p>
              <p><span className={STRONG}>&quot;Content&quot;</span> means text, graphics, logos, code, datasets, prompts, videos, documents, listings, descriptions, screenshots, audio, images, reviews, ratings, comments, messages, and all other materials made available on or through the Platform.</p>
              <p><span className={STRONG}>&quot;User&quot;</span> means any visitor, registered member, Buyer, Seller, Instructor, Partner, Service Provider, attendee, or other person accessing or using the Platform.</p>
              <p><span className={STRONG}>&quot;Transaction&quot;</span> means any purchase, sale, enrollment, booking, subscription, payment, refund, payout, or related commercial event conducted or initiated through the Platform.</p>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className={H2}>3. Nature of the Platform and Avatar&apos;s Role</h2>
            <div className={BODY}>
              <p>Avatar operates the Platform as a technology-enabled intermediary marketplace and ecosystem that facilitates discovery, listing, onboarding, payments, subscriptions, access management, educational participation, community engagement, and related interactions among users.</p>
              <p>Avatar&apos;s business overview expressly states that the Platform acts as an intermediary connecting sellers and buyers and is not the creator of third-party tools or courses listed by vendors and education partners.</p>
              <p>Accordingly, unless expressly identified otherwise, Avatar does not manufacture, create, own, control, test, certify, guarantee, or endorse third-party offerings listed or provided by Sellers, Instructors, Partners, or Service Providers.</p>
              <p>Avatar may, however, independently create, host, own, license, market, and deliver certain first-party offerings, including Avatar-hosted webinars, proprietary content, certificates, and future Avatar-branded SaaS or bundled services, in which case Avatar acts as the direct provider.</p>
              <p>Avatar may rely on statutory intermediary protections where applicable, including the principle that an intermediary is not liable for third-party information hosted by it subject to legal conditions and due diligence.</p>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className={H2}>4. Eligibility and Capacity</h2>
            <div className={BODY}>
              <p>You may use the Platform only if you are legally competent to enter into a binding contract under applicable law. If you use the Platform on behalf of a company, LLP, partnership, sole proprietorship, educational institution, trust, or other legal entity, you represent and warrant that you are duly authorized to bind such entity to these Terms.</p>
              <p>The business overview provides that individual sellers must be at least 18 years old and complete applicable verification requirements before listings go live.</p>
              <p>Avatar may refuse access, registration, onboarding, or continued use to any person or entity that fails to meet legal, policy, verification, compliance, risk, or quality requirements.</p>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className={H2}>5. User Accounts and Verification</h2>
            <div className={BODY}>
              <p>Certain features of the Platform require account creation, login credentials, OTP verification, profile completion, or role-specific onboarding. Avatar may require email verification, mobile verification, KYC, tax details, banking information, business registration information, and supporting documentation depending on the nature of the account.</p>
              <p>The user acting in their personal capacity as individual seller, service provider or instructor are required to submit the documents that establish both their identity and business activity, documents such as Udyam Registration Certificate, Shop and Establishment License, professional certificates demonstrating expertise and any other statutory documents or records required by Avatar.</p>
              <p>While the user registering as Business Entities, in form of a company, partnership or other business form, must provide documents applicable to their specific legal form such as Certificate of Incorporation, Partnership Deed, Entity PAN, GST registration certificates, and any other statutory or tax-related records required by Avatar.</p>
              <p>You agree to provide accurate, complete, and updated information and to maintain the confidentiality of login credentials. You are responsible for all acts and omissions occurring through your account, whether or not authorized by you, unless caused solely by Avatar&apos;s proven failure to maintain reasonable platform security.</p>
              <p>Avatar may suspend, restrict, or terminate any account found to contain false information, unauthorized use, deceptive identity claims, or incomplete compliance documents.</p>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className={H2}>6. User Categories and Role-Specific Obligations</h2>
            <div className={BODY}>
              <p>The Platform may support different categories of users, including visitors, Buyers, Sellers, Instructors, Partners, Service Providers, enterprise clients, webinar attendees, and community participants.</p>
              <p>Avatar may impose different contractual, commercial, onboarding, tax, content, quality, technical, moderation, payout, reporting, and support obligations depending on the user&apos;s role, risk profile, or transaction type.</p>
              <p>Any additional role-specific policy, commercial schedule, order form, statement of work, onboarding document, or platform notice shall be read together with these Terms. In case of conflict, the more specific signed or role-specific document shall prevail to the extent of the inconsistency.</p>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className={H2}>7. Platform Services and Permitted Use</h2>
            <div className={BODY}>
              <p>The Platform may include one or more of the following services and features:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Listing and sale of AI tools, automations, prompt packs, agents, APIs, scripts, mini-SaaS tools, templates, and datasets.</li>
                <li>Listing and delivery of self-paced courses, live online classes, mini-courses, bootcamps, and partner company educational programs.</li>
                <li>Avatar-hosted live webinars, workshops, sessions, events, certificates, and recordings.</li>
                <li>Freelancer or service-based engagement opportunities involving AI consulting, automation, and related project work.</li>
                <li>Community participation, messaging, reviews, ratings, discussion forums, dashboards, analytics, and recommendation features.</li>
              </ul>
              <p>Users may use the Platform solely for lawful business, learning, professional, and consumer purposes contemplated by the Platform architecture. Any use outside such scope, including illegal exploitation, data theft, impersonation, malware propagation, deceptive resale, or regulatory evasion, is prohibited.</p>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className={H2}>8. Prohibited Conduct</h2>
            <div className={BODY}>
              <p>You shall not, directly or indirectly:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Violate any applicable law, regulation, order, or third-party right.</li>
                <li>List, upload, publish, transmit, sell, promote, or distribute infringing, illegal, deceptive, unsafe, harmful, defamatory, fraudulent, obscene, or unauthorized content.</li>
                <li>Upload or distribute malware, spyware, ransomware, botnets, backdoors, unauthorized scrapers, destructive code, hidden payloads, or tools designed primarily for unlawful surveillance, credential theft, or cyber abuse.</li>
                <li>Misrepresent the ownership, source, features, pricing, quality, compliance status, certification, endorsements, or capabilities of any offering.</li>
                <li>Circumvent Platform fees, commissions, payment rails, subscription controls, access restrictions, verification systems, dispute systems, or moderation tools.</li>
                <li>Reverse engineer, scrape, reproduce, mirror, frame, or systematically extract Platform data except as permitted by law or written consent.</li>
                <li>Interfere with Platform performance, security, uptime, availability, or infrastructure.</li>
                <li>Use the Platform to harass, threaten, extort, spam, phish, or impersonate any person.</li>
                <li>Submit false disputes, abusive takedown notices, fake reviews, fabricated evidence, or fraudulent refund claims.</li>
              </ul>
              <p>The business overview expressly prohibits sellers from listing tools that violate copyright, contain malware, or produce illegal outputs.</p>
              <p>Indian e-commerce rules also expect marketplace entities to avoid unfair trade practices and maintain transparent dealings with consumers.</p>
            </div>
          </section>

          {/* 9 */}
          <section>
            <h2 className={H2}>9. Listing Standards and Approval Rights</h2>
            <div className={BODY}>
              <p>All marketplace listings are subject to Avatar&apos;s onboarding, review, compliance, editorial, legal, technical, and quality checks. Avatar may require mandatory listing fields such as title, detailed description, category, tags, screenshots, demo video, usage guide, pricing model, and ownership declaration before a listing is published.</p>
              <p>The business overview contemplates a standardized listing and approval process in which seller onboarding and listing approvals are reviewed by Avatar administrators before going live.</p>
              <p>Avatar reserves the absolute right to approve, reject, edit formatting, request changes, delay publication, delist, disable, downgrade visibility, remove, or archive any listing, course, service profile, webinar page, or user-generated material for reasons including legality, policy breach, poor quality, consumer complaints, security risk, misleading claims, copyright concerns, malware concerns, outdated content, reputational risk, or regulatory exposure.</p>
            </div>
          </section>

          {/* 10 */}
          <section>
            <h2 className={H2}>10. Seller Warranties and Responsibilities</h2>
            <div className={BODY}>
              <p>Each Seller represents, warrants, and undertakes that:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>it owns or controls all rights necessary to list, license, sell, and distribute the relevant tool or digital product;</li>
                <li>the listing is accurate, complete, and not misleading;</li>
                <li>the offered tool is lawful, operational as described, and does not intentionally contain malware, hidden code, or unlawful functionality;</li>
                <li>it will maintain and support the offering in accordance with applicable listing commitments;</li>
                <li>it will respond to Buyer queries and disputes within the timelines prescribed by Avatar;</li>
                <li>it will maintain all applicable tax registrations, statutory records, and business compliance relevant to its activities; and</li>
                <li>it will indemnify Avatar against claims arising from its offering, conduct, content, IP breach, misleading representation, tax non-compliance, or legal violation.</li>
              </ul>
              <p>The business overview makes Sellers fully responsible for the accuracy, functionality, legality, and IP ownership of listed tools, and specifically notes that Avatar is not liable for tool performance issues.</p>
              <p>The business overview also states that sellers must respond to buyer queries within 3 business days and must update or delist broken tools within 14 days of being flagged.</p>
            </div>
          </section>

          {/* 11 */}
          <section>
            <h2 className={H2}>11. Instructor, Partner, and Service Provider Responsibilities</h2>
            <div className={BODY}>
              <p>Each Instructor, Partner, or Service Provider represents, warrants, and undertakes that:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>all educational or service content provided through the Platform is accurate, original or duly licensed, and legally compliant;</li>
                <li>all promised sessions, deliverables, course materials, support commitments, and representations are fulfilled as described;</li>
                <li>all content will be updated where necessary to address material changes in underlying tools, APIs, or technologies;</li>
                <li>all required rights, permissions, teaching credentials, licenses, and approvals are validly held by the relevant provider; and</li>
                <li>Avatar may rely on the provider&apos;s representations in publishing and delivering the offering.</li>
              </ul>
              <p>The business overview states that instructors and partner companies are responsible for the accuracy, quality, originality, and legal ownership of their course materials, and that Avatar is not responsible for educational outcomes of third-party content.</p>
            </div>
          </section>

          {/* 12 */}
          <section>
            <h2 className={H2}>12. Purchases, Access, and License Scope</h2>
            <div className={BODY}>
              <p>A Buyer purchasing or enrolling in any offering through the Platform receives only the rights expressly granted in the applicable listing, order flow, or product page. Unless otherwise expressly stated in writing, every purchase is a limited, non-exclusive, non-transferable, non-sublicensable license or access right for the Buyer&apos;s own lawful internal use.</p>
              <p>The business overview provides that learners receive a personal, non-transferable right-to-use license for enrolled courses and may not redistribute, resell, sublicense, or re-upload course materials, while certificates are issued to the verified enrolled learner and are non-transferable.</p>
              <p>Buyers shall not copy, resell, white-label, sublicense, share credentials for, publicly redistribute, reverse engineer, or commercially exploit purchased offerings beyond the authorized scope.</p>
            </div>
          </section>

          {/* 13 */}
          <section>
            <h2 className={H2}>13. Pricing, Payments, Taxes, and Billing</h2>
            <div className={BODY}>
              <p>Avatar may facilitate Transactions using payment partners and payment methods supported on the Platform from time to time. The business overview lists UPI, cards, net banking, and digital wallets in Phase 1, with other mechanisms such as international cards and EMI in later phases.</p>
              <p>All displayed prices, fees, taxes, commissions, credits, discounts, subscription charges, and billing conditions may be determined by Avatar, the relevant provider, or a combination of both, subject to disclosure at checkout or onboarding.</p>
              <p>The business overview states that every transaction is intended to generate a GST-compliant invoice, that GST treatment may vary based on location, and that TDS may be deducted from seller or instructor payouts under Indian law.</p>
              <p>You authorize Avatar and its payment partners to charge all applicable amounts and to process credits, reversals, settlements, payout deductions, taxes, or refund adjustments as permitted by these Terms and applicable law.</p>
            </div>
          </section>

          {/* 14 */}
          <section>
            <h2 className={H2}>14. Payouts, Holds, Set-Off, and Deductions</h2>
            <div className={BODY}>
              <p>Sellers, Instructors, Partners, and Service Providers receiving funds through the Platform acknowledge that Avatar may apply a payout workflow, holding period, dispute reserve, commission deduction, tax deduction, fee deduction, chargeback adjustment, and fraud review procedure before release of funds.</p>
              <p>The business overview contemplates a 7-day dispute holding period before payout approval, followed by deduction of commission and TDS and transfer of the net amount to the relevant provider.</p>
              <p>Avatar may withhold, defer, reverse, claw back, or set off payouts where necessary to address refunds, consumer complaints, fraud, technical failures, duplicate settlements, tax issues, sanctions screening, legal orders, or suspected violation of these Terms.</p>
            </div>
          </section>

          {/* 15 */}
          <section>
            <h2 className={H2}>15. Subscriptions and Auto-Renewal</h2>
            <div className={BODY}>
              <p>By purchasing a subscription, you authorize recurring charges at the frequency disclosed during checkout or contracting until valid cancellation or termination takes effect. Avatar may modify pricing, features, usage caps, billing cycles, bundling logic, access rules, and renewal terms upon notice as required by applicable law.</p>
              <p>Subscriptions may be subject to non-refundable trial terms, minimum commitment periods, or role-based cancellation schedules published on the Platform.</p>
            </div>
          </section>

          {/* 16 */}
          <section>
            <h2 className={H2}>16. Refunds, Cancellations, and Dispute System</h2>
            <div className={BODY}>
              <p>All sales and access rights are subject to the refund, cancellation, and dispute rules communicated on the Platform and incorporated into these Terms.</p>
              <p>The business overview contemplates a dedicated dispute handling mechanism, under which buyers may open a dispute within 7 days of purchase if a tool is non-functional, misleading, or infected, after which Avatar reviews the submission and may issue a refund, request seller remediation, or release funds.</p>
              <p>Avatar reserves the right to deny refund requests that are submitted outside applicable timelines, lack required evidence, involve customized services already delivered, or exhibit patterns of consumer abuse.</p>
            </div>
          </section>

          {/* 17 */}
          <section>
            <h2 className={H2}>17. Intellectual Property Ownership and Rights</h2>
            <div className={BODY}>
              <p>As between you and Avatar, Avatar and its licensors own all rights, title, and interest in and to the Platform, including software, design, branding, marks, domain names, UI/UX elements, databases, compilation rights, proprietary tools, and first-party content.</p>

              <p>Users retain ownership of their original uploaded tools, datasets, course materials, service work product, reviews, and materials, subject to the non-exclusive license granted to Avatar to host, display, process, market, index, format, deliver, and back up such content for platform operations.</p>
              <p>Nothing in these Terms transfers ownership of third-party IP to Avatar or to another user unless explicitly agreed in a separate written assignment or license agreement.</p>
            </div>
          </section>

          {/* 18 */}
          <section>
            <h2 className={H2}>18. Copyright Takedowns and IP Infringement Notice</h2>
            <div className={BODY}>
              <p>Avatar respects intellectual property rights and maintains an IP takedown procedure. If you believe any content listed on the Platform infringes your copyright, trademark, trade secret, or other proprietary right, you may submit a notice to Avatar&apos;s Grievance Officer with the following information:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Identification of the infringed work or trademark.</li>
                <li>Identification and URL of the allegedly infringing listing or content.</li>
                <li>Your contact details and proof of authorization to act on behalf of the rightsholder.</li>
                <li>A statement that you have a good-faith belief that the use is unauthorized.</li>
                <li>A statement made under penalty of perjury that the notice is accurate.</li>
              </ul>
              <p>Avatar may remove or disable access to the flagged content, notify the affected seller or instructor, and permit counter-notices in accordance with law.</p>
            </div>
          </section>

          {/* 19 */}
          <section>
            <h2 className={H2}>19. Confidentiality and Feedback</h2>
            <div className={BODY}>
              <p>If you receive confidential platform specifications, API documentation, non-public features, beta tools, commercial terms, or security disclosures from Avatar, you agree to keep such information confidential and use it solely for the authorized purpose.</p>
              <p>If you submit feedback, feature requests, bug reports, or suggestions to Avatar, you grant Avatar an irrevocable, royalty-free, perpetual license to use, implement, publish, and commercialize such feedback without restriction or compensation.</p>
            </div>
          </section>

          {/* 20 */}
          <section>
            <h2 className={H2}>20. Data Protection and Privacy</h2>
            <div className={BODY}>
              <p>Avatar processes personal data in accordance with its Privacy Policy and applicable data protection laws, including the Digital Personal Data Protection Act, 2023.</p>
              <p>By using the Platform, you consent to the collection, use, storage, sharing, and processing of personal data as set forth in the Privacy Policy.</p>
              <p>Sellers, Instructors, and Service Providers who receive personal data of Buyers or learners through the Platform agree to process such data strictly for fulfilling the transaction, support, or course delivery, and not for unauthorized marketing, resale, or unlawful harvesting.</p>
            </div>
          </section>

          {/* 21 */}
          <section>
            <h2 className={H2}>21. Moderation, Reviews, and Ratings</h2>
            <div className={BODY}>
              <p>Avatar may operate rating and review features for offerings, courses, instructors, and sellers. Reviews must reflect genuine user experiences and comply with content rules.</p>
              <p>Avatar reserves the right to moderate, hide, remove, or flag fake reviews, incentivized reviews, abusive posts, defamatory comments, competitor spam, or manipulative ratings.</p>
              <p>Users shall not manipulate review systems through automated bots, fake accounts, coordinated rating attacks, or paid review schemes.</p>
            </div>
          </section>

          {/* 22 */}
          <section>
            <h2 className={H2}>22. Third-Party Links, API Integrations, and External Tools</h2>
            <div className={BODY}>
              <p>The Platform may display links, embeds, integrations, API endpoints, webhooks, or references to third-party websites, AI models, storage systems, payment gateways, communication apps, or external tools.</p>
              <p>Avatar is not responsible for the availability, security, terms, content, privacy practices, accuracy, or outputs of third-party tools, APIs, websites, or external applications.</p>
              <p>Your interaction with any third-party tool or service is governed solely by the terms and policies of that third party.</p>
            </div>
          </section>

          {/* 23 */}
          <section>
            <h2 className={H2}>23. Platform Maintenance, Security, and Availability</h2>
            <div className={BODY}>
              <p>Avatar strives to maintain platform availability, security, and performance, but does not guarantee continuous, uninterrupted, error-free, or fully secure operation.</p>
              <p>Avatar may perform maintenance, deploy updates, modify features, adjust API limits, restrict access, or temporarily suspend the Platform for security, technical, operational, or legal reasons without prior notice.</p>
              <p>Avatar is not responsible for data loss, service interruption, transaction failure, or access delay resulting from scheduled maintenance, emergency security patches, network failures, cloud provider downtime, or force majeure events.</p>
            </div>
          </section>

          {/* 24 */}
          <section>
            <h2 className={H2}>24. Suspension, Termination, and Delisting</h2>
            <div className={BODY}>
              <p>Avatar may, at its sole discretion, suspend, restrict, delist, block, or terminate any user account, listing, service profile, course, webinar access, or platform access immediately and without prior notice if:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>you breach these Terms, the Privacy Policy, or operational rules;</li>
                <li>Avatar suspects fraud, cyber abuse, malware, infringement, money laundering, or illegal activity;</li>
                <li>required verification or KYC documents are invalid, incomplete, or fraudulent;</li>
                <li>your listing generates repeated consumer disputes, refund requests, or quality complaints;</li>
                <li>ordered by a court, law enforcement agency, regulator, or statutory authority; or</li>
                <li>necessary to protect Avatar, its users, partners, or the public from legal, financial, or operational harm.</li>
              </ul>
              <p>Upon termination, your right to access or use the Platform ceases immediately. Provisions intended by their nature to survive termination shall remain in effect.</p>
            </div>
          </section>

          {/* 25 */}
          <section>
            <h2 className={H2}>25. Intermediary Allocation of Responsibility</h2>
            <div className={BODY}>
              <p>Avatar&apos;s role is limited to the extent described in these Terms and the Platform architecture. As reflected in the business overview, Avatar&apos;s core responsibilities include operating the Platform, managing onboarding and listing review, processing or facilitating payments, operating dispute and refund systems, protecting platform-level user data, and ensuring the quality of Avatar&apos;s own first-party offerings.</p>
              <p>Nothing in these Terms shall be interpreted as Avatar assuming legal responsibility for third-party content merely by hosting, reviewing, ranking, processing payment for, or facilitating access to such content, except to the extent liability cannot be excluded by law or arises from Avatar&apos;s own independent act, omission, first-party representation, or statutory obligation.</p>
            </div>
          </section>

          {/* 26 */}
          <section>
            <h2 className={H2}>26. Disclaimers and No Guarantees</h2>
            <div className={BODY}>
              <p>Except as expressly set forth in these Terms or required by non-waivable applicable law, the Platform and all listed tools, courses, webinars, services, content, datasets, and features are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express, implied, statutory, or otherwise.</p>
              <p>Avatar expressly disclaims all implied warranties of merchantability, fitness for a particular purpose, title, quiet enjoyment, non-infringement, accuracy, completeness, and availability.</p>
              <p>Avatar does not warrant or guarantee that:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>third-party tools, automations, or courses will meet your specific business or career requirements;</li>
                <li>any course, certification, or webinar will guarantee job placement, revenue, income, exam success, or specific career advancement;</li>
                <li>the Platform or any listed tool will operate without interruption, bug, latency, or security vulnerability; or</li>
                <li>AI outputs generated by third-party tools, scripts, or automations will be error-free, unbiased, non-infringing, or suitable for production deployment.</li>
              </ul>
            </div>
          </section>

          {/* 27 */}
          <section>
            <h2 className={H2}>27. Limitation of Liability</h2>
            <div className={BODY}>
              <p>To the maximum extent permitted by applicable law, Avatar, its directors, officers, employees, agents, affiliates, investors, and service providers shall not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, including loss of profits, loss of revenue, loss of data, loss of goodwill, business interruption, computer failure, third-party tool failure, or cost of substitute goods or services, arising out of or in connection with your access to or use of (or inability to access or use) the Platform or any listed offering.</p>
              <p>To the maximum extent permitted by law, Avatar&apos;s aggregate liability arising out of or relating to these Terms or the Platform shall not exceed the total fees or commission actually received and retained by Avatar in respect of the specific transaction giving rise to the claim, or INR 10,000 (Indian Rupees Ten Thousand), whichever is lower.</p>
              <p>Nothing in these Terms excludes liability that cannot lawfully be excluded or limited.</p>
            </div>
          </section>

          {/* 28 */}
          <section>
            <h2 className={H2}>28. Grievance Redressal and Consumer Interface</h2>
            <div className={BODY}>
              <p>Avatar shall maintain a grievance redressal channel for complaints relating to transactions, listings, refunds, access issues, user conduct, privacy concerns, IP notices, and other Platform matters.</p>
              <p>Indian e-commerce rules require marketplace entities to appoint a grievance officer, acknowledge complaints within 48 hours, and redress complaints within one month.</p>
              <p>Users should submit complaints through the designated Platform mechanism with sufficient transaction details, account information, and evidence to enable resolution.</p>
            </div>
            <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 mb-3">Grievance Officer</p>
              <div className="space-y-2 text-[13px]">
                <p><span className="text-slate-400 mr-2">Name</span><span className="text-slate-800 font-medium">Richa Rathod</span></p>
                <p><span className="text-slate-400 mr-2">Email</span><a href="mailto:cs@aslindustries.in" className="text-brand-600 hover:text-brand-700 transition-colors font-medium">cs@aslindustries.in</a></p>
                <p><span className="text-slate-400 mr-2">Phone</span><a href="tel:+918097207334" className="text-brand-600 hover:text-brand-700 transition-colors font-medium">+91 8097207334</a></p>
                <p><span className="text-slate-400 mr-2">Address</span><span className="text-slate-800 font-medium">NESCO IT Park, 10th Floor Building 4, Goregaon East, Mumbai-400063, Maharashtra, India</span></p>
              </div>
            </div>
          </section>

          {/* 29 */}
          <section>
            <h2 className={H2}>29. Mandatory Regulatory Disclosures</h2>
            <div className={BODY}>
              <p>To support Indian e-commerce compliance, Avatar should prominently display on the website its legal name, principal geographic address of headquarters and branches, website details, customer care contact details, grievance officer details, and key policy disclosures relating to returns, refunds, exchange, warranty, guarantee, delivery, payment methods, and dispute resolution.</p>
              <p>If any listed offering falls within a regulated sector, including financial, health, education, legal, or other restricted domains, the relevant provider remains responsible for obtaining and maintaining all required permissions, disclosures, disclaimers, and approvals.</p>
            </div>
          </section>

          {/* 30 */}
          <section>
            <h2 className={H2}>30. Changes to Terms and Platform</h2>
            <div className={BODY}>
              <p>Avatar may modify the Platform, discontinue features, add restrictions, revise pricing, change technical specifications, alter policies, and amend these Terms from time to time. Updated versions shall be posted on the Platform with the revised date.</p>
              <p>Continued use of the Platform after such update shall constitute acceptance of the revised Terms to the extent permitted by law. Where required, Avatar may seek express acceptance for material changes.</p>
            </div>
          </section>

          {/* 31 */}
          <section>
            <h2 className={H2}>31. Force Majeure</h2>
            <div className={BODY}>
              <p>Avatar shall not be liable for delay or failure in performance caused by events beyond its reasonable control, including natural disasters, cyber incidents, infrastructure outage, internet failure, governmental restrictions, pandemic events, labor unrest, payment network failure, cloud service disruption, or acts of God.</p>
              <p>This clause does not excuse obligations that cannot lawfully be excluded, including statutory consumer obligations where applicable.</p>
            </div>
          </section>

          {/* 32 */}
          <section>
            <h2 className={H2}>32. Governing Law and Jurisdiction</h2>
            <div className={BODY}>
              <p>These Terms shall be governed by and construed in accordance with the laws of India.</p>
              <p>Subject to any non-waivable statutory rights or consumer forum rights, the courts at Mumbai, Maharashtra shall have exclusive jurisdiction over disputes arising out of or relating to these Terms or the Platform.</p>
            </div>
          </section>

          {/* 33 */}
          <section>
            <h2 className={H2}>33. Miscellaneous</h2>
            <div className={BODY}>
              <p>If any provision of these Terms is held invalid, illegal, or unenforceable, the remaining provisions shall continue in full force to the extent permitted by law.</p>
              <p>Avatar&apos;s failure to enforce any provision shall not constitute a waiver. No waiver shall be effective unless made in writing by Avatar.</p>
              <p>You may not assign or transfer your rights or obligations under these Terms without Avatar&apos;s prior written consent. Avatar may assign these Terms or any rights and obligations under them to an affiliate, successor, acquirer, or financing party.</p>
              <p>These Terms, together with the Privacy Policy and any applicable supplemental terms, constitute the entire agreement between the parties in relation to the Platform and supersede prior online understandings relating to the same subject matter.</p>
            </div>
          </section>

          {/* 34 */}
          <section>
            <h2 className={H2}>34. Contact Details</h2>
            <div className="mt-1 rounded-xl border border-slate-200/80 bg-slate-50/80 p-5 space-y-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 mb-3">Avatar Industries Limited</p>
                <div className="space-y-2 text-[13px]">
                  <p><span className="text-slate-400 mr-2">Website</span><Link href="https://www.avatarindia.com" className="text-brand-600 hover:text-brand-700 transition-colors font-medium">www.avatarindia.com</Link></p>
                  <p><span className="text-slate-400 mr-2">Support Email</span><a href="mailto:cs@aslindustries.in" className="text-brand-600 hover:text-brand-700 transition-colors font-medium">cs@aslindustries.in</a></p>
                  <p><span className="text-slate-400 mr-2">Customer Care</span><a href="tel:+918097207334" className="text-brand-600 hover:text-brand-700 transition-colors font-medium">+91 8097207334</a></p>
                  <p><span className="text-slate-400 mr-2">Office</span><span className="text-slate-800 font-medium">NESCO IT Park, 10th Floor Building 4, Goregaon East, Mumbai-400063, Maharashtra, India</span></p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200/80">
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 mb-3">Grievance Officer</p>
                <div className="space-y-2 text-[13px]">
                  <p><span className="text-slate-400 mr-2">Name</span><span className="text-slate-800 font-medium">Richa Rathod</span></p>
                  <p><span className="text-slate-400 mr-2">Email</span><a href="mailto:cs@aslindustries.in" className="text-brand-600 hover:text-brand-700 transition-colors font-medium">cs@aslindustries.in</a></p>
                  <p><span className="text-slate-400 mr-2">Phone</span><a href="tel:+918097207334" className="text-brand-600 hover:text-brand-700 transition-colors font-medium">+91 8097207334</a></p>
                </div>
              </div>
            </div>
          </section>

          {/* Agreement notice */}
          <div className="border-t border-slate-200/80 pt-8">
            <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700 mb-2">Agreement Notice</p>
              <p className="text-[13px] text-slate-600 leading-relaxed mb-2">
                By using the Avatar AI Marketplace Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms &amp; Conditions. If you have any questions or concerns, please contact our Grievance Officer using the details provided above.
              </p>
              <p className="text-[12px] text-slate-400">
                These terms are designed to comply with the Information Technology Act, 2000, Digital Personal Data Protection Act, 2023, Consumer Protection (E-Commerce) Rules, 2020, and other applicable Indian laws.
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
