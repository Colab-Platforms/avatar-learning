import { google } from "googleapis";
import "dotenv/config";

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

const sheets = google.sheets({ version: "v4", auth });

const APPLY = process.argv.includes("--apply");

const TARGETS: { tab: string; header: string }[] = [
  { tab: "Signups", header: "Registered At" },
  { tab: "Leads", header: "Created At" },
];

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function colToLetter(colIndex: number): string {
  let n = colIndex + 1;
  let letter = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Existing values are "YYYY-MM-DD HH:mm" strings built from server-local
// (assumed UTC) Date fields — parse as UTC, shift by IST offset, reformat.
function shiftToIst(value: string): string | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, y, mo, d, h, mi] = match;
  const utcMs = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
  );
  const ist = new Date(utcMs + IST_OFFSET_MS);

  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(
    ist.getUTCDate(),
  )} ${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;
}

async function processTab(tab: string, headerText: string) {
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!1:1`,
  });

  const headerRow = headerRes.data.values?.[0] ?? [];
  const colIndex = headerRow.findIndex(
    (h) => String(h).trim().toLowerCase() === headerText.toLowerCase(),
  );

  if (colIndex === -1) {
    console.error(`[${tab}] Header "${headerText}" not found. Skipping.`);
    return;
  }

  const colLetter = colToLetter(colIndex);
  console.log(`[${tab}] "${headerText}" found in column ${colLetter}.`);

  const colRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!${colLetter}2:${colLetter}`,
  });

  const rows = colRes.data.values ?? [];
  const updated: string[][] = [];
  let skipped = 0;

  for (const row of rows) {
    const original = row[0] ?? "";
    const converted = shiftToIst(original);
    if (converted === null) {
      updated.push([original]);
      if (original) skipped++;
      continue;
    }
    updated.push([converted]);
  }

  console.log(
    `[${tab}] ${rows.length} rows read, ${skipped} unparsable value(s) left untouched.`,
  );

  if (!APPLY) {
    console.log(`[${tab}] Dry run — sample of first 5 conversions:`);
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      console.log(`  "${rows[i]?.[0] ?? ""}" -> "${updated[i]?.[0] ?? ""}"`);
    }
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${tab}!${colLetter}2:${colLetter}${rows.length + 1}`,
    valueInputOption: "RAW",
    requestBody: { values: updated },
  });

  console.log(`[${tab}] ✅ Column ${colLetter} updated (${rows.length} rows).`);
}

async function main() {
  if (!APPLY) {
    console.log("Dry run mode. Pass --apply to write changes.\n");
  }

  for (const target of TARGETS) {
    await processTab(target.tab, target.header);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
