import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Avatar India",
  description: "How Avatar India collects, uses, and protects your personal information.",
};

/* ── Shared typography helpers ── */
const H2 = "text-xl font-semibold text-white mb-4 pb-3 border-b border-white/8";
const BODY = "text-[14px] text-white/60 leading-relaxed space-y-3";

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* ── Page Hero ── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-[12px] text-white/30 mb-4">
          <Link href="/" className="hover:text-brand-400 transition-colors duration-200">Home</Link>
          <span>/</span>
          <span className="text-white/50">Privacy Policy</span>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 mb-2">
          Your Privacy Matters
        </p>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
          Privacy Policy
        </h1>
        <p className="text-white/40 text-[14px]">
          How we collect, use, and protect your personal data on the Avatar India platform.
        </p>
      </div>

      {/* ── Meta card ── */}
      <div className="rounded-2xl border border-white/8 bg-ink-800 p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {[
            { label: "Website", value: "www.avatarindia.com", href: "https://www.avatarindia.com" },
            { label: "Entity", value: "Avatar Industries Limited" },
            { label: "Effective Date", value: "June 12, 2026" },
            { label: "Version", value: "1.0" },
            { label: "Last Updated", value: "June 12, 2026" },
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
            <h2 className={H2}>1. Introduction</h2>
            <div className={BODY}>
              <p>This Privacy Policy explains how Avatar Industries Limited, operating the website <strong className="text-white/85">www.avatarindia.com</strong> and related applications, collects, uses, stores, shares, and protects personal data of visitors, registered users, buyers, sellers, instructors, partners, freelancers, and other users of the Avatar platform.</p>
              <p>Avatar operates an India-first AI marketplace ecosystem covering AI tools, courses, webinars, communities, and AI-related services.</p>
              <p>Avatar acts as a digital platform that enables transactions and interactions between users, including third-party sellers, educators, and service providers, while also providing certain first-party offerings such as Avatar-hosted webinars and platform services.</p>
              <p>This Privacy Policy is intended to align with the <strong className="text-white/85">Digital Personal Data Protection Act, 2023</strong>, which requires notice-based and consent-based processing of digital personal data, reasonable security safeguards, and grievance redressal rights for data principals.</p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className={H2}>2. Who We Are</h2>
            <div className={BODY}>
              <p>For the purposes of this Privacy Policy, <strong className="text-white/85">&quot;Avatar,&quot; &quot;Company,&quot; &quot;we,&quot; &quot;us,&quot;</strong> and <strong className="text-white/85">&quot;our&quot;</strong> mean Avatar Industries Limited and its affiliates, successors, and permitted assigns. <strong className="text-white/85">&quot;You&quot;</strong> and <strong className="text-white/85">&quot;your&quot;</strong> mean any user who accesses or uses the platform.</p>
              <p>Avatar is the data fiduciary for personal data processed through the platform in relation to user accounts, platform administration, transactions, security, analytics, customer support, dispute handling, and compliance records, as contemplated in the business overview.</p>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className={H2}>3. Scope</h2>
            <div className={BODY}>
              <p>This Privacy Policy applies to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Visitors browsing the website.</li>
                <li>Users creating an account on the platform.</li>
                <li>Buyers purchasing or subscribing to AI tools, courses, webinars, or services.</li>
                <li>Individual and business sellers listing tools or digital offerings.</li>
                <li>Instructors, partner companies, and webinar participants.</li>
                <li>Applicants, leads, and persons who contact Avatar through forms, email, chat, or support channels.</li>
              </ul>
              <p>This Privacy Policy applies to personal data processed digitally through the website, mobile applications, dashboards, communication tools, payment flows, onboarding forms, and related systems.</p>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className={H2}>4. Categories of Personal Data Collected</h2>
            <div className={BODY}>
              <p>Avatar may collect the following categories of personal data, depending on how the platform is used:</p>
              <div className="space-y-2.5 rounded-xl border border-white/6 bg-ink-900 p-4">
                {[
                  ["Identity data", "name, date of birth, photograph, profile details, company name, director or authorized signatory details, and government-issued identity information required for verification."],
                  ["Contact data", "email address, mobile number, billing address, registered office address, and correspondence details."],
                  ["KYC and compliance data", "Aadhaar details, PAN, GSTIN, bank details, tax identifiers, business registration details, and supporting documents submitted during seller, instructor, partner, or payout onboarding."],
                  ["Transaction data", "order history, invoices, subscriptions, payment status, refunds, disputes, payouts, tax deductions, and related commerce records."],
                  ["Usage data", "login data, IP address, browser type, device details, operating system, app identifiers, referral URLs, session timestamps, clicks, feature usage, and platform activity logs."],
                  ["Content data", "course submissions, reviews, ratings, support messages, forum posts, webinar participation details, uploaded listing materials, screenshots, videos, and communications made through the platform."],
                  ["Support and grievance data", "complaint records, refund requests, takedown notices, dispute submissions, legal correspondence, and grievance redressal records."],
                  ["Marketing and preference data", "newsletter preferences, campaign interactions, survey responses, waitlist forms, and cookie preferences."],
                ].map(([key, val]) => (
                  <div key={key} className="flex gap-2">
                    <span className="shrink-0 text-brand-400 font-medium text-[13px]">{key}:</span>
                    <span className="text-white/55 text-[13px]">{val}</span>
                  </div>
                ))}
              </div>
              <p>Avatar does not intentionally seek unnecessary personal data and expects users to provide only data reasonably required for platform access, lawful onboarding, payment settlement, support, or compliance.</p>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className={H2}>5. How Personal Data Is Collected</h2>
            <div className={BODY}>
              <p>Avatar may collect personal data through the following methods:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Directly from users during registration, KYC onboarding, checkout, course enrollment, webinar sign-up, support requests, reviews, listing submissions, and account updates.</li>
                <li>Automatically through platform usage, cookies, device logs, analytics tools, security systems, and server records.</li>
                <li>From payment gateways, KYC vendors, fraud prevention providers, communication providers, or business partners engaged in platform operations.</li>
                <li>From third parties where legally permitted, such as sellers, instructors, employers, educational institutions, affiliate partners, or law enforcement agencies.</li>
              </ul>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className={H2}>6. Purposes of Processing</h2>
            <div className={BODY}>
              <p>Avatar may process personal data for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Creating and managing user accounts.</li>
                <li>Verifying identity, eligibility, seller/instructor status, and business credentials.</li>
                <li>Enabling listings, purchases, subscriptions, webinars, courses, certifications, and service requests.</li>
                <li>Processing payments, invoices, GST records, TDS deductions, payouts, refunds, and reconciliations.</li>
                <li>Facilitating dispute handling, moderation, user support, review systems, and grievance redressal.</li>
                <li>Maintaining platform security, fraud prevention, abuse detection, backup, incident response, and legal compliance.</li>
                <li>Personalizing search results, recommendations, communications, and user experience.</li>
                <li>Conducting analytics, quality control, internal reporting, and product improvement.</li>
                <li>Sending service communications, transactional updates, policy notices, marketing messages, and promotional content, subject to applicable consent preferences.</li>
                <li>Enforcing contractual rights, protecting legal interests, and responding to lawful requests from regulators, courts, or governmental authorities.</li>
              </ul>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className={H2}>7. Legal Basis and Consent</h2>
            <div className={BODY}>
              <p>Avatar processes personal data on one or more of the following bases, as applicable under law:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Your consent.</li>
                <li>Performance of a contract or taking steps at your request before entering into a contract.</li>
                <li>Compliance with legal obligations, including taxation, invoicing, fraud checks, legal notices, and record-keeping.</li>
                <li>Legitimate and lawful operational purposes to the extent permitted by applicable law.</li>
              </ul>
              <p>Where consent is relied upon, Avatar will seek clear affirmative action through account flows, forms, checkboxes, cookie banners, or similar consent mechanisms. Under the Digital Personal Data Protection Act, 2023, consent should be free, specific, informed, unconditional, and unambiguous, and users should be able to withdraw consent.</p>
              <p>Withdrawal of consent will not affect processing already undertaken on a valid legal basis before such withdrawal. However, certain services may become unavailable if essential processing permissions are withdrawn.</p>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className={H2}>8. Disclosure of Personal Data</h2>
            <div className={BODY}>
              <p>Avatar may share personal data with the following categories of recipients on a need-to-know basis:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Payment processors, banks, billing providers, and settlement partners for transaction execution and reconciliation.</li>
                <li>KYC verification providers, fraud detection vendors, cybersecurity service providers, cloud hosting vendors, analytics providers, CRM providers, and communication service providers.</li>
                <li>Sellers, instructors, service providers, and partner entities where sharing is required to perform the relevant transaction, enrollment, booking, certification, support, or dispute process.</li>
                <li>Professional advisers, auditors, insurers, legal counsel, and compliance consultants.</li>
                <li>Government authorities, regulators, law enforcement agencies, courts, and tribunals when required by law, order, or legal process.</li>
                <li>Acquirers, investors, restructuring participants, or successors in connection with a merger, acquisition, financing, or business transfer, subject to lawful safeguards.</li>
              </ul>
              <p>Avatar does not sell personal data in the ordinary course of business.</p>
            </div>
          </section>

          {/* 9 */}
          <section>
            <h2 className={H2}>9. Data Retention</h2>
            <div className={BODY}>
              <p>Avatar retains personal data only for as long as reasonably necessary for the purposes stated in this Privacy Policy, including for account maintenance, contract performance, audits, tax compliance, dispute handling, fraud prevention, and legal record retention.</p>
              <p>Certain onboarding, KYC, tax, invoice, and transaction records may be retained longer where required under law or where necessary to defend legal claims, investigate fraud, or maintain marketplace integrity.</p>
              <p>When data is no longer required, Avatar may delete, anonymize, aggregate, or securely archive it in accordance with applicable law and internal retention schedules.</p>
            </div>
          </section>

          {/* 10 */}
          <section>
            <h2 className={H2}>10. User Rights</h2>
            <div className={BODY}>
              <p>Subject to applicable law, you may have the right to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Request access to personal data processed by Avatar.</li>
                <li>Request correction, completion, or updating of inaccurate or incomplete data.</li>
                <li>Request erasure of personal data that is no longer necessary or where consent has been withdrawn, subject to legal exceptions.</li>
                <li>Withdraw consent for processing where consent is the basis.</li>
                <li>Manage communication preferences and certain cookie settings.</li>
                <li>Seek grievance redressal in relation to privacy concerns.</li>
              </ul>
              <p>The Digital Personal Data Protection Act, 2023 recognizes rights of access to information about personal data, correction and erasure, grievance redressal, and nomination rights for data principals.</p>
              <p>Avatar may verify identity before acting on a request and may decline or limit a request where legally permissible.</p>
            </div>
          </section>

          {/* 11 */}
          <section>
            <h2 className={H2}>11. Cookies and Tracking Technologies</h2>
            <div className={BODY}>
              <p>Avatar may use cookies, SDKs, pixels, local storage, and similar technologies for authentication, security, analytics, personalization, session continuity, performance monitoring, and marketing.</p>
              <p>Because cookies may involve collection or use of personal data, notice and consent-based practices are prudent in the evolving Indian privacy landscape, particularly for non-essential cookies.</p>
              <p>Users may manage cookie preferences through browser settings or any cookie consent tools made available on the platform. Blocking certain cookies may affect the functionality of login, checkout, dashboards, course tracking, or personalized recommendations.</p>
            </div>
          </section>

          {/* 12 */}
          <section>
            <h2 className={H2}>12. Data Security</h2>
            <div className={BODY}>
              <p>Avatar uses reasonable technical, organizational, and contractual safeguards to protect personal data against unauthorized access, disclosure, alteration, loss, misuse, and destruction. These safeguards may include encryption, access controls, audit logs, secure hosting environments, employee confidentiality measures, vendor assessments, and incident response procedures.</p>
              <p>The Digital Personal Data Protection Act, 2023 requires implementation of reasonable security safeguards to prevent personal data breaches.</p>
              <p>However, no method of storage or transmission is completely secure, and Avatar cannot guarantee absolute security.</p>
            </div>
          </section>

          {/* 13 */}
          <section>
            <h2 className={H2}>13. Children&apos;s Data</h2>
            <div className={BODY}>
              <p>The platform is not intended for children where use would be prohibited under applicable law or where valid contractual consent cannot be lawfully obtained. Users must meet the eligibility standards set out in the platform terms.</p>
              <p>Where processing of children&apos;s personal data is triggered, Avatar reserves the right to impose additional age-gating, consent, or verification controls to comply with applicable law.</p>
            </div>
          </section>

          {/* 14 */}
          <section>
            <h2 className={H2}>14. Cross-Border Processing</h2>
            <div className={BODY}>
              <p>Avatar may use service providers or infrastructure located outside India for hosting, communications, analytics, support, storage, or other operational needs, subject to lawful safeguards, contractual protections, and any restrictions imposed by applicable law.</p>
              <p>Users acknowledge that platform access may involve transfer, storage, or processing of data across jurisdictions.</p>
            </div>
          </section>

          {/* 15 */}
          <section>
            <h2 className={H2}>15. Grievance Officer and Contact</h2>
            <div className={BODY}>
              <p>In accordance with applicable e-commerce and data governance expectations, Avatar has designated a grievance officer. The officer&apos;s contact details are published below.</p>
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
            <div className={`${BODY} mt-4`}>
              <p>For privacy-related requests or complaints, users may write to the above contact details with sufficient particulars to identify the account or transaction in question.</p>
            </div>
          </section>

          {/* 16 */}
          <section>
            <h2 className={H2}>16. Changes to This Privacy Policy</h2>
            <div className={BODY}>
              <p>Avatar may update this Privacy Policy from time to time to reflect changes in law, platform features, business operations, vendor arrangements, or risk controls. Updated versions will be posted on the website with a revised effective date.</p>
              <p>Continued use of the platform after an update may constitute acceptance to the extent permitted by law.</p>
            </div>
          </section>

          {/* Footer note */}
          <div className="border-t border-white/8 pt-8">
            <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 mb-2">Questions or Concerns?</p>
              <p className="text-[13px] text-white/60 leading-relaxed mb-2">
                If you have any questions about this Privacy Policy or how we handle your personal data, please don&apos;t hesitate to reach out to our Grievance Officer using the contact information provided above.
              </p>
              <p className="text-[12px] text-white/30">
                This policy is designed to comply with the Digital Personal Data Protection Act, 2023 and other applicable Indian laws.
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
