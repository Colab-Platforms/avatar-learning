"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Landmark } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/ui";

interface OtherDirectorship {
  name: string;
  designation: string;
}

interface MemberRow {
  name: string;
  designation: string;
  date: string;
  bio?: string;
  otherDirectorships?: OtherDirectorship[];
}

const BOARD_AND_KMP: MemberRow[] = [
  {
    name: "Ms. Richa Rathod",
    designation: "Managing Director & CFO",
    date: "23/04/2026",
    bio: "Mrs. Richa Rathod is a finance professional with practical experience in corporate finance, financial planning & analysis, regulatory compliance, and overall financial operations. She has been actively involved in the finance function, gaining hands-on exposure to accounting processes, financial reporting, budgeting, and internal controls. With her sound understanding of financial management and operational processes, she has consistently contributed to strengthening financial discipline and improving organizational efficiency. Considering her experience, leadership capabilities, and familiarity with the Company's operations, she is well-suited for the role of Managing Director and is expected to effectively lead the Company towards its strategic and operational objectives.",
    otherDirectorships: [{ name: "G 9 HORECA LLP", designation: "Designated Partner" }],
  },
  {
    name: "Mr. Kiran Dilip Thakore",
    designation: "Non - Executive Director",
    date: "27/08/2024",
    bio: "Mr. Kiran Thakore possesses over two decades of extensive experience in business administration, logistics, human resources, and operations management. Throughout his professional career, he has demonstrated strong leadership, managerial, and strategic planning skills across various business functions. He has also provided consultancy services to numerous businesses, leveraging his expertise to support operational efficiency, organizational growth, and business development. His rich experience and professional insight are expected to contribute significantly to the growth and governance of the Company.",
    otherDirectorships: [
      { name: "Shreekrishna Biotech Limited", designation: "Add. Director" },
      { name: "Skybridge Incap Advisory LLP", designation: "Designated Partner" },
      { name: "Skybridge Interactive LLP", designation: "Designated Partner" },
      { name: "Skybridge Lifespaces LLP", designation: "Designated Partner" },
      { name: "Aadhaar Ventures India Limited", designation: "Director" },
      { name: "ASL E-Ventures Private Limited", designation: "Director" },
    ],
  },
  {
    name: "Mr. Yatish Poojary",
    designation: "Non - Executive Independent Director",
    date: "14/08/2025",
    bio: "Mr. Yatish Poojary possesses experience in handling corporate programs and has demonstrated strong organizational and interpersonal skills throughout his professional career. His expertise in coordination, communication, and corporate management is expected to contribute effectively to the Company's operations and governance. As an Independent Director, he is expected to provide objective oversight and strategic guidance, leveraging his experience and professional skills for the overall growth and development of the Company.",
    otherDirectorships: [
      { name: "ASL E-Ventures Private Limited", designation: "Director" },
      { name: "ASL Infineon Ventures Private Limited", designation: "Director" },
    ],
  },
  {
    name: "Mrs. Karina Jadhav",
    designation: "Non- Executive Independent Director",
    date: "12/02/2026",
    bio: "Mrs. Karina Jadhav possesses experience in handling corporate programs and has demonstrated strong organizational and interpersonal skills throughout her professional career. Her expertise in coordination, communication, and corporate management is expected to contribute positively to the Company. As an Independent Director, she will provide objective oversight and valuable guidance to support the Company's strategic growth and governance practices.",
    otherDirectorships: [],
  },
  { name: "Ms. Mansi Vora", designation: "Company Secretary and Compliance Officer", date: "3/12/2025" },
];

const AUDIT_COMMITTEE: MemberRow[] = [
  { name: "Mr. Yatish Poojary", designation: "Chairman and Non - Executive Independent Director", date: "14/08/2025" },
  { name: "Mr. Kiran Dilip Thakore", designation: "Non - Executive Director", date: "27/08/2024" },
  { name: "Mrs. Karina Jadhav", designation: "Non- Executive Independent Director", date: "12/02/2026" },
];

const NRC_COMMITTEE: MemberRow[] = [
  { name: "Mr. Yatish Poojary", designation: "Chairman and Non - Executive Independent Director", date: "14/08/2025" },
  { name: "Mr. Kiran Dilip Thakore", designation: "Non - Executive Director", date: "27/08/2024" },
  { name: "Mrs. Karina Jadhav", designation: "Non- Executive Independent Director", date: "12/02/2026" },
];

const STAKEHOLDERS_COMMITTEE: MemberRow[] = [
  { name: "Mr. Kiran Dilip Thakore", designation: "Chairman and Non - Executive Director", date: "27/08/2024" },
  { name: "Mr. Yatish Poojary", designation: "Non - Executive Independent Director", date: "14/08/2025" },
  { name: "Mrs. Karina Jadhav", designation: "Non- Executive Independent Director", date: "12/02/2026" },
];

