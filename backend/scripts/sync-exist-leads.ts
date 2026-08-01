import { google } from "googleapis";
import "dotenv/config";
import prisma from "../prisma";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  throw new Error("Google Sheets environment variables are missing.");
}

const auth = new google.auth.JWT({
  email: CLIENT_EMAIL,
  key: PRIVATE_KEY,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({
  version: "v4",
  auth,
});

const SHEET_NAME = "Leads";

const HEADER = [
  "Full Name",
  "Email",
  "Phone Number",
  "Institution",
  "Education",
  "City",
  "State",
  "Country",
  "Payment Completed",
  "Created At",
];

async function ensureHeaderExists() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1:J1`,
  });

  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [HEADER],
      },
    });

    console.log("✅ Header created.");
  }
}

async function getExistingEmails(): Promise<Set<string>> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!B2:B`,
  });

  const rows = res.data.values ?? [];

  return new Set(rows.flat().map((email) => email.toLowerCase().trim()));
}

function formatDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatBoolean(value: boolean) {
  return value ? "Yes" : "No";
}

async function main() {
  console.log("Fetching existing sheet data...");

  await ensureHeaderExists();

  const existingEmails = await getExistingEmails();

  const leads = await prisma.direct2HireLead.findMany({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      fullName: true,
      email: true,
      phoneNumber: true,
      institutionName: true,
      currentEducation: true,
      city: true,
      state: true,
      country: true,
      paymentCompleted: true,
      createdAt: true,
    },
  });

  const rows: string[][] = [];

  for (const lead of leads) {
    if (existingEmails.has(lead.email.toLowerCase())) continue;

    rows.push([
      lead.fullName,
      lead.email,
      lead.phoneNumber,
      lead.institutionName,
      lead.currentEducation,
      lead.city,
      lead.state,
      lead.country,
      formatBoolean(lead.paymentCompleted),
      formatDate(lead.createdAt),
    ]);
  }

  if (!rows.length) {
    console.log("✅ Sheet already up-to-date.");
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:J`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows,
    },
  });

  console.log(`✅ Synced ${rows.length} leads.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
