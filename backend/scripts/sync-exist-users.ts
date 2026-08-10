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

const SHEET_NAME = "Signups";

async function ensureHeaderExists() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1:D1`,
  });

  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [["Name", "Email", "Phone Number", "Registered At"]],
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

async function main() {
  console.log("Fetching existing sheet data...");

  await ensureHeaderExists();

  const existingEmails = await getExistingEmails();

  const users = await prisma.user.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phoneNo: true,
      createdAt: true,
    },
  });

  const rows: string[][] = [];

  for (const user of users) {
    if (existingEmails.has(user.email.toLowerCase())) continue;

    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

    rows.push([
      name,
      user.email,
      user.phoneNo ?? "",
      formatDate(user.createdAt),
    ]);
  }

  if (!rows.length) {
    console.log("✅ Sheet already up-to-date.");
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:D`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows,
    },
  });

  console.log(`✅ Synced ${rows.length} users.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