const GRIEVANCE_REDRESSAL = {
  name: "Ms. Mansi Vora",
  designation: "Company Secretary and Compliance Officer",
  contact: "8097207334",
  email: "infoaslindustries@gmail.com",
};

function MemberTable({ rows }: { rows: MemberRow[] }) {
  const [openRow, setOpenRow] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 sm:px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">
              Name of Member
            </th>
            <th className="px-4 sm:px-5 py-3 text-left font-semibold text-slate-700">Designation</th>
            <th className="px-4 sm:px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">
              Date of Appointment
            </th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const key = `${row.name}-${row.designation}`;
            const expandable = Boolean(row.bio);
            const isOpen = expandable && openRow === key;
            return (
              <Fragment key={key}>
                <tr
                  onClick={() => expandable && setOpenRow(isOpen ? null : key)}
                  className={`transition-colors ${expandable ? "cursor-pointer hover:bg-slate-50/60" : ""}`}
                  aria-expanded={expandable ? isOpen : undefined}
                >
                  <td className="px-4 sm:px-5 py-3 text-slate-800 font-medium whitespace-nowrap">{row.name}</td>
                  <td className="px-4 sm:px-5 py-3 text-slate-600">{row.designation}</td>
                  <td className="px-4 sm:px-5 py-3 text-slate-600 whitespace-nowrap">{row.date}</td>
                  <td className="px-2 py-3 text-slate-400">
                    {expandable && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    )}
                  </td>
                </tr>
                {isOpen && (
                  <tr className="bg-slate-50/60">
                    <td colSpan={4} className="px-4 sm:px-5 py-4">
                      <p className="text-slate-600 leading-relaxed">{row.bio}</p>
                      {row.otherDirectorships && row.otherDirectorships.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                            Other Directorship Details
                          </h4>
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-sm">
                              <thead className="bg-white border-b border-slate-200">
                                <tr>
                                  <th className="px-3 py-2 text-left font-semibold text-slate-700">
                                    Names of the Companies / bodies corporate / firms / association of individuals
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-slate-700 whitespace-nowrap">
                                    Designation
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {row.otherDirectorships.map((d) => (
                                  <tr key={d.name}>
                                    <td className="px-3 py-2 text-slate-600">{d.name}</td>
                                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{d.designation}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {row.otherDirectorships && row.otherDirectorships.length === 0 && (
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Other Directorship Details: NIL
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Section({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <ScrollReveal>
      <div className="space-y-3">
        <h2 className="text-sm sm:text-base font-bold text-brand-700 uppercase tracking-wide">
          {index}. {title}
        </h2>
        {children}
      </div>
    </ScrollReveal>
  );
}

export default function BoardOfDirectorsPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-800">
      <Navbar />

      {/* Header */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-x pt-28 pb-10 sm:pt-32 sm:pb-12">
          <ScrollReveal>
            <Link
              href="/investors"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition-colors mb-5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Investor Corner
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Board of Directors</h1>
            <p className="mt-3 text-slate-500 max-w-xl">
              Composition of the Board, its committees, and grievance redressal contact details.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Content */}
      <section className="container-x py-10 sm:py-14">
        <div className="max-w-4xl mx-auto space-y-10">
          <Section index={1} title="Composition of Board of Directors and Key Managerial Personnel of the Company">
            <MemberTable rows={BOARD_AND_KMP} />
          </Section>

          <Section index={2} title="Composition of Audit Committee of the Company">
            <MemberTable rows={AUDIT_COMMITTEE} />
          </Section>

          <Section index={3} title="Composition of Nomination and Remuneration Committee of the Company">
            <MemberTable rows={NRC_COMMITTEE} />
          </Section>

          <Section index={4} title="Composition of Stakeholders Relationship Committee of the Company">
            <MemberTable rows={STAKEHOLDERS_COMMITTEE} />
          </Section>

          <Section index={5} title="Grievance Redressal">
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 sm:px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">
                      Name of Member
                    </th>
                    <th className="px-4 sm:px-5 py-3 text-left font-semibold text-slate-700">Designation</th>
                    <th className="px-4 sm:px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">
                      Contact No.
                    </th>
                    <th className="px-4 sm:px-5 py-3 text-left font-semibold text-slate-700">Email ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 sm:px-5 py-3 text-slate-800 font-medium whitespace-nowrap">
                      {GRIEVANCE_REDRESSAL.name}
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-slate-600">{GRIEVANCE_REDRESSAL.designation}</td>
                    <td className="px-4 sm:px-5 py-3 text-slate-600 whitespace-nowrap">
                      {GRIEVANCE_REDRESSAL.contact}
                    </td>
                    <td className="px-4 sm:px-5 py-3">
                      <a
                        href={`mailto:${GRIEVANCE_REDRESSAL.email}`}
                        className="text-brand-600 hover:underline"
                      >
                        {GRIEVANCE_REDRESSAL.email}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
