// AI Adoption copy of the Avatar Industries Limited Privacy Policy.
//
// SOURCE (read-only reference, owned by Avatar Learning — do not import it):
//   client/app/(legal)/privacy-policy/page.tsx  (Version 1.0, effective June 12, 2026)
// The text below is that published policy reproduced word for word, in the same
// order and numbering, restyled for the AI Adoption site. The policy is the
// site-wide policy for www.avatarindia.com / Avatar Industries Limited, so the
// metadata is unchanged. Do not edit legal wording here without legal approval;
// when the source policy is updated, update this copy the same way.
import { B, ContactCard, P, TermGrid, UL, type ContactRow, type LegalDocProps, type LegalSection } from "./LegalDoc";

export const GRIEVANCE_OFFICER: ContactRow[] = [
  { label: "Name", value: "Richa Rathod" },
  { label: "Email", value: "cs@aslindustries.in", href: "mailto:cs@aslindustries.in" },
  { label: "Phone", value: "+91 8097207334", href: "tel:+918097207334" },
  { label: "Address", value: "NESCO IT Park, 10th Floor Building 4, Goregaon East, Mumbai-400063, Maharashtra, India" },
];

const meta: ContactRow[] = [
  { label: "Website", value: "www.avatarindia.com", href: "https://www.avatarindia.com" },
  { label: "Legal Entity", value: "Avatar Industries Limited" },
  { label: "Effective Date", value: "June 12, 2026" },
  { label: "Version", value: "1.0" },
  { label: "Last Updated", value: "June 12, 2026" },
];

