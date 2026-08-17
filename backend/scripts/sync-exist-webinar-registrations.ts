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

const SHEET_NAME = "Webinar Registrations";

const HEADER = ["Name", "Email", "Phone Number", "Amount Paid", "Paid At"];

async function ensureHeaderExists() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1:E1`,
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

// Neon returns UTC instants regardless of the server's local timezone — shift
// by the fixed IST offset and read back with UTC getters so this is correct
// no matter what timezone the script runs in (see convert-time-to-ist.ts).
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function formatDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const ist = new Date(date.getTime() + IST_OFFSET_MS);

  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(
    ist.getUTCDate(),
  )} ${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;
}

// amount is stored in paise (smallest currency unit) — convert to rupees.
function formatAmount(amountPaise: number): string {
  return (amountPaise / 100).toFixed(2);
}

async function main() {
  console.log("Fetching existing sheet data...");

  await ensureHeaderExists();

  const existingEmails = await getExistingEmails();

  const registrations = await prisma.webinarRegistration.findMany({
    where: { status: "PAID" },
    orderBy: { paidAt: "asc" },
    select: {
      name: true,
      email: true,
      phoneNumber: true,
      amount: true,
      paidAt: true,
      createdAt: true,
    },
  });

  const rows: string[][] = [];

  for (const registration of registrations) {
    if (existingEmails.has(registration.email.toLowerCase())) continue;

    rows.push([
      registration.name,
      registration.email,
      registration.phoneNumber,
      formatAmount(registration.amount),
      formatDate(registration.paidAt ?? registration.createdAt),
    ]);
  }

  if (!rows.length) {
    console.log("✅ Sheet already up-to-date.");
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:E`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows,
    },
  });

  console.log(`✅ Synced ${rows.length} webinar registrations.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
