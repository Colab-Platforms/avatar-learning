import { google, sheets_v4 } from "googleapis";

const USERS_SHEET = "Signups";
const LEADS_SHEET = "Leads";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 400;

export type SheetsUserInput = {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phoneNo?: string | null;
  createdAt: Date;
};

export type SheetsLeadInput = {
  fullName: string;
  email: string;
  phoneNumber: string;
  institutionName: string;
  currentEducation: string;
  city: string;
  state: string;
  country: string;
  paymentCompleted: boolean;
  createdAt: Date;
};

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatUserName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  if (!firstName) return "";
  if (!lastName) return firstName;
  return `${firstName} ${lastName}`;
}

function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logSyncSuccess(entity: "User" | "Lead", email: string, sheet: string) {
  console.log(
    `[Google Sheets]\n${entity} synced:\n${email}\n\nSheet:\n${sheet}`,
  );
}

function logSyncFailure(
  entity: "User" | "Lead",
  email: string,
  reason: unknown,
) {
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
        ? reason
        : JSON.stringify(reason);

  console.error(
    `[Google Sheets]\nFailed syncing ${entity}\n\nEmail:\n${email}\n\nReason:\n${message}`,
    reason,
  );
}

class GoogleSheetsService {
  private sheets: sheets_v4.Sheets | null = null;
  private initPromise: Promise<sheets_v4.Sheets | null> | null = null;
  private verifiedSheetIds = new Set<string>();

  private getConfig() {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!spreadsheetId || !clientEmail || !privateKey) {
      return null;
    }

    return { spreadsheetId, clientEmail, privateKey };
  }

  private async getClient(): Promise<{
    sheets: sheets_v4.Sheets;
    spreadsheetId: string;
  } | null> {
    const config = this.getConfig();
    if (!config) {
      console.error(
        "[Google Sheets]\nFailed syncing\n\nReason:\nGoogle Sheets environment variables are missing.",
      );
      return null;
    }

    if (this.sheets) {
      return { sheets: this.sheets, spreadsheetId: config.spreadsheetId };
    }

    if (!this.initPromise) {
      this.initPromise = this.initialize(config);
    }

    const sheets = await this.initPromise;
    if (!sheets) return null;

    return { sheets, spreadsheetId: config.spreadsheetId };
  }

  private async initialize(config: {
    spreadsheetId: string;
    clientEmail: string;
    privateKey: string;
  }): Promise<sheets_v4.Sheets | null> {
    try {
      const auth = new google.auth.JWT({
        email: config.clientEmail,
        key: config.privateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const sheets = google.sheets({ version: "v4", auth });
      this.sheets = sheets;
      return sheets;
    } catch (err) {
      this.initPromise = null;
      this.sheets = null;
      console.error(
        "[Google Sheets]\nFailed initializing Google Sheets client\n\nReason:\n",
        err,
      );
      return null;
    }
  }

  private async verifySheetAvailable(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    sheetName: string,
  ): Promise<void> {
    const cacheKey = `${spreadsheetId}:${sheetName}`;
    if (this.verifiedSheetIds.has(cacheKey)) return;

    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties.title",
    });

    const titles =
      meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) ?? [];

    if (!titles.includes(sheetName)) {
      throw new Error(`Sheet tab "${sheetName}" was not found in the spreadsheet.`);
    }

    this.verifiedSheetIds.add(cacheKey);
  }

  private async appendRow(
    sheetName: string,
    values: string[],
  ): Promise<void> {
    const client = await this.getClient();
    if (!client) {
      throw new Error("Google Sheets client is not available.");
    }

    const { sheets, spreadsheetId } = client;

    await this.verifySheetAvailable(sheets, spreadsheetId, sheetName);

    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A:Z`,
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          requestBody: { values: [values] },
        });
        return;
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }

    throw lastError;
  }

  /**
   * Append a newly created user to the Users sheet.
   * Never throws — failures are logged only.
   */
  async appendUser(user: SheetsUserInput): Promise<void> {
    try {
      await this.appendRow(USERS_SHEET, [
        formatUserName(user.firstName, user.lastName),
        user.email,
        user.phoneNo ?? "",
        formatDate(user.createdAt),
      ]);
      logSyncSuccess("User", user.email, USERS_SHEET);
    } catch (err) {
      logSyncFailure("User", user.email, err);
    }
  }

  /**
   * Append a newly created Direct2Hire lead to the Leads sheet.
   * Never throws — failures are logged only.
   */
  async appendLead(lead: SheetsLeadInput): Promise<void> {
    try {
      await this.appendRow(LEADS_SHEET, [
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
      logSyncSuccess("Lead", lead.email, LEADS_SHEET);
    } catch (err) {
      logSyncFailure("Lead", lead.email, err);
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;