const sections: LegalSection[] = [
  {
    title: "Introduction",
    body: (
      <>
        <P>
          This Privacy Policy explains how Avatar Industries Limited, operating the website <B>www.avatarindia.com</B> and related applications, collects, uses, stores, shares, and protects personal data of visitors, registered users, buyers, sellers, instructors, partners, freelancers, and other users of the Avatar platform.
        </P>
        <P>Avatar operates an India-first AI marketplace ecosystem covering AI tools, courses, webinars, communities, and AI-related services.</P>
        <P>
          Avatar acts as a digital platform that enables transactions and interactions between users, including third-party sellers, educators, and service providers, while also providing certain first-party offerings such as Avatar-hosted webinars and platform services.
        </P>
        <P>
          This Privacy Policy is intended to align with the <B>Digital Personal Data Protection Act, 2023</B>, which requires notice-based and consent-based processing of digital personal data, reasonable security safeguards, and grievance redressal rights for data principals.
        </P>
      </>
    ),
  },
  {
    title: "Who We Are",
    body: (
      <>
        <P>
          For the purposes of this Privacy Policy, <B>&quot;Avatar,&quot; &quot;Company,&quot; &quot;we,&quot; &quot;us,&quot;</B> and <B>&quot;our&quot;</B> mean Avatar Industries Limited and its affiliates, successors, and permitted assigns. <B>&quot;You&quot;</B> and <B>&quot;your&quot;</B> mean any user who accesses or uses the platform.
        </P>
        <P>
          Avatar is the data fiduciary for personal data processed through the platform in relation to user accounts, platform administration, transactions, security, analytics, customer support, dispute handling, and compliance records, as contemplated in the business overview.
        </P>
      </>
    ),
  },
  {
    title: "Scope",
    body: (
      <>
        <P>This Privacy Policy applies to:</P>
        <UL
          items={[
            "Visitors browsing the website.",
            "Users creating an account on the platform.",
            "Buyers purchasing or subscribing to AI tools, courses, webinars, or services.",
            "Individual and business sellers listing tools or digital offerings.",
            "Instructors, partner companies, and webinar participants.",
            "Applicants, leads, and persons who contact Avatar through forms, email, chat, or support channels.",
          ]}
        />
        <P>
          This Privacy Policy applies to personal data processed digitally through the website, mobile applications, dashboards, communication tools, payment flows, onboarding forms, and related systems.
        </P>
      </>
    ),
  },
  {
    title: "Categories of Personal Data Collected",
    body: (
      <>
        <P>Avatar may collect the following categories of personal data, depending on how the platform is used:</P>
        <TermGrid
          items={[
            ["Identity data", "Name, date of birth, photograph, profile details, company name, director or authorized signatory details, and government-issued identity information required for verification."],
            ["Contact data", "Email address, mobile number, billing address, registered office address, and correspondence details."],
            ["KYC and compliance data", "Aadhaar details, PAN, GSTIN, bank details, tax identifiers, business registration details, and supporting documents submitted during seller, instructor, partner, or payout onboarding."],
            ["Transaction data", "Order history, invoices, subscriptions, payment status, refunds, disputes, payouts, tax deductions, and related commerce records."],
            ["Usage data", "Login data, IP address, browser type, device details, operating system, app identifiers, referral URLs, session timestamps, clicks, feature usage, and platform activity logs."],
            ["Content data", "Course submissions, reviews, ratings, support messages, forum posts, webinar participation details, uploaded listing materials, screenshots, videos, and communications made through the platform."],
            ["Support and grievance data", "Complaint records, refund requests, takedown notices, dispute submissions, legal correspondence, and grievance redressal records."],
            ["Marketing and preference data", "Newsletter preferences, campaign interactions, survey responses, waitlist forms, and cookie preferences."],
          ]}
        />
        <P>
          Avatar does not intentionally seek unnecessary personal data and expects users to provide only data reasonably required for platform access, lawful onboarding, payment settlement, support, or compliance.
        </P>
      </>
    ),
  },
  {
    title: "How Personal Data Is Collected",
    body: (
      <>
        <P>Avatar may collect personal data through the following methods:</P>
        <UL
          items={[
            "Directly from users during registration, KYC onboarding, checkout, course enrollment, webinar sign-up, support requests, reviews, listing submissions, and account updates.",
            "Automatically through platform usage, cookies, device logs, analytics tools, security systems, and server records.",
            "From payment gateways, KYC vendors, fraud prevention providers, communication providers, or business partners engaged in platform operations.",
            "From third parties where legally permitted, such as sellers, instructors, employers, educational institutions, affiliate partners, or law enforcement agencies.",
          ]}
        />
      </>
    ),
  },
  {
    title: "Purposes of Processing",
    body: (
      <>
        <P>Avatar may process personal data for the following purposes:</P>
        <UL
          items={[
            "Creating and managing user accounts.",
            "Verifying identity, eligibility, seller/instructor status, and business credentials.",
            "Enabling listings, purchases, subscriptions, webinars, courses, certifications, and service requests.",
            "Processing payments, invoices, GST records, TDS deductions, payouts, refunds, and reconciliations.",
            "Facilitating dispute handling, moderation, user support, review systems, and grievance redressal.",
            "Maintaining platform security, fraud prevention, abuse detection, backup, incident response, and legal compliance.",
            "Personalizing search results, recommendations, communications, and user experience.",
            "Conducting analytics, quality control, internal reporting, and product improvement.",
            "Sending service communications, transactional updates, policy notices, marketing messages, and promotional content, subject to applicable consent preferences.",
            "Enforcing contractual rights, protecting legal interests, and responding to lawful requests from regulators, courts, or governmental authorities.",
          ]}
        />
      </>
    ),
  },
  {
    title: "Legal Basis and Consent",
    body: (
      <>
        <P>Avatar processes personal data on one or more of the following bases, as applicable under law:</P>
        <UL
          items={[
            "Your consent.",
            "Performance of a contract or taking steps at your request before entering into a contract.",
            "Compliance with legal obligations, including taxation, invoicing, fraud checks, legal notices, and record-keeping.",
            "Legitimate and lawful operational purposes to the extent permitted by applicable law.",
          ]}
        />
        <P>
          Where consent is relied upon, Avatar will seek clear affirmative action through account flows, forms, checkboxes, cookie banners, or similar consent mechanisms. Under the Digital Personal Data Protection Act, 2023, consent should be free, specific, informed, unconditional, and unambiguous, and users should be able to withdraw consent.
        </P>
        <P>
          Withdrawal of consent will not affect processing already undertaken on a valid legal basis before such withdrawal. However, certain services may become unavailable if essential processing permissions are withdrawn.
        </P>
      </>
    ),
  },
  {
    title: "Disclosure of Personal Data",
    body: (
      <>
        <P>Avatar may share personal data with the following categories of recipients on a need-to-know basis:</P>
        <UL
          items={[
            "Payment processors, banks, billing providers, and settlement partners for transaction execution and reconciliation.",
            "KYC verification providers, fraud detection vendors, cybersecurity service providers, cloud hosting vendors, analytics providers, CRM providers, and communication service providers.",
            "Sellers, instructors, service providers, and partner entities where sharing is required to perform the relevant transaction, enrollment, booking, certification, support, or dispute process.",
            "Professional advisers, auditors, insurers, legal counsel, and compliance consultants.",
            "Government authorities, regulators, law enforcement agencies, courts, and tribunals when required by law, order, or legal process.",
            "Acquirers, investors, restructuring participants, or successors in connection with a merger, acquisition, financing, or business transfer, subject to lawful safeguards.",
          ]}
        />
        <P>Avatar does not sell personal data in the ordinary course of business.</P>
      </>
    ),
  },
  {
    title: "Data Retention",
    body: (
      <>
        <P>
          Avatar retains personal data only for as long as reasonably necessary for the purposes stated in this Privacy Policy, including for account maintenance, contract performance, audits, tax compliance, dispute handling, fraud prevention, and legal record retention.
        </P>
        <P>
          Certain onboarding, KYC, tax, invoice, and transaction records may be retained longer where required under law or where necessary to defend legal claims, investigate fraud, or maintain marketplace integrity.
        </P>
        <P>When data is no longer required, Avatar may delete, anonymize, aggregate, or securely archive it in accordance with applicable law and internal retention schedules.</P>
      </>
    ),
  },
  {
    title: "User Rights",
    body: (
      <>
        <P>Subject to applicable law, you may have the right to:</P>
        <UL
          items={[
            "Request access to personal data processed by Avatar.",
            "Request correction, completion, or updating of inaccurate or incomplete data.",
            "Request erasure of personal data that is no longer necessary or where consent has been withdrawn, subject to legal exceptions.",
            "Withdraw consent for processing where consent is the basis.",
            "Manage communication preferences and certain cookie settings.",
            "Seek grievance redressal in relation to privacy concerns.",
          ]}
        />
        <P>
          The Digital Personal Data Protection Act, 2023 recognizes rights of access to information about personal data, correction and erasure, grievance redressal, and nomination rights for data principals.
        </P>
        <P>Avatar may verify identity before acting on a request and may decline or limit a request where legally permissible.</P>
      </>
    ),
  },
  {
    title: "Cookies and Tracking Technologies",
    body: (
      <>
        <P>
          Avatar may use cookies, SDKs, pixels, local storage, and similar technologies for authentication, security, analytics, personalization, session continuity, performance monitoring, and marketing.
        </P>
        <P>
          Because cookies may involve collection or use of personal data, notice and consent-based practices are prudent in the evolving Indian privacy landscape, particularly for non-essential cookies.
        </P>
        <P>
          Users may manage cookie preferences through browser settings or any cookie consent tools made available on the platform. Blocking certain cookies may affect the functionality of login, checkout, dashboards, course tracking, or personalized recommendations.
        </P>
        <P>
          Microsoft Clarity: on our public marketing pages we use Microsoft Clarity, a website analytics service, to understand how visitors use the site (for example clicks, scrolling, pages viewed and technical errors) through session recordings and heatmaps. Clarity, Google Tag Manager and the Meta Pixel are loaded only after you choose Accept in the analytics notice, and are never loaded on sign-in, registration, payment, dashboard, profile or administration pages. Text typed into form fields is masked and is not recorded. You can decline, and you can change your choice at any time by clearing this site&apos;s data in your browser. Microsoft processes this data as our service provider under its own privacy terms.
        </P>
      </>
    ),
  },
  {
    title: "Data Security",
    body: (
      <>
        <P>
          Avatar uses reasonable technical, organizational, and contractual safeguards to protect personal data against unauthorized access, disclosure, alteration, loss, misuse, and destruction. These safeguards may include encryption, access controls, audit logs, secure hosting environments, employee confidentiality measures, vendor assessments, and incident response procedures.
        </P>
        <P>The Digital Personal Data Protection Act, 2023 requires implementation of reasonable security safeguards to prevent personal data breaches.</P>
        <P>However, no method of storage or transmission is completely secure, and Avatar cannot guarantee absolute security.</P>
      </>
    ),
  },
  {
    title: "Children's Data",
    body: (
      <>
        <P>
          The platform is not intended for children where use would be prohibited under applicable law or where valid contractual consent cannot be lawfully obtained. Users must meet the eligibility standards set out in the platform terms.
        </P>
        <P>
          Where processing of children&apos;s personal data is triggered, Avatar reserves the right to impose additional age-gating, consent, or verification controls to comply with applicable law.
        </P>
      </>
    ),
  },
  {
    title: "Cross-Border Processing",
    body: (
      <>
        <P>
          Avatar may use service providers or infrastructure located outside India for hosting, communications, analytics, support, storage, or other operational needs, subject to lawful safeguards, contractual protections, and any restrictions imposed by applicable law.
        </P>
        <P>Users acknowledge that platform access may involve transfer, storage, or processing of data across jurisdictions.</P>
      </>
    ),
  },
  {
    title: "Grievance Officer and Contact",
    body: (
      <>
        <P>
          In accordance with applicable e-commerce and data governance expectations, Avatar has designated a grievance officer. The officer&apos;s contact details are published below.
        </P>
        <ContactCard title="Grievance Officer" rows={GRIEVANCE_OFFICER} />
        <P>For privacy-related requests or complaints, users may write to the above contact details with sufficient particulars to identify the account or transaction in question.</P>
      </>
    ),
  },
  {
    title: "Changes to This Privacy Policy",
    body: (
      <>
        <P>
          Avatar may update this Privacy Policy from time to time to reflect changes in law, platform features, business operations, vendor arrangements, or risk controls. Updated versions will be posted on the website with a revised effective date.
        </P>
        <P>Continued use of the platform after an update may constitute acceptance to the extent permitted by law.</P>
      </>
    ),
  },
];

export const PRIVACY_POLICY: LegalDocProps = {
  title: "Privacy Policy",
  subtitle: "How Avatar Industries Limited collects, uses, and protects information through the Avatar AI Adoption platform.",
  meta,
  sections,
  note: {
    title: "Questions or Concerns?",
    body: (
      <>
        <P>
          If you have any questions about this Privacy Policy or how we handle your personal data, please don&apos;t hesitate to reach out to our Grievance Officer using the contact information provided above.
        </P>
        <p style={{ margin: 0, fontSize: 13, color: "#8a939e" }}>This policy is designed to comply with the Digital Personal Data Protection Act, 2023 and other applicable Indian laws.</p>
      </>
    ),
  },
};
