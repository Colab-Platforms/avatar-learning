import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions — Avatar India",
  description: "Terms governing your use of the Avatar India AI learning platform.",
};

/* ── Shared typography helpers ── */
const H2 = "text-xl font-semibold text-white mb-4 pb-3 border-b border-white/8";
const BODY = "text-[14px] text-white/60 leading-relaxed space-y-3";
const STRONG = "font-semibold text-white/85";

export default function TermsConditionPage() {
  return (
    <>
      {/* ── Page Hero ── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-[12px] text-white/30 mb-4">
          <Link href="/" className="hover:text-brand-400 transition-colors duration-200">Home</Link>
          <span>/</span>
          <span className="text-white/50">Terms &amp; Conditions</span>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 mb-2">
          Legal Framework
        </p>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
          Terms &amp; Conditions
        </h1>
        <p className="text-white/40 text-[14px]">
          Please read these terms carefully before using the Avatar India platform.
        </p>
      </div>

      {/* ── Meta card ── */}
      <div className="rounded-2xl border border-white/8 bg-ink-800 p-6 mb-6">
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
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1">{label}</p>
              {href ? (
                <Link href={href} className="text-[13px] font-medium text-brand-400 hover:text-brand-300 transition-colors">
                  {value}
                </Link>
              ) : (
                <p className="text-[13px] font-medium text-white/70">{value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Content card ── */}
      <div className="rounded-2xl border border-white/8 bg-ink-800">
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
              <p>Certain offerings may be sold on a recurring subscription basis, including monthly, annual, metered, bundled, professional, enterprise, or team plans. The business overview identifies recurring tool subscriptions, annual plans, bundled plans, pay-per-use access, and team or enterprise plans as part of the Platform&apos;s commercial model.</p>
              <p>By purchasing a subscription, you authorize recurring charges at the frequency disclosed during checkout or contracting until valid cancellation or termination takes effect. Avatar may modify pricing, features, usage caps, billing cycles, bundling logic, access rules, and renewal terms upon notice as required by applicable law.</p>
              <p>Unless otherwise stated, cancellation stops future billing cycles and does not retroactively reverse charges for the current paid period, except where refund rights expressly apply or mandatory law requires otherwise.</p>
            </div>
          </section>

          {/* 16 */}
          <section>
            <h2 className={H2}>16. Refunds, Cancellations, and Disputes</h2>
            <div className={BODY}>
              <p>All sales and access rights are subject to the refund, cancellation, and dispute rules communicated on the Platform and incorporated into these Terms.</p>
              <p>The business overview provides a structured digital refund model under which tools that do not work as described and are reported within 48 hours may be eligible for refund, duplicate purchases raised within 48 hours may be auto-approved, digital products accessed and functioning as described are generally non-refundable, and certain disputes may be resolved on a case-by-case basis.</p>
              <p>The business overview further provides that course access failures reported within 48 hours may be eligible for refund, courses accessed less than 20 percent within 7 days may be refundable, courses accessed beyond that threshold may become non-refundable, Avatar-cancelled webinars may be refunded or credited, and missed paid webinars may be serviced through recording access instead of refund.</p>
              <p>Avatar may investigate any refund or chargeback request, seek responses from affected counterparties, require supporting evidence, issue a full refund, partial refund, wallet credit, replacement access, rescheduled access, or rejection, and designate the final Platform resolution in accordance with its internal dispute process.</p>
              <p>Marketplace entities in India are also expected to publish return, refund, exchange, warranty, guarantee, delivery, payment, and grievance information clearly and prominently.</p>
            </div>
          </section>

          {/* 17 */}
          <section>
            <h2 className={H2}>17. Intellectual Property Framework</h2>
            <div className={BODY}>
              <p>Avatar retains all rights, title, and interest in and to the Platform itself, including website design, software, code, workflows, databases, data models, user interface, recommendation systems, branding, trademarks, logos, trade dress, certifications, and proprietary first-party content, except for third-party materials lawfully provided by users.</p>
              <p>The business overview states that Sellers retain ownership of their tools, automation scripts, prompts, APIs, agents, and related product IP, while Avatar receives a non-exclusive, royalty-free license to display, promote, and distribute such tools on the Platform and related marketing channels.</p>
              <p>No transfer of ownership occurs merely because content is listed, purchased, viewed, or delivered through the Platform unless a separate written assignment expressly states otherwise.</p>
            </div>
          </section>

          {/* 18 */}
          <section>
            <h2 className={H2}>18. User Content License</h2>
            <div className={BODY}>
              <p>To the extent you upload, submit, publish, transmit, post, or otherwise make available any listing content, screenshots, demo assets, descriptions, reviews, ratings, profile materials, course materials, discussion posts, or other materials on or through the Platform, you grant Avatar a worldwide, non-exclusive, royalty-free, sublicensable, transferable, revocable only upon lawful delisting, and technically necessary license to host, copy, store, format, reproduce, display, adapt for interface purposes, market, distribute, moderate, analyze, and use such materials for Platform operations, promotion, compliance, recommendation, fraud prevention, archival, dispute resolution, and service improvement.</p>
              <p>The business overview similarly contemplates that user community posts remain user-owned while Avatar receives a display license, and that marketplace content is licensed to Avatar for display and distribution purposes rather than transferred in ownership.</p>
            </div>
          </section>

          {/* 19 */}
          <section>
            <h2 className={H2}>19. Reviews, Ratings, and Community Features</h2>
            <div className={BODY}>
              <p>The Platform may allow reviews, ratings, comments, Q&amp;A, forums, event participation, and other interactive features. Such features exist to support transparency, community engagement, and consumer decision-making.</p>
              <p>Users must ensure that all review and community contributions are honest, experience-based, lawful, and non-abusive. Avatar may remove, suppress, refuse, investigate, or preserve any such content where necessary for quality control, legal compliance, fraud detection, evidence preservation, or protection of users and the Platform.</p>
            </div>
          </section>

          {/* 20 */}
          <section>
            <h2 className={H2}>20. Takedown, IP Complaints, and Notice Mechanism</h2>
            <div className={BODY}>
              <p>Any person claiming that content on the Platform infringes copyright, trademark, proprietary rights, privacy rights, or other legal rights may submit a written notice to Avatar containing sufficient particulars of the complainant, the alleged rights, the disputed material, the relevant URL or listing, supporting evidence, and a declaration of good faith.</p>
              <p>Avatar may remove, disable, geo-block, flag, de-index, or temporarily suspend access to disputed material; seek a response or counter-notice from the affected user; preserve records; and take further action against repeat infringers or malicious actors.</p>
              <p>Avatar&apos;s response mechanism is also relevant to maintenance of intermediary due diligence, as Indian law recognizes safe harbour for intermediaries subject to statutory conditions and due diligence obligations.</p>
            </div>
          </section>

          {/* 21 */}
          <section>
            <h2 className={H2}>21. Privacy, Data Security, and Compliance Cooperation</h2>
            <div className={BODY}>
              <p>Processing of personal data through the Platform is governed by the separate Privacy Policy. Users agree that Avatar may collect, store, process, use, disclose, and retain personal data in accordance with that policy and applicable law.</p>
              <p>The Digital Personal Data Protection Act, 2023 provides for consent-based and lawful processing, rights relating to access, correction, erasure, grievance redressal, and duties on data fiduciaries to implement reasonable security safeguards.</p>
              <p>Users shall cooperate with reasonable compliance requests relating to identity verification, security reviews, fraud investigations, legal notices, tax matters, sanctions screening, regulatory inquiries, and data subject rights administration.</p>
            </div>
          </section>

          {/* 22 */}
          <section>
            <h2 className={H2}>22. Intermediary Status and Allocation of Liability</h2>
            <div className={BODY}>
              <p>Avatar&apos;s role is limited to the extent described in these Terms and the Platform architecture. As reflected in the business overview, Avatar&apos;s core responsibilities include operating the Platform, managing onboarding and listing review, processing or facilitating payments, operating dispute and refund systems, protecting platform-level user data, and ensuring the quality of Avatar&apos;s own first-party offerings.</p>
              <p>Nothing in these Terms shall be interpreted as Avatar assuming legal responsibility for third-party content merely by hosting, reviewing, ranking, processing payment for, or facilitating access to such content, except to the extent liability cannot be excluded by law or arises from Avatar&apos;s own independent act, omission, first-party representation, or statutory obligation.</p>
            </div>
          </section>

          {/* 23 */}
          <section>
            <h2 className={H2}>23. Disclaimer of Warranties</h2>
            <div className={BODY}>
              <p>The Platform and all offerings, whether first-party or third-party, are provided on an &quot;as is,&quot; &quot;as available,&quot; and &quot;with all faults&quot; basis to the fullest extent permitted by law.</p>
              <p>Avatar does not warrant uninterrupted availability, merchantability, fitness for a particular purpose, non-infringement, compatibility, profitability, educational outcomes, commercial success, legal sufficiency for a user&apos;s specific business purpose, error-free operation, or freedom from all harmful components, especially in relation to third-party offerings.</p>
            </div>
          </section>

          {/* 24 */}
          <section>
            <h2 className={H2}>24. Limitation of Liability</h2>
            <div className={BODY}>
              <p>To the maximum extent permitted by law, Avatar, its affiliates, officers, directors, employees, shareholders, consultants, contractors, licensors, and service providers shall not be liable for any indirect, incidental, consequential, special, exemplary, punitive, or speculative damages, including loss of profits, revenue, goodwill, anticipated savings, business opportunity, data, reputation, or business interruption, arising out of or in connection with the Platform or any Transaction.</p>
              <p>Without prejudice to any non-excludable statutory rights, Avatar&apos;s aggregate liability arising from any claim or series of related claims shall not exceed the lower of: (a) the amount actually received by Avatar from the claimant in the 3 months preceding the event giving rise to the claim, or (b) INR 10,000, unless a different cap is mandatory under applicable law or separately agreed in writing.</p>
              <p>Nothing in these Terms excludes liability that cannot lawfully be excluded or limited.</p>
            </div>
          </section>

          {/* 25 */}
          <section>
            <h2 className={H2}>25. Indemnity</h2>
            <div className={BODY}>
              <p>You agree to defend, indemnify, and hold harmless Avatar and its affiliates, officers, directors, employees, contractors, agents, and service providers from and against any claims, proceedings, losses, liabilities, damages, penalties, taxes, interest, costs, and expenses, including legal fees, arising out of or relating to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>your breach of these Terms;</li>
                <li>your content, listing, service, course, tool, dataset, or other offering;</li>
                <li>your violation of law or third-party rights;</li>
                <li>your infringement of intellectual property, privacy, consumer, tax, or regulatory rights;</li>
                <li>your fraud, negligence, wilful misconduct, or deceptive trade practice; or</li>
                <li>your failure to obtain required permissions, licenses, or consents.</li>
              </ul>
            </div>
          </section>

          {/* 26 */}
          <section>
            <h2 className={H2}>26. Suspension, Restriction, Delisting, and Termination</h2>
            <div className={BODY}>
              <p>Avatar may, with or without prior notice, suspend, restrict, disable, delist, demonetize, geo-block, de-rank, hold payouts, terminate access, cancel orders, or shut down accounts where Avatar reasonably believes there is fraud, security risk, legal exposure, policy breach, rights infringement, abuse of refunds, harmful content, sanctions concern, non-payment, repeated complaints, or other material risk to users or the Platform.</p>
              <p>Users may stop using the Platform at any time, subject to survival of payment obligations, dispute obligations, licensing rights required for prior transactions, retained records, indemnities, and other clauses intended to survive termination.</p>
            </div>
          </section>

          {/* 27 */}
          <section>
            <h2 className={H2}>27. Communications and Electronic Records</h2>
            <div className={BODY}>
              <p>You consent to receive communications from Avatar electronically, including by email, SMS, in-app notification, dashboard notice, or Platform posting. Such communications may include OTPs, invoices, dispute notices, policy updates, service messages, legal notices, reminders, and commercial communications subject to your preferences and applicable law.</p>
              <p>Electronic records, support tickets, logs, audit trails, invoices, chat records, verification records, and screenshots maintained by Avatar may be relied upon for operational, evidentiary, and dispute purposes, subject to applicable law.</p>
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
            <div className="mt-5 rounded-xl border border-white/8 bg-ink-900 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 mb-3">Grievance Officer</p>
              <div className="space-y-2 text-[13px]">
                <p><span className="text-white/40 mr-2">Name</span><span className="text-white/80">Richa Rathod</span></p>
                <p><span className="text-white/40 mr-2">Email</span><a href="mailto:cs@aslindustries.in" className="text-brand-400 hover:text-brand-300 transition-colors">cs@aslindustries.in</a></p>
                <p><span className="text-white/40 mr-2">Phone</span><a href="tel:+918097207334" className="text-brand-400 hover:text-brand-300 transition-colors">+91 8097207334</a></p>
                <p><span className="text-white/40 mr-2">Address</span><span className="text-white/80">NESCO IT Park, 10th Floor Building 4, Goregaon East, Mumbai-400063, Maharashtra, India</span></p>
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
            <div className="mt-1 rounded-xl border border-white/8 bg-ink-900 p-5 space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 mb-3">Avatar Industries Limited</p>
                <div className="space-y-2 text-[13px]">
                  <p><span className="text-white/40 mr-2">Website</span><Link href="https://www.avatarindia.com" className="text-brand-400 hover:text-brand-300 transition-colors">www.avatarindia.com</Link></p>
                  <p><span className="text-white/40 mr-2">Support Email</span><a href="mailto:cs@aslindustries.in" className="text-brand-400 hover:text-brand-300 transition-colors">cs@aslindustries.in</a></p>
                  <p><span className="text-white/40 mr-2">Customer Care</span><a href="tel:+918097207334" className="text-brand-400 hover:text-brand-300 transition-colors">+91 8097207334</a></p>
                  <p><span className="text-white/40 mr-2">Office</span><span className="text-white/80">NESCO IT Park, 10th Floor Building 4, Goregaon East, Mumbai-400063, Maharashtra, India</span></p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/8">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 mb-3">Grievance Officer</p>
                <div className="space-y-2 text-[13px]">
                  <p><span className="text-white/40 mr-2">Name</span><span className="text-white/80">Richa Rathod</span></p>
                  <p><span className="text-white/40 mr-2">Email</span><a href="mailto:cs@aslindustries.in" className="text-brand-400 hover:text-brand-300 transition-colors">cs@aslindustries.in</a></p>
                  <p><span className="text-white/40 mr-2">Phone</span><a href="tel:+918097207334" className="text-brand-400 hover:text-brand-300 transition-colors">+91 8097207334</a></p>
                </div>
              </div>
            </div>
          </section>

          {/* Agreement notice */}
          <div className="border-t border-white/8 pt-8">
            <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 mb-2">Agreement Notice</p>
              <p className="text-[13px] text-white/60 leading-relaxed mb-2">
                By using the Avatar AI Marketplace Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms &amp; Conditions. If you have any questions or concerns, please contact our Grievance Officer using the details provided above.
              </p>
              <p className="text-[12px] text-white/30">
                These terms are designed to comply with the Information Technology Act, 2000, Digital Personal Data Protection Act, 2023, Consumer Protection (E-Commerce) Rules, 2020, and other applicable Indian laws.
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
