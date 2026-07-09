import Link from "next/link";
import { ArrowLeft, Landmark } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/ui";

interface MemberRow {
  name: string;
  designation: string;
  date: string;
}

const BOARD_AND_KMP: MemberRow[] = [
  { name: "Mr. Yatish Poojary", designation: "Non - Executive Independent Director", date: "14/08/2025" },
  { name: "Mr. Kiran Dilip Thakore", designation: "Non - Executive Director", date: "27/08/2024" },
  { name: "Mrs. Karina Jadhav", designation: "Non- Executive Independent Director", date: "12/02/2026" },
  { name: "Ms. Mansi Vora", designation: "Company Secretary and Compliance Officer", date: "3/12/2025" },
  { name: "Ms. Richa Rathod", designation: "Managing Director & CFO", date: "23/04/2026" },
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
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={`${row.name}-${row.designation}`} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 sm:px-5 py-3 text-slate-800 font-medium whitespace-nowrap">{row.name}</td>
              <td className="px-4 sm:px-5 py-3 text-slate-600">{row.designation}</td>
              <td className="px-4 sm:px-5 py-3 text-slate-600 whitespace-nowrap">{row.date}</td>
            </tr>
          ))}
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
